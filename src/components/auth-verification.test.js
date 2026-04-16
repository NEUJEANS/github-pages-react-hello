import test from 'node:test'
import assert from 'node:assert/strict'

import {
  readAuthScaffoldSession,
  resetAuthScaffoldState,
  submitAuthScaffoldRequest,
} from './auth-backend-scaffold.js'
import {
  openIdentityVerificationWindow,
  readIdentityVerificationStatus,
  resolveVerificationCallbackUrl,
  startIdentityVerification,
} from './auth-verification.js'

function createMemoryStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  }
}

test.beforeEach(() => {
  resetAuthScaffoldState()
})

test('resolveVerificationCallbackUrl prefixes the app base path for same-origin auth callback routes', () => {
  assert.equal(
    resolveVerificationCallbackUrl('/api/auth/verification/callback?verificationId=verify_123&status=verified', {
      appBasePath: '/github-pages-react-hello/',
    }),
    '/github-pages-react-hello/api/auth/verification/callback?verificationId=verify_123&status=verified',
  )
})

test('openIdentityVerificationWindow returns a mock popup descriptor instead of opening a backend window', () => {
  assert.deepEqual(
    openIdentityVerificationWindow('/api/auth/verification/callback?verificationId=verify_123&status=verified', {
      appBasePath: '/github-pages-react-hello/',
    }),
    {
      closed: false,
      mock: true,
      url: '/github-pages-react-hello/api/auth/verification/callback?verificationId=verify_123&status=verified',
    },
  )
})

test('startIdentityVerification completes locally and promotes the scaffold session to verified', async () => {
  const previousSessionStorage = globalThis.sessionStorage
  const previousLocalStorage = globalThis.localStorage
  const previousSetTimeout = globalThis.setTimeout
  const previousWindow = globalThis.window

  globalThis.sessionStorage = createMemoryStorage()
  globalThis.localStorage = createMemoryStorage()
  globalThis.setTimeout = (fn) => {
    fn()
    return 1
  }
  globalThis.window = {
    dispatchEvent: () => true,
  }

  try {
    submitAuthScaffoldRequest({
      request: {
        email: 'verify@example.com',
        password: 'password123',
        handoffId: 'handoff-verify-1',
      },
      connection: {
        method: 'POST',
        endpoint: '/api/auth/login',
        resolvedUrl: '/api/auth/login',
        targetLabel: 'same-origin /api auth scaffold',
        isExternal: false,
        isSameOriginScaffold: true,
        credentialsMode: 'include',
        source: 'frontend-scaffold',
      },
    })

    const started = await startIdentityVerification({
      authConfig: { appBasePath: '/github-pages-react-hello/' },
      continuation: { nextAction: 'verify-email' },
      intent: { action: 'resume-authenticated-flow' },
    })

    assert.equal(started.ok, true)
    assert.equal(typeof started.data.verificationId, 'string')

    const status = await readIdentityVerificationStatus({ verificationId: started.data.verificationId })
    assert.equal(status.ok, true)
    assert.equal(status.data.status, 'verified')

    const session = readAuthScaffoldSession()
    assert.equal(session.status, 200)
    assert.equal(session.data.status, 'ready')
    assert.equal(session.data.statusLabel, '이메일 인증 완료')
    assert.ok(session.data.verifiedAt)
  } finally {
    globalThis.sessionStorage = previousSessionStorage
    globalThis.localStorage = previousLocalStorage
    globalThis.setTimeout = previousSetTimeout
    globalThis.window = previousWindow
  }
})
