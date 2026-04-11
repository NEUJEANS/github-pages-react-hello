import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const modulePath = '/home/user1_admin/.openclaw/workspace/havenly-live-parallel/server/auth-persistent-store.js'

async function withTempCwd(run) {
  const originalCwd = process.cwd()
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'havenly-auth-store-'))

  try {
    process.chdir(tempDir)
    await run(tempDir)
  } finally {
    process.chdir(originalCwd)
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

function buildRequest({ cookie = '' } = {}) {
  return {
    headers: cookie ? { cookie } : {},
  }
}

async function withEnv(envPatch, run) {
  const original = new Map(Object.keys(envPatch).map((key) => [key, process.env[key]]))

  Object.entries(envPatch).forEach(([key, value]) => {
    if (value == null) {
      delete process.env[key]
      return
    }

    process.env[key] = value
  })

  try {
    await run()
  } finally {
    original.forEach((value, key) => {
      if (value == null) {
        delete process.env[key]
        return
      }

      process.env[key] = value
    })
  }
}

test('signup persists a hashed password and login upgrades legacy plaintext passwords', async () => {
  await withTempCwd(async (tempDir) => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { handleAuthRequest } = await import(moduleUrl)

    const signup = handleAuthRequest(buildRequest(), {
      pathName: '/api/auth/signup',
      body: {
        email: 'fresh@example.com',
        password: 'password123',
        displayName: 'Fresh User',
      },
    })

    assert.equal(signup.status, 200)

    const dbPath = path.join(tempDir, '.data', 'havenly-auth-store.sqlite')
    const db = new DatabaseSync(dbPath)

    const freshUser = db.prepare('SELECT password FROM users WHERE email = ?').get('fresh@example.com')
    assert.match(freshUser.password, /^scrypt\$/)
    assert.notEqual(freshUser.password, 'password123')

    db.prepare('INSERT INTO users (email, password, name, created_at, profile_json, verified_at, account_state_json) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      'legacy@example.com',
      'legacy-pass-123',
      'Legacy User',
      new Date().toISOString(),
      'null',
      null,
      JSON.stringify({ wishlistIds: [], cartItems: [], layoutItems: [], recommendationDraft: null }),
    )

    const legacyLogin = handleAuthRequest(buildRequest(), {
      pathName: '/api/auth/login',
      body: {
        email: 'legacy@example.com',
        password: 'legacy-pass-123',
      },
    })

    assert.equal(legacyLogin.status, 200)

    const legacyUser = db.prepare('SELECT password FROM users WHERE email = ?').get('legacy@example.com')
    assert.match(legacyUser.password, /^scrypt\$/)
    assert.notEqual(legacyUser.password, 'legacy-pass-123')

    db.close()
  })
})

test('complete-profile continuation persists profile data into the sqlite-backed auth session', async () => {
  await withTempCwd(async () => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { handleAuthRequest } = await import(moduleUrl)

    const login = handleAuthRequest(buildRequest(), {
      pathName: '/api/auth/login',
      body: {
        email: 'profile@example.com',
        password: 'password123',
        handoffId: 'profile-handoff-001',
        intent: {
          action: 'complete-profile',
          label: '프로필 마무리',
          returnScreen: 'home',
        },
      },
    })

    assert.equal(login.status, 200)
    assert.equal(login.data.nextAction, 'complete-profile')

    const sessionCookie = login.cookies.find((value) => value.startsWith('havenly_auth_session='))
    assert.ok(sessionCookie)

    const continuation = handleAuthRequest(buildRequest({ cookie: sessionCookie }), {
      pathName: '/api/auth/continue',
      body: {
        handoffId: 'profile-handoff-001',
        continuation: {
          nextAction: 'complete-profile',
          resumeToken: login.data.resumeToken,
        },
        intent: {
          action: 'save-layout-draft',
          label: '보드 저장 이어가기',
          returnScreen: 'layout',
        },
        fields: {
          displayName: 'Havenly User',
          phone: '010-1234-5678',
        },
      },
    })

    assert.equal(continuation.status, 200)
    assert.equal(continuation.data.nextAction, 'save-layout-draft')
    assert.equal(continuation.data.status, 'ready')
    assert.equal(continuation.data.statusLabel, '프로필 준비 완료')
    assert.equal(continuation.data.user.name, 'Havenly User')
    assert.deepEqual(continuation.data.profile, {
      displayName: 'Havenly User',
      phone: '010-1234-5678',
    })

    const session = handleAuthRequest(buildRequest({ cookie: sessionCookie }), {
      pathName: '/api/auth/session',
    })

    assert.equal(session.status, 200)
    assert.equal(session.data.user.name, 'Havenly User')
    assert.deepEqual(session.data.profile, {
      displayName: 'Havenly User',
      phone: '010-1234-5678',
    })
    assert.equal(session.data.nextAction, 'save-layout-draft')
  })
})

