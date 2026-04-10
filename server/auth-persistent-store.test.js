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
