import test from 'node:test'
import assert from 'node:assert/strict'

import { resetAuthScaffoldState } from './auth-backend-scaffold.js'
import {
  readAuthPending,
  readAuthSession,
  resolveAuthEndpoint,
  signOutAuthSession,
  submitAuthContinuationPlan,
  submitAuthLoginPlan,
  submitAuthSignupPlan,
} from './auth-submit.js'

test.beforeEach(() => {
  resetAuthScaffoldState()
})

test('resolveAuthEndpoint keeps auth routes same-origin and prefixes the app base path', () => {
  assert.equal(resolveAuthEndpoint('/api/auth/login'), '/api/auth/login')
  assert.equal(resolveAuthEndpoint('/api/auth/continue', { appBasePath: '/github-pages-react-hello/' }), '/github-pages-react-hello/api/auth/continue')
  assert.equal(resolveAuthEndpoint('https://auth.example.com/login', { appBasePath: '/github-pages-react-hello/' }), 'https://auth.example.com/login')
})

test('submitAuthLoginPlan stays frontend-scaffold-only and ignores remote transport options', async () => {
  const result = await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    handoffId: 'auth-frontend-1',
    request: {
      email: 'user@example.com',
      password: 'password123',
      handoffId: 'auth-frontend-1',
    },
  }, {
    apiBaseUrl: 'https://api.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'same-origin',
    source: 'runtime',
    fetchImpl: async () => {
      throw new Error('frontend scaffold mode should not fetch')
    },
  })

  assert.equal(result.ok, true)
  assert.equal(result.status, 200)
  assert.deepEqual(result.meta, {
    authMode: 'scaffold',
    authTransport: 'frontend-scaffold',
  })
  assert.equal(result.data.user.email, 'user@example.com')
  assert.deepEqual(result.data.connection, {
    method: 'POST',
    endpoint: '/api/auth/login',
    resolvedUrl: '/api/auth/login',
    targetLabel: 'same-origin /api auth scaffold',
    isExternal: false,
    isSameOriginScaffold: true,
    credentialsMode: 'same-origin',
    source: 'frontend-scaffold',
  })
  assert.deepEqual(result.data.actionConnection, {
    method: 'POST',
    endpoint: '/api/auth/continue',
    resolvedUrl: '/api/auth/continue',
    targetLabel: 'same-origin /api auth scaffold',
    isExternal: false,
    isSameOriginScaffold: true,
    credentialsMode: 'same-origin',
    source: 'frontend-scaffold',
  })
})

test('submitAuthSignupPlan keeps signup behavior frontend-only and returns duplicate-account errors from the scaffold', async () => {
  const created = await submitAuthSignupPlan({
    endpoint: '/api/auth/signup',
    method: 'POST',
    request: {
      mode: 'signup',
      email: 'fresh@example.com',
      password: 'password123',
      displayName: 'Fresh User',
      handoffId: 'signup-1',
    },
  })

  assert.equal(created.ok, true)
  assert.equal(created.data.user.email, 'fresh@example.com')

  const duplicate = await submitAuthSignupPlan({
    endpoint: '/api/auth/signup',
    method: 'POST',
    request: {
      mode: 'signup',
      email: 'existing@example.com',
      password: 'password123',
      displayName: 'Fresh User',
      handoffId: 'signup-2',
    },
  })

  assert.equal(duplicate.ok, false)
  assert.equal(duplicate.status, 409)
  assert.equal(duplicate.data.message, 'Account already exists')
  assert.equal(duplicate.data.connection.source, 'frontend-scaffold')
})

