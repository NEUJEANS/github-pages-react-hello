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

test('auth http server persists signup/login/session state through http cookies and sqlite', async () => {
  await withTempCwd(async (tempDir) => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { startAuthHttpServer } = await import(moduleUrl)
    const authServer = await startAuthHttpServer()

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
    const authServer = await startAuthHttpServer()

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
