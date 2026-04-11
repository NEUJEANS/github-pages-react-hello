import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const modulePath = '/home/user1_admin/.openclaw/workspace/havenly-live-parallel/server/auth-http-server.js'

async function withTempCwd(run) {
  const originalCwd = process.cwd()
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'havenly-auth-http-server-'))

  try {
    process.chdir(tempDir)
    await run(tempDir)
  } finally {
    process.chdir(originalCwd)
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

test('auth http server exposes a sqlite-backed health/readiness endpoint', async () => {
  await withTempCwd(async (tempDir) => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { startAuthHttpServer } = await import(moduleUrl)
    const authServer = await startAuthHttpServer({ port: 0 })

    try {
      const response = await fetch(`${authServer.url}/api/auth/health`)
      assert.equal(response.status, 200)

      const payload = await response.json()
      assert.deepEqual(payload, {
        ok: true,
        service: 'havenly-auth-http-server',
        storage: 'sqlite',
        sqlitePath: path.join(tempDir, '.data', 'havenly-auth-store.sqlite'),
      })
    } finally {
      await authServer.close()
    }
  })
})

test('auth http server persists signup/login/session state through http cookies and sqlite', async () => {
  await withTempCwd(async (tempDir) => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { startAuthHttpServer } = await import(moduleUrl)
    const authServer = await startAuthHttpServer({ port: 0 })

    try {
      const signupResponse = await fetch(`${authServer.url}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'proxy-user@example.com',
          password: 'password123',
          displayName: 'Proxy User',
        }),
      })

      assert.equal(signupResponse.status, 200)
      const sessionCookie = signupResponse.headers.getSetCookie().find((value) => value.startsWith('havenly_auth_session='))
      assert.ok(sessionCookie)

      const sessionResponse = await fetch(`${authServer.url}/api/auth/session`, {
        headers: {
          cookie: sessionCookie,
        },
      })
      assert.equal(sessionResponse.status, 200)
      const sessionPayload = await sessionResponse.json()
      assert.equal(sessionPayload.user.email, 'proxy-user@example.com')
      assert.equal(sessionPayload.user.name, 'Proxy User')

      const dbPath = path.join(tempDir, '.data', 'havenly-auth-store.sqlite')
      const stat = await fs.stat(dbPath)
      assert.ok(stat.isFile())
    } finally {
      await authServer.close()
    }
  })
})

test('auth http server preserves continuation headers for merge blockers', async () => {
  await withTempCwd(async () => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { startAuthHttpServer } = await import(moduleUrl)
    const authServer = await startAuthHttpServer({ port: 0 })

    try {
      const response = await fetch(`${authServer.url}/api/auth/login`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'merge@example.com',
          password: 'merge-conflict',
          handoffId: 'proxy-merge-001',
        }),
      })

      assert.equal(response.status, 409)
      assert.equal(response.headers.get('x-havenly-auth-handoff-id'), 'proxy-merge-001')
      assert.equal(response.headers.get('x-havenly-auth-next-action'), 'confirm-merge-resolution')

      const payload = await response.json()
      assert.equal(payload.nextAction, 'confirm-merge-resolution')
      assert.deepEqual(payload.allowedMergeResolutions, ['keep-guest', 'replace-with-account'])
    } finally {
      await authServer.close()
    }
  })
})

test('auth http server prefers forwarded host/proto for action continuation metadata', async () => {
  await withTempCwd(async () => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { startAuthHttpServer } = await import(moduleUrl)
    const authServer = await startAuthHttpServer({ port: 0 })

    try {
      const response = await fetch(`${authServer.url}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-host': '127.0.0.1:4176',
          'x-forwarded-proto': 'http',
        },
        body: JSON.stringify({
          email: 'forwarded-user@example.com',
          password: 'password123',
          displayName: 'Forwarded User',
          handoffId: 'forwarded-host-001',
          intent: {
            action: 'save-layout-draft',
            label: '보드 저장 이어가기',
            returnScreen: 'layout',
          },
        }),
      })

      assert.equal(response.status, 200)
      assert.equal(response.headers.get('x-havenly-auth-scaffold'), 'true')
      assert.equal(response.headers.get('x-havenly-auth-action-connection-endpoint'), '/api/auth/continue')
      assert.equal(response.headers.get('x-havenly-auth-action-connection-target'), '127.0.0.1:4176')

      const payload = await response.json()
      assert.equal(payload.actionConnection?.endpoint, '/api/auth/continue')
      assert.equal(payload.actionConnection?.targetLabel, '127.0.0.1:4176')
      assert.equal(payload.actionConnection?.resolvedUrl, 'http://127.0.0.1:4176/api/auth/continue')
    } finally {
      await authServer.close()
    }
  })
})