test('submitAuthContinuationPlan completes frontend-only profile continuation without network auth wiring', async () => {
  await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    request: {
      email: 'profile@example.com',
      password: 'password123',
      handoffId: 'auth-profile-1',
      continuation: {
        resumeToken: 'auth-profile-1:profile',
        nextAction: 'complete-profile',
      },
    },
  }, {
    appBasePath: '/github-pages-react-hello/',
  })

  const result = await submitAuthContinuationPlan({
    endpoint: '/api/auth/continue',
    method: 'POST',
    handoffId: 'auth-profile-1',
    request: {
      handoffId: 'auth-profile-1',
      continuation: {
        resumeToken: 'auth-profile-1:profile',
        nextAction: 'complete-profile',
      },
      fields: {
        displayName: 'Havenly User',
        phone: '010-1234-5678',
      },
    },
  }, {
    appBasePath: '/github-pages-react-hello/',
  })

  assert.equal(result.ok, true)
  assert.equal(result.status, 200)
  assert.equal(result.data.status, 'ready')
  assert.equal(result.data.nextAction, 'resume-authenticated-flow')
  assert.equal(result.data.profile.displayName, 'Havenly User')
  assert.equal(result.data.actionConnection.resolvedUrl, '/github-pages-react-hello/api/auth/continue')
})

test('readAuthPending exposes merge handoff state from the frontend scaffold', async () => {
  await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    request: {
      email: 'merge@example.com',
      password: 'merge-conflict',
      handoffId: 'auth-merge-1',
      guestDraftSnapshot: {
        continuity: {
          wishlistIds: ['wish-1'],
          cartItems: [{ id: 'cart-1', qty: 1 }],
          layoutItems: [{ id: 'layout-1' }],
        },
      },
    },
  })

  const pending = await readAuthPending({
    endpoint: '/api/auth/pending',
  })

  assert.equal(pending.ok, true)
  assert.equal(pending.status, 200)
  assert.equal(pending.data.handoffId, 'auth-merge-1')
  assert.equal(pending.data.continuation?.nextAction, 'confirm-merge-resolution')
  assert.deepEqual(pending.data.allowedMergeResolutions, ['keep-guest', 'replace-with-account'])
  assert.equal(pending.data.connection.source, 'frontend-scaffold')
  assert.equal(pending.data.actionConnection.endpoint, '/api/auth/continue')
})

test('readAuthSession and signOutAuthSession share the same frontend scaffold state', async () => {
  await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    request: {
      email: 'user@example.com',
      password: 'password123',
      handoffId: 'auth-session-1',
    },
  }, {
    appBasePath: '/github-pages-react-hello/',
  })

  const session = await readAuthSession({
    endpoint: '/api/auth/session',
    appBasePath: '/github-pages-react-hello/',
  })

  assert.equal(session.ok, true)
  assert.equal(session.status, 200)
  assert.equal(session.data.user.email, 'user@example.com')
  assert.equal(session.data.connection.resolvedUrl, '/github-pages-react-hello/api/auth/login')
  assert.deepEqual(session.meta, {
    authMode: 'scaffold',
    authTransport: 'frontend-scaffold',
  })

  const logout = await signOutAuthSession({
    endpoint: '/api/auth/logout',
    appBasePath: '/github-pages-react-hello/',
  })

  assert.equal(logout.ok, true)
  assert.equal(logout.status, 200)
  assert.equal(logout.data.nextAction, 'login-required')
  assert.equal(logout.data.connection.resolvedUrl, '/github-pages-react-hello/api/auth/login')

  const sessionAfterLogout = await readAuthSession({
    endpoint: '/api/auth/session',
    appBasePath: '/github-pages-react-hello/',
    connectionFallbackOverride: {
      method: 'POST',
      endpoint: '/api/auth/login',
      resolvedUrl: '/github-pages-react-hello/api/auth/login',
      targetLabel: 'same-origin /api auth scaffold',
      isExternal: false,
      isSameOriginScaffold: true,
      credentialsMode: 'include',
      source: 'frontend-scaffold',
    },
  })

  assert.equal(sessionAfterLogout.ok, false)
  assert.equal(sessionAfterLogout.status, 401)
  assert.equal(sessionAfterLogout.data.nextAction, 'login-required')
  assert.equal(sessionAfterLogout.data.connection.endpoint, '/api/auth/login')
})
