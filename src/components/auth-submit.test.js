import test from 'node:test'
import assert from 'node:assert/strict'

import {
  AUTH_CONNECTION_CREDENTIALS_HEADER,
  AUTH_CONNECTION_ENDPOINT_HEADER,
  AUTH_CONNECTION_SOURCE_HEADER,
  AUTH_CONNECTION_TARGET_HEADER,
  AUTH_HANDOFF_HEADER,
  AUTH_NEXT_ACTION_HEADER,
  AUTH_RESUME_TOKEN_HEADER,
  AUTH_SCAFFOLD_HEADER,
  readAuthSession,
  resolveAuthEndpoint,
  signOutAuthSession,
  submitAuthLoginPlan,
} from './auth-submit.js'

test('resolveAuthEndpoint keeps local auth routes by default and prefixes configured api base urls', () => {
  assert.equal(resolveAuthEndpoint('/api/auth/login'), '/api/auth/login')
  assert.equal(resolveAuthEndpoint('/api/auth/login', { apiBaseUrl: 'https://api.example.com/' }), 'https://api.example.com/api/auth/login')
  assert.equal(resolveAuthEndpoint('https://auth.example.com/login', { apiBaseUrl: 'https://api.example.com/' }), 'https://auth.example.com/login')
})

test('submitAuthLoginPlan sends the backend-ready payload as json with handoff correlation metadata', async () => {
  const calls = []
  const result = await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    handoffId: 'auth-20260406123000-2n9c',
    request: {
      email: 'user@example.com',
      password: 'password123',
      guestDraftSnapshot: { continuity: { wishlistIds: ['a'] } },
      mergeResolution: 'keep-guest',
      handoffId: 'auth-20260406123000-2n9c',
      intent: { action: 'save-layout-draft', label: '로그인 후 보드 저장' },
    },
  }, {
    apiBaseUrl: 'https://api.example.com',
    credentialsMode: 'same-origin',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ ok: true, sessionId: 'session-1' }),
      }
    },
  })

  assert.equal(calls[0].url, 'https://api.example.com/api/auth/login')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.credentials, 'same-origin')
  assert.equal(calls[0].options.headers['content-type'], 'application/json')
  assert.equal(calls[0].options.headers[AUTH_HANDOFF_HEADER], 'auth-20260406123000-2n9c')
  assert.equal(calls[0].options.headers[AUTH_CONNECTION_ENDPOINT_HEADER], '/api/auth/login')
  assert.equal(calls[0].options.headers[AUTH_CONNECTION_TARGET_HEADER], 'api.example.com')
  assert.equal(calls[0].options.headers[AUTH_CONNECTION_CREDENTIALS_HEADER], 'same-origin')
  assert.equal(calls[0].options.headers[AUTH_CONNECTION_SOURCE_HEADER], 'default')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    email: 'user@example.com',
    password: 'password123',
    guestDraftSnapshot: { continuity: { wishlistIds: ['a'] } },
    mergeResolution: 'keep-guest',
    handoffId: 'auth-20260406123000-2n9c',
    intent: { action: 'save-layout-draft', label: '로그인 후 보드 저장' },
  })
  assert.deepEqual(result, {
    ok: true,
    status: 200,
    data: { ok: true, sessionId: 'session-1', handoffId: 'auth-20260406123000-2n9c' },
    meta: { authMode: 'remote', authTransport: 'network' },
  })
})

test('submitAuthLoginPlan preserves handoff ids and backend continuation headers on same-origin scaffold responses', async () => {
  const result = await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    handoffId: 'auth-20260406123000-2n9c',
    request: {
      email: 'user@example.com',
      password: 'password123',
      guestDraftSnapshot: null,
      handoffId: 'auth-20260406123000-2n9c',
    },
  }, {
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json',
        [AUTH_SCAFFOLD_HEADER]: 'true',
        [AUTH_RESUME_TOKEN_HEADER]: 'resume-123',
        [AUTH_NEXT_ACTION_HEADER]: 'complete-profile',
      }),
      json: async () => ({ ok: true, sessionId: 'demo-user-example-com' }),
    }),
  })

  assert.equal(result.data.handoffId, 'auth-20260406123000-2n9c')
  assert.equal(result.data.resumeToken, 'resume-123')
  assert.equal(result.data.nextAction, 'complete-profile')
  assert.deepEqual(result.meta, {
    authMode: 'scaffold',
    authTransport: 'same-origin-middleware',
  })
})

test('submitAuthLoginPlan captures text errors from non-json auth scaffolds', async () => {
  const result = await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    handoffId: 'auth-20260406123000-2n9c',
    request: {
      email: 'user@example.com',
      password: 'password123',
      guestDraftSnapshot: null,
      handoffId: 'auth-20260406123000-2n9c',
    },
  }, {
    fetchImpl: async () => ({
      ok: false,
      status: 503,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'Auth service unavailable',
    }),
  })

  assert.deepEqual(result, {
    ok: false,
    status: 503,
    data: { message: 'Auth service unavailable', handoffId: 'auth-20260406123000-2n9c' },
    meta: { authMode: 'remote', authTransport: 'network' },
  })
})

test('readAuthSession reads scaffold session state for frontend bootstrap wiring', async () => {
  const result = await readAuthSession({
    fetchImpl: async (url, options) => {
      assert.equal(url, '/api/auth/session')
      assert.equal(options.method, 'GET')
      assert.equal(options.credentials, 'include')
      return {
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
          [AUTH_SCAFFOLD_HEADER]: 'true',
        }),
        json: async () => ({
          ok: true,
          sessionId: 'demo-user-example-com',
          user: { email: 'user@example.com', name: 'user@example.com' },
          connection: {
            method: 'POST',
            endpoint: '/api/auth/login',
            resolvedUrl: '/api/auth/login',
            targetLabel: 'same-origin /api auth scaffold',
            isExternal: false,
            isSameOriginScaffold: true,
            credentialsMode: 'include',
            source: 'default',
          },
          resumeToken: 'resume-session-123',
          nextAction: 'resume-layout-checkout',
        }),
      }
    },
  })

  assert.deepEqual(result, {
    ok: true,
    status: 200,
    data: {
      ok: true,
      sessionId: 'demo-user-example-com',
      user: { email: 'user@example.com', name: 'user@example.com' },
      connection: {
        method: 'POST',
        endpoint: '/api/auth/login',
        resolvedUrl: '/api/auth/login',
        targetLabel: 'same-origin /api auth scaffold',
        isExternal: false,
        isSameOriginScaffold: true,
        credentialsMode: 'include',
        source: 'default',
      },
      resumeToken: 'resume-session-123',
      nextAction: 'resume-layout-checkout',
    },
    meta: {
      authMode: 'scaffold',
      authTransport: 'same-origin-middleware',
    },
  })
})

test('signOutAuthSession posts to the configured logout endpoint with credentials for scaffold teardown', async () => {
  const calls = []
  const result = await signOutAuthSession({
    endpoint: '/api/auth/logout',
    apiBaseUrl: 'https://api.example.com',
    credentialsMode: 'same-origin',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
          [AUTH_SCAFFOLD_HEADER]: 'true',
        }),
        json: async () => ({ ok: true }),
      }
    },
  })

  assert.deepEqual(calls, [{
    url: 'https://api.example.com/api/auth/logout',
    options: {
      method: 'POST',
      credentials: 'same-origin',
    },
  }])
  assert.deepEqual(result, {
    ok: true,
    status: 200,
    data: { ok: true },
    meta: {
      authMode: 'scaffold',
      authTransport: 'same-origin-middleware',
    },
  })
})
