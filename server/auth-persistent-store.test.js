import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const modulePath = new URL('./auth-persistent-store.js', import.meta.url).pathname

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

function buildRequest({ cookie = '', headers = {} } = {}) {
  return {
    headers: {
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
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

test('public GitHub Pages auth requests receive cross-site secure session cookies on login, not signup', async () => {
  await withTempCwd(async () => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { handleAuthRequest } = await import(moduleUrl)

    const signup = handleAuthRequest(buildRequest({
      headers: {
        origin: 'https://neujeans.github.io',
        'x-forwarded-proto': 'https',
      },
    }), {
      pathName: '/api/auth/signup',
      body: {
        email: 'public-pages@example.com',
        password: 'password123',
        displayName: 'Public Pages User',
      },
    })

    assert.equal(signup.status, 200)
    assert.equal(signup.data.nextAction, 'retry-login')
    assert.equal(signup.cookies.find((value) => value.startsWith('havenly_auth_session=')), undefined)

    const login = handleAuthRequest(buildRequest({
      headers: {
        origin: 'https://neujeans.github.io',
        'x-forwarded-proto': 'https',
      },
    }), {
      pathName: '/api/auth/login',
      body: {
        email: 'public-pages@example.com',
        password: 'password123',
      },
    })

    assert.equal(login.status, 200)
    const sessionCookie = login.cookies.find((value) => value.startsWith('havenly_auth_session='))
    assert.match(sessionCookie ?? '', /SameSite=None/)
    assert.match(sessionCookie ?? '', /Secure/)
    assert.match(sessionCookie ?? '', /HttpOnly/)
  })
})

test('local auth requests keep lax non-secure cookies for same-machine preview login flows', async () => {
  await withTempCwd(async () => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { handleAuthRequest } = await import(moduleUrl)

    const login = handleAuthRequest(buildRequest({
      headers: {
        origin: 'http://127.0.0.1:4174',
      },
    }), {
      pathName: '/api/auth/login',
      body: {
        email: 'user@example.com',
        password: 'password123',
      },
    })

    assert.equal(login.status, 200)
    const sessionCookie = login.cookies.find((value) => value.startsWith('havenly_auth_session='))
    assert.match(sessionCookie ?? '', /SameSite=Lax/)
    assert.doesNotMatch(sessionCookie ?? '', /Secure/)
    assert.match(sessionCookie ?? '', /HttpOnly/)
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

test('save-layout continuation persists the latest layout draft into sqlite-backed account state', async () => {
  await withTempCwd(async () => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { handleAuthRequest } = await import(moduleUrl)

    const login = handleAuthRequest(buildRequest(), {
      pathName: '/api/auth/login',
      body: {
        email: 'user@example.com',
        password: 'password123',
        handoffId: 'layout-save-handoff-001',
        intent: {
          action: 'save-layout-draft',
          label: '보드 저장 이어가기',
          returnScreen: 'layout',
        },
      },
    })

    assert.equal(login.status, 200)
    const sessionCookie = login.cookies.find((value) => value.startsWith('havenly_auth_session='))
    assert.ok(sessionCookie)

    const continuation = handleAuthRequest(buildRequest({ cookie: sessionCookie }), {
      pathName: '/api/auth/continue',
      body: {
        handoffId: 'layout-save-handoff-001',
        continuation: {
          nextAction: 'save-layout-draft',
          resumeToken: login.data.resumeToken,
        },
        intent: {
          action: 'save-layout-draft',
          label: '보드 저장 이어가기',
          returnScreen: 'layout',
        },
        draftSave: {
          draftLabel: '한남 더현대 84A',
          apartmentLabel: '한남 더현대 84A',
          apartmentSelectionId: 'hannam-hyundai-84a',
          recommendationRoom: '거실',
          recommendationDraft: {
            room: '거실',
            style: '모던',
            priority: '수납',
            lifestyle: ['재택근무', '반려동물'],
            extraRequest: '창가 소파를 중심으로 보고 싶어요',
          },
          selectedSpaceIds: ['living-room'],
          layoutTrayItems: [
            { id: 'tray-plant-1', sourceId: 'plant-001', name: '플랜트', priceLabel: '₩89,000' },
          ],
          layoutItems: [
            { id: 'layout-sofa-1', sourceId: 'sofa-001', x: 24, y: 38, rotation: 0, colorIndex: 1 },
            { id: 'layout-table-1', sourceId: 'table-001', x: 61, y: 46, rotation: 90, colorIndex: 0 },
          ],
        },
      },
    })

    assert.equal(continuation.status, 200)
    assert.equal(continuation.data.nextAction, 'save-layout-draft')
    assert.equal(continuation.data.accountState.layoutItems.length, 2)
    assert.equal(continuation.data.accountState.layoutItems[0].id, 'layout-sofa-1')
    assert.deepEqual(continuation.data.accountState.layoutTrayItems, [
      { id: 'tray-plant-1', sourceId: 'plant-001', name: '플랜트', priceLabel: '₩89,000' },
    ])
    assert.equal(continuation.data.accountState.apartmentSelectionId, 'hannam-hyundai-84a')
    assert.equal(typeof continuation.data.accountState.layoutBoardSavedAt, 'string')
    assert.equal(continuation.data.accountState.recommendationDraft?.room, '거실')

    const session = handleAuthRequest(buildRequest({ cookie: sessionCookie }), {
      pathName: '/api/auth/session',
    })

    assert.equal(session.status, 200)
    assert.equal(session.data.accountState.layoutItems.length, 2)
    assert.equal(session.data.accountState.layoutItems[1].sourceId, 'table-001')
    assert.deepEqual(session.data.accountState.layoutTrayItems, [
      { id: 'tray-plant-1', sourceId: 'plant-001', name: '플랜트', priceLabel: '₩89,000' },
    ])
    assert.equal(session.data.accountState.apartmentSelectionId, 'hannam-hyundai-84a')
    assert.equal(session.data.accountState.draftLabel, '한남 더현대 84A')
    assert.equal(session.data.accountState.apartmentLabel, '한남 더현대 84A')
    assert.deepEqual(session.data.accountState.selectedSpaceIds, ['living-room'])
    assert.equal(typeof session.data.accountState.layoutBoardSavedAt, 'string')
    assert.equal(session.data.accountState.recommendationDraft?.room, '거실')
    assert.equal(session.data.accountState.recommendationDraft?.style, '모던')
    assert.equal(session.data.accountState.recommendationDraft?.priority, '수납')
    assert.deepEqual(session.data.accountState.recommendationDraft?.lifestyle, ['재택근무', '반려동물'])
    assert.equal(session.data.accountState.recommendationDraft?.extraRequest, '창가 소파를 중심으로 보고 싶어요')
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

test('verification start, callback, and status endpoints persist verified auth state in sqlite', async () => {
  await withTempCwd(async () => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { handleAuthRequest } = await import(moduleUrl)

    const login = handleAuthRequest(buildRequest(), {
      pathName: '/api/auth/login',
      body: {
        email: 'verify@example.com',
        password: 'password123',
        handoffId: 'verify-popup-handoff-001',
        intent: {
          action: 'verify-email',
          label: '본인 인증 이어가기',
          returnScreen: 'home',
        },
      },
    })

    assert.equal(login.status, 200)
    const sessionCookie = login.cookies.find((value) => value.startsWith('havenly_auth_session='))
    assert.ok(sessionCookie)

    const start = handleAuthRequest(buildRequest({ cookie: sessionCookie }), {
      pathName: '/api/auth/verification/start',
      body: {
        continuation: {
          nextAction: 'verify-email',
          resumeToken: login.data.resumeToken,
        },
        intent: {
          action: 'checkout-cart',
          label: '주문 이어가기',
          returnScreen: 'home',
        },
      },
    })

    assert.equal(start.status, 202)
    assert.equal(start.data.status, 'pending')
    assert.ok(start.data.verificationId)
    assert.match(start.data.callbackUrl, /\/api\/auth\/verification\/callback\?verificationId=/)

    const pendingStatus = handleAuthRequest(buildRequest({ cookie: sessionCookie }), {
      pathName: '/api/auth/verification/status',
      body: {
        verificationId: start.data.verificationId,
      },
    })

    assert.equal(pendingStatus.status, 200)
    assert.equal(pendingStatus.data.status, 'pending')
    assert.equal(pendingStatus.data.nextAction, 'verify-email')

    const callback = handleAuthRequest(buildRequest(), {
      pathName: '/api/auth/verification/callback',
      body: {
        verificationId: start.data.verificationId,
        status: 'verified',
      },
    })

    assert.equal(callback.status, 200)
    assert.equal(callback.data.status, 'verified')
    assert.ok(callback.data.completedAt)

    const verifiedStatus = handleAuthRequest(buildRequest({ cookie: sessionCookie }), {
      pathName: '/api/auth/verification/status',
      body: {
        verificationId: start.data.verificationId,
      },
    })

    assert.equal(verifiedStatus.status, 200)
    assert.equal(verifiedStatus.data.status, 'verified')
    assert.equal(verifiedStatus.data.statusLabel, '이메일 인증 완료')
    assert.equal(verifiedStatus.data.nextAction, 'resume-authenticated-flow')
    assert.ok(verifiedStatus.data.verifiedAt)

    const session = handleAuthRequest(buildRequest({ cookie: sessionCookie }), {
      pathName: '/api/auth/session',
    })

    assert.equal(session.status, 200)
    assert.equal(session.data.status, 'ready')
    assert.equal(session.data.statusLabel, '이메일 인증 완료')
    assert.equal(session.data.nextAction, 'resume-authenticated-flow')
    assert.equal(session.data.verifiedAt, verifiedStatus.data.verifiedAt)
  })
})

test('layout tracking endpoint increments selected and abandoned component counters', async () => {
  await withTempCwd(async () => {
    const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    const { handleAuthRequest } = await import(moduleUrl)

    const firstSelected = handleAuthRequest(buildRequest(), {
      pathName: '/api/auth/layout/track',
      body: {
        eventType: 'selectedComponent',
        item: { id: 'sofa-001', name: '코튼베이지 모듈 소파' },
      },
    })

    assert.equal(firstSelected.status, 202)
    assert.deepEqual(firstSelected.data.counters, {
      selectedComponent: 1,
      abandonedComponent: 0,
    })

    const abandoned = handleAuthRequest(buildRequest(), {
      pathName: '/api/auth/layout/track',
      body: {
        eventType: 'abandonedComponent',
        item: { id: 'lamp-001', name: '포인트 플로어 램프' },
      },
    })

    assert.equal(abandoned.status, 202)
    assert.deepEqual(abandoned.data.counters, {
      selectedComponent: 1,
      abandonedComponent: 1,
    })

    const secondSelected = handleAuthRequest(buildRequest(), {
      pathName: '/api/auth/layout/track',
      body: {
        eventType: 'selectedComponent',
      },
    })

    assert.equal(secondSelected.status, 202)
    assert.deepEqual(secondSelected.data.counters, {
      selectedComponent: 2,
      abandonedComponent: 1,
    })
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