test('auth http server completes merge continuation through cookies and persists the resulting session in sqlite', async () => {
  await withTempCwd(async () => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { startAuthHttpServer } = await import(moduleUrl)
    const authServer = await startAuthHttpServer({ port: 0 })

    try {
      const loginResponse = await fetch(`${authServer.url}/api/auth/login`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'merge@example.com',
          password: 'merge-conflict',
          handoffId: 'proxy-merge-continue-001',
          guestDraftSnapshot: {
            continuity: {
              apartmentLabel: '래미안 포레스트 84A',
              selectedRooms: ['거실', '안방'],
              wishlistIds: ['sofa-001', 'table-001'],
              cartItems: [{ id: 'bed-001', qty: 1 }],
              layoutItems: [{ id: 'placed-sofa', sourceId: 'sofa-001', x: 10, y: 16 }],
            },
            recommendationDraft: {
              room: '거실',
              style: 'minimal',
              priority: 'flow',
              lifestyle: ['기본'],
              extraRequest: '',
            },
            spaceProfile: {
              spaces: ['living', 'bed1'],
            },
          },
          intent: {
            action: 'save-layout-draft',
            label: '보드 저장 이어가기',
            returnScreen: 'layout',
          },
        }),
      })

      assert.equal(loginResponse.status, 409)
      const handoffCookie = loginResponse.headers.getSetCookie().find((value) => value.startsWith('havenly_auth_handoff='))
      assert.ok(handoffCookie)

      const blockedPayload = await loginResponse.json()
      assert.equal(blockedPayload.nextAction, 'confirm-merge-resolution')
      assert.ok(blockedPayload.resumeToken)

      const continueResponse = await fetch(`${authServer.url}/api/auth/continue`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: handoffCookie,
        },
        body: JSON.stringify({
          handoffId: 'proxy-merge-continue-001',
          continuation: {
            nextAction: 'confirm-merge-resolution',
            resumeToken: blockedPayload.resumeToken,
          },
          intent: {
            action: 'save-layout-draft',
            label: '보드 저장 이어가기',
            returnScreen: 'layout',
          },
          fields: {
            mergeResolution: 'keep-guest',
          },
        }),
      })

      assert.equal(continueResponse.status, 200)
      const sessionCookie = continueResponse.headers.getSetCookie().find((value) => value.startsWith('havenly_auth_session='))
      assert.ok(sessionCookie)

      const continuedPayload = await continueResponse.json()
      assert.equal(continuedPayload.nextAction, 'save-layout-draft')
      assert.equal(continuedPayload.status, 'ready')
      assert.equal(continuedPayload.user.email, 'merge@example.com')
      assert.equal(continuedPayload.accountState.wishlistIds.length, 2)
      assert.equal(continuedPayload.accountState.cartItems.length, 1)
      assert.equal(continuedPayload.accountState.layoutItems.length, 1)
      assert.equal(continuedPayload.accountState.recommendationDraft?.room, '거실')

      const sessionResponse = await fetch(`${authServer.url}/api/auth/session`, {
        headers: {
          cookie: sessionCookie,
        },
      })

      assert.equal(sessionResponse.status, 200)
      const sessionPayload = await sessionResponse.json()
      assert.equal(sessionPayload.user.email, 'merge@example.com')
      assert.equal(sessionPayload.nextAction, 'save-layout-draft')
      assert.equal(sessionPayload.accountState.wishlistIds.length, 2)
      assert.equal(sessionPayload.accountState.layoutItems.length, 1)
    } finally {
      await authServer.close()
    }
  })
})

test('auth http server cli options prefer explicit args over env defaults', async () => {
  await withTempCwd(async () => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { resolveAuthHttpServerOptions } = await import(moduleUrl)

    assert.deepEqual(
      resolveAuthHttpServerOptions({
        env: {
          HAVENLY_AUTH_HOST: '0.0.0.0',
          HAVENLY_AUTH_PORT: '4999',
        },
        args: ['--host', '127.0.0.1', '--port', '4777'],
      }),
      {
        host: '127.0.0.1',
        port: 4777,
      },
    )
  })
})