test('verify-email continuation persists verification state across subsequent session reads', async () => {
  await withTempCwd(async () => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { handleAuthRequest } = await import(moduleUrl)

    const login = handleAuthRequest(buildRequest(), {
      pathName: '/api/auth/login',
      body: {
        email: 'verify@example.com',
        password: 'password123',
        handoffId: 'verify-handoff-001',
        intent: {
          action: 'verify-email',
          label: '이메일 인증 이어가기',
          returnScreen: 'home',
        },
      },
    })

    assert.equal(login.status, 200)
    assert.equal(login.data.nextAction, 'verify-email')

    const sessionCookie = login.cookies.find((value) => value.startsWith('havenly_auth_session='))
    assert.ok(sessionCookie)

    const continuation = handleAuthRequest(buildRequest({ cookie: sessionCookie }), {
      pathName: '/api/auth/continue',
      body: {
        handoffId: 'verify-handoff-001',
        continuation: {
          nextAction: 'verify-email',
          resumeToken: login.data.resumeToken,
        },
        intent: {
          action: 'checkout-cart',
          label: '주문 이어가기',
          returnScreen: 'home',
        },
        fields: {
          verificationCode: '123456',
        },
      },
    })

    assert.equal(continuation.status, 200)
    assert.equal(continuation.data.nextAction, 'checkout-cart')
    assert.equal(continuation.data.status, 'ready')
    assert.equal(continuation.data.statusLabel, '이메일 인증 완료')
    assert.ok(typeof continuation.data.verifiedAt === 'string' && continuation.data.verifiedAt.length > 0)

    const session = handleAuthRequest(buildRequest({ cookie: sessionCookie }), {
      pathName: '/api/auth/session',
    })

    assert.equal(session.status, 200)
    assert.equal(session.data.nextAction, 'checkout-cart')
    assert.equal(session.data.statusLabel, '이메일 인증 완료')
    assert.equal(session.data.verifiedAt, continuation.data.verifiedAt)
  })
})

test('auth persistent store honors custom data-dir and sqlite path env overrides', async () => {
  await withTempCwd(async (tempDir) => {
    const customDataDir = path.join(tempDir, 'custom-auth-data')
    const customSqlitePath = path.join(tempDir, 'custom-db', 'havenly-auth.sqlite')

    await fs.mkdir(path.dirname(customSqlitePath), { recursive: true })

    await withEnv({
      HAVENLY_AUTH_DATA_DIR: customDataDir,
      HAVENLY_AUTH_SQLITE_PATH: customSqlitePath,
    }, async () => {
      const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
      const { handleAuthRequest, readAuthStorePaths } = await import(moduleUrl)

      const signup = handleAuthRequest(buildRequest(), {
        pathName: '/api/auth/signup',
        body: {
          email: 'custom-store@example.com',
          password: 'password123',
          displayName: 'Custom Store User',
        },
      })

      assert.equal(signup.status, 200)
      assert.equal(readAuthStorePaths().dataDir, customDataDir)
      assert.equal(readAuthStorePaths().sqlitePath, customSqlitePath)

      const dbStat = await fs.stat(customSqlitePath)
      assert.ok(dbStat.isFile())
    })
  })
})

test('readAuthStorePaths prefers explicit options over env defaults for standalone auth server wiring', async () => {
  await withTempCwd(async (tempDir) => {
    const explicitDataDir = path.join(tempDir, 'explicit-auth-data')
    const explicitSqlitePath = path.join(tempDir, 'explicit-db', 'havenly-auth.sqlite')

    await withEnv({
      HAVENLY_AUTH_DATA_DIR: path.join(tempDir, 'env-auth-data'),
      HAVENLY_AUTH_SQLITE_PATH: path.join(tempDir, 'env-db', 'env-auth.sqlite'),
    }, async () => {
      const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
      const { readAuthStorePaths } = await import(moduleUrl)

      assert.deepEqual(
        readAuthStorePaths({
          dataDir: explicitDataDir,
          sqlitePath: explicitSqlitePath,
        }),
        {
          dataDir: explicitDataDir,
          sqlitePath: explicitSqlitePath,
          legacyJsonPath: path.join(explicitDataDir, 'havenly-auth-store.json'),
        },
      )
    })
  })
})
