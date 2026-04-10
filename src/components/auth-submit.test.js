import test from 'node:test'
import assert from 'node:assert/strict'

import { resetAuthScaffoldState } from './auth-backend-scaffold.js'

import {
  AUTH_CONNECTION_CREDENTIALS_HEADER,
  AUTH_CONNECTION_ENDPOINT_HEADER,
  AUTH_CONNECTION_METHOD_HEADER,
  AUTH_CONNECTION_SOURCE_HEADER,
  AUTH_CONNECTION_TARGET_HEADER,
  AUTH_HANDOFF_HEADER,
  AUTH_NEXT_ACTION_HEADER,
  AUTH_RESUME_TOKEN_HEADER,
  AUTH_SCAFFOLD_HEADER,
  AUTH_STATUS_HEADER,
  AUTH_STATUS_LABEL_HEADER,
  readAuthPending,
  readAuthSession,
  resolveAuthEndpoint,
  signOutAuthSession,
  submitAuthContinuationPlan,
  submitAuthLoginPlan,
} from './auth-submit.js'

test('resolveAuthEndpoint keeps local auth routes by default and prefixes configured api base urls', () => {
  assert.equal(resolveAuthEndpoint('/api/auth/login'), '/api/auth/login')
  assert.equal(resolveAuthEndpoint('/api/auth/login', { apiBaseUrl: 'https://api.example.com/' }), 'https://api.example.com/api/auth/login')
  assert.equal(resolveAuthEndpoint('/api/auth/continue', { appBasePath: '/github-pages-react-hello/' }), '/github-pages-react-hello/api/auth/continue')
  assert.equal(resolveAuthEndpoint('/api/auth/continue', { apiBaseUrl: 'https://havenly.example.com', appBasePath: '/github-pages-react-hello/', currentOrigin: 'https://havenly.example.com' }), 'https://havenly.example.com/github-pages-react-hello/api/auth/continue')
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
      continuation: { resumeToken: 'resume-123', nextAction: 'confirm-merge-resolution' },
    },
  }, {
    apiBaseUrl: 'https://api.example.com',
    currentOrigin: 'https://havenly.example.com',
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
  assert.equal(calls[0].options.headers[AUTH_CONNECTION_METHOD_HEADER], 'POST')
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
    continuation: { resumeToken: 'resume-123', nextAction: 'confirm-merge-resolution' },
    connection: {
      method: 'POST',
      endpoint: '/api/auth/login',
      resolvedUrl: 'https://api.example.com/api/auth/login',
      targetLabel: 'api.example.com',
      isExternal: true,
      isSameOriginScaffold: false,
      credentialsMode: 'same-origin',
      source: 'default',
    },
  })
  assert.deepEqual(result, {
    ok: true,
    status: 200,
    data: {
      ok: true,
      sessionId: 'session-1',
      handoffId: 'auth-20260406123000-2n9c',
      connection: {
        method: 'POST',
        endpoint: '/api/auth/login',
        resolvedUrl: 'https://api.example.com/api/auth/login',
        targetLabel: 'api.example.com',
        isExternal: true,
        isSameOriginScaffold: false,
        credentialsMode: 'same-origin',
        source: 'default',
      },
    },
    meta: { authMode: 'remote', authTransport: 'network' },
  })
})

test('submitAuthLoginPlan keeps absolute same-origin scaffold targets canonical when api base matches the app origin', async () => {
  const calls = []
  const result = await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    handoffId: 'auth-20260406123000-2n9c',
    request: {
      email: 'user@example.com',
      password: 'password123',
      handoffId: 'auth-20260406123000-2n9c',
    },
  }, {
    apiBaseUrl: 'https://havenly.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'include',
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

  assert.equal(calls[0].url, 'https://havenly.example.com/api/auth/login')
  assert.equal(calls[0].options.headers[AUTH_CONNECTION_TARGET_HEADER], 'same-origin /api auth scaffold')
  assert.deepEqual(result.data.connection, {
    method: 'POST',
    endpoint: '/api/auth/login',
    resolvedUrl: 'https://havenly.example.com/api/auth/login',
    targetLabel: 'same-origin /api auth scaffold',
    isExternal: false,
    isSameOriginScaffold: true,
    credentialsMode: 'include',
    source: 'default',
  })
})

test('submitAuthLoginPlan falls back to the local scaffold store when an absolute same-origin auth endpoint is offline', async () => {
  resetAuthScaffoldState()

  const result = await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    handoffId: 'auth-20260406123000-2n9c',
    request: {
      email: 'user@example.com',
      password: 'password123',
      handoffId: 'auth-20260406123000-2n9c',
    },
  }, {
    apiBaseUrl: 'https://havenly.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'include',
    fetchImpl: async () => {
      throw new Error('connect ECONNREFUSED')
    },
  })

  assert.equal(result.ok, true)
  assert.equal(result.status, 200)
  assert.equal(result.meta.authMode, 'scaffold')
  assert.equal(result.meta.authTransport, 'local-fallback')
  assert.equal(result.data.connection.targetLabel, 'same-origin /api auth scaffold')
  assert.equal(result.data.connection.resolvedUrl, 'https://havenly.example.com/api/auth/login')
})

test('readAuthSession, readAuthPending, and signOutAuthSession share the same local same-origin scaffold store', async () => {
  resetAuthScaffoldState()

  await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    handoffId: 'auth-20260406123000-2n9c',
    request: {
      email: 'merge@example.com',
      password: 'merge-conflict',
      handoffId: 'auth-20260406123000-2n9c',
      guestDraftSnapshot: {
        continuity: {
          wishlistIds: ['wish-1'],
          cartItems: [{ id: 'cart-1', qty: 1 }],
          layoutItems: [{ id: 'layout-1' }],
        },
      },
    },
  }, {
    apiBaseUrl: 'https://havenly.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'include',
    fetchImpl: async () => {
      throw new Error('connect ECONNREFUSED')
    },
  })

  const pending = await readAuthPending({
    endpoint: '/api/auth/pending',
    apiBaseUrl: 'https://havenly.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'include',
    fetchImpl: async () => {
      throw new Error('connect ECONNREFUSED')
    },
  })

  assert.equal(pending.status, 200)
  assert.equal(pending.meta.authMode, 'scaffold')
  assert.equal(pending.data.handoffId, 'auth-20260406123000-2n9c')
  assert.equal(pending.data.connection.targetLabel, 'same-origin /api auth scaffold')
  assert.deepEqual(pending.data.actionConnection, {
    method: 'POST',
    endpoint: '/api/auth/continue',
    resolvedUrl: '/api/auth/continue',
    targetLabel: 'same-origin /api auth scaffold',
    isExternal: false,
    isSameOriginScaffold: true,
    credentialsMode: 'include',
    source: 'default',
  })

  await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    handoffId: 'auth-20260406123000-2n9c',
    request: {
      email: 'merge@example.com',
      password: 'merge-conflict',
      mergeResolution: 'replace-with-account',
      handoffId: 'auth-20260406123000-2n9c',
      guestDraftSnapshot: {
        continuity: {
          wishlistIds: ['wish-1'],
          cartItems: [{ id: 'cart-1', qty: 1 }],
          layoutItems: [{ id: 'layout-1' }],
        },
      },
    },
  }, {
    apiBaseUrl: 'https://havenly.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'include',
    fetchImpl: async () => {
      throw new Error('connect ECONNREFUSED')
    },
  })

  const session = await readAuthSession({
    endpoint: '/api/auth/session',
    apiBaseUrl: 'https://havenly.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'include',
    fetchImpl: async () => {
      throw new Error('connect ECONNREFUSED')
    },
  })

  assert.equal(session.status, 200)
  assert.equal(session.meta.authTransport, 'local-fallback')
  assert.equal(session.data.user.email, 'merge@example.com')
  assert.equal(session.data.connection.resolvedUrl, 'https://havenly.example.com/api/auth/login')
  assert.equal(session.data.actionConnection?.endpoint, '/api/auth/continue')

  const logout = await signOutAuthSession({
    endpoint: '/api/auth/logout',
    apiBaseUrl: 'https://havenly.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'include',
    fetchImpl: async () => {
      throw new Error('connect ECONNREFUSED')
    },
  })

  assert.equal(logout.status, 200)
  assert.equal(logout.meta.authMode, 'scaffold')
  assert.equal(logout.data.nextAction, 'login-required')

  const sessionAfterLogout = await readAuthSession({
    endpoint: '/api/auth/session',
    apiBaseUrl: 'https://havenly.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'include',
    fetchImpl: async () => {
      throw new Error('connect ECONNREFUSED')
    },
  })

  assert.equal(sessionAfterLogout.status, 401)
  assert.equal(sessionAfterLogout.meta.authMode, 'scaffold')
})

test('submitAuthLoginPlan can recover backend continuation headers on same-origin scaffold responses when the payload stays sparse', async () => {
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
    fetchImpl: async () => {
      const headers = new Map([
        ['content-type', 'application/json'],
        [AUTH_SCAFFOLD_HEADER, 'true'],
        [AUTH_RESUME_TOKEN_HEADER, 'resume-123'],
        [AUTH_NEXT_ACTION_HEADER, 'complete-profile'],
        [AUTH_STATUS_HEADER, 'action-required'],
        [AUTH_STATUS_LABEL_HEADER, encodeURIComponent('프로필 보완 필요')],
      ])
      return {
        ok: true,
        status: 200,
        headers: { get: (name) => headers.get(name) ?? null },
        json: async () => ({ ok: true, sessionId: 'demo-user-example-com' }),
      }
    },
  })

  assert.equal(result.data.handoffId, 'auth-20260406123000-2n9c')
  assert.equal(result.data.resumeToken, 'resume-123')
  assert.equal(result.data.nextAction, 'complete-profile')
  assert.equal(result.data.status, 'action-required')
  assert.equal(result.data.statusLabel, '프로필 보완 필요')
  assert.deepEqual(result.meta, {
    authMode: 'scaffold',
    authTransport: 'same-origin-middleware',
  })
})

test('submitAuthContinuationPlan forwards resume headers and falls back to the local scaffold continuation path', async () => {
  resetAuthScaffoldState()

  await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    handoffId: 'auth-continue-123',
    request: {
      email: 'user@example.com',
      password: 'password123',
      handoffId: 'auth-continue-123',
      continuation: {
        resumeToken: 'auth-continue-123:profile',
        nextAction: 'complete-profile',
      },
    },
  }, {
    fetchImpl: async () => { throw new Error('offline') },
  })

  const result = await submitAuthContinuationPlan({
    endpoint: '/api/auth/continue',
    method: 'POST',
    handoffId: 'auth-continue-123',
    request: {
      handoffId: 'auth-continue-123',
      continuation: {
        resumeToken: 'auth-continue-123:profile',
        nextAction: 'complete-profile',
      },
      fields: {
        displayName: 'Havenly User',
        phone: '010-1234-5678',
      },
    },
  }, {
    fetchImpl: async () => { throw new Error('offline') },
  })

  assert.equal(result.ok, true)
  assert.equal(result.status, 200)
  assert.equal(result.data.nextAction, 'resume-authenticated-flow')
  assert.equal(result.data.status, 'ready')
  assert.equal(result.data.connection.targetLabel, 'same-origin /api auth scaffold')
  assert.equal(result.data.connection.endpoint, '/api/auth/login')
  assert.deepEqual(result.meta, {
    authMode: 'scaffold',
    authTransport: 'local-fallback',
  })

  const calls = []
  const networkResult = await submitAuthContinuationPlan({
    endpoint: '/api/auth/continue',
    method: 'POST',
    handoffId: 'auth-continue-123',
    request: {
      handoffId: 'auth-continue-123',
      continuation: {
        resumeToken: 'resume-123',
        nextAction: 'verify-email',
      },
      fields: {
        verificationCode: '123456',
      },
    },
  }, {
    apiBaseUrl: 'https://api.example.com',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ ok: true, nextAction: 'resume-authenticated-flow' }),
      }
    },
  })

  assert.equal(networkResult.ok, true)
  assert.equal(calls[0].url, 'https://api.example.com/api/auth/continue')
  assert.equal(calls[0].options.headers[AUTH_RESUME_TOKEN_HEADER], 'resume-123')
  assert.equal(calls[0].options.headers[AUTH_NEXT_ACTION_HEADER], 'verify-email')
  assert.equal(calls[0].options.headers[AUTH_CONNECTION_ENDPOINT_HEADER], '/api/auth/continue')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    handoffId: 'auth-continue-123',
    continuation: {
      resumeToken: 'resume-123',
      nextAction: 'verify-email',
    },
    fields: {
      verificationCode: '123456',
    },
    connection: {
      method: 'POST',
      endpoint: '/api/auth/continue',
      resolvedUrl: 'https://api.example.com/api/auth/continue',
      targetLabel: 'api.example.com',
      isExternal: true,
      isSameOriginScaffold: false,
      credentialsMode: 'include',
      source: 'default',
    },
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
    data: {
      message: 'Auth service unavailable',
      handoffId: 'auth-20260406123000-2n9c',
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
    },
    meta: { authMode: 'remote', authTransport: 'network' },
  })
})

test('readAuthSession reads scaffold session state for frontend bootstrap wiring', async () => {
  const result = await readAuthSession({
    fetchImpl: async (url, options) => {
      assert.equal(url, '/api/auth/session')
      assert.equal(options.method, 'GET')
      assert.equal(options.credentials, 'include')
      assert.equal(options.headers[AUTH_CONNECTION_METHOD_HEADER], 'GET')
      assert.equal(options.headers[AUTH_CONNECTION_ENDPOINT_HEADER], '/api/auth/session')
      assert.equal(options.headers[AUTH_CONNECTION_TARGET_HEADER], 'same-origin /api auth scaffold')
      assert.equal(options.headers[AUTH_CONNECTION_CREDENTIALS_HEADER], 'include')
      assert.equal(options.headers[AUTH_CONNECTION_SOURCE_HEADER], 'default')
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

test('readAuthPending reads interrupted scaffold handoff state for login resume wiring', async () => {
  const result = await readAuthPending({
    fetchImpl: async (url, options) => {
      assert.equal(url, '/api/auth/pending')
      assert.equal(options.method, 'GET')
      assert.equal(options.credentials, 'include')
      assert.equal(options.headers[AUTH_CONNECTION_METHOD_HEADER], 'GET')
      assert.equal(options.headers[AUTH_CONNECTION_ENDPOINT_HEADER], '/api/auth/pending')
      assert.equal(options.headers[AUTH_CONNECTION_TARGET_HEADER], 'same-origin /api auth scaffold')
      assert.equal(options.headers[AUTH_CONNECTION_CREDENTIALS_HEADER], 'include')
      assert.equal(options.headers[AUTH_CONNECTION_SOURCE_HEADER], 'default')
      return {
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
          [AUTH_SCAFFOLD_HEADER]: 'true',
          [AUTH_HANDOFF_HEADER]: 'auth-20260407002000-abcd',
        }),
        json: async () => ({
          submittedAt: '2026-04-07T00:20:00.000Z',
          endpoint: '/api/auth/login',
          method: 'POST',
          email: 'user@example.com',
          summary: {
            email: 'user@example.com',
            handoffId: 'auth-20260407002000-abcd',
            mergeResolution: null,
            intent: {
              source: 'layout-editor',
              action: 'save-layout-draft',
              label: '로그인 후 보드 저장',
              returnScreen: 'layout',
            },
          },
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
          continuation: {
            resumeToken: 'auth-20260407002000-abcd:merge',
            nextAction: 'confirm-merge-resolution',
          },
          allowedMergeResolutions: ['keep-guest', 'replace-with-account'],
          status: 409,
        }),
      }
    },
  })

  assert.deepEqual(result, {
    ok: true,
    status: 200,
    data: {
      submittedAt: '2026-04-07T00:20:00.000Z',
      handoffId: 'auth-20260407002000-abcd',
      endpoint: '/api/auth/login',
      method: 'POST',
      email: 'user@example.com',
      summary: {
        email: 'user@example.com',
        handoffId: 'auth-20260407002000-abcd',
        mergeResolution: null,
        intent: {
          source: 'layout-editor',
          action: 'save-layout-draft',
          label: '로그인 후 보드 저장',
          returnScreen: 'layout',
        },
      },
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
      continuation: {
        resumeToken: 'auth-20260407002000-abcd:merge',
        nextAction: 'confirm-merge-resolution',
      },
      allowedMergeResolutions: ['keep-guest', 'replace-with-account'],
      status: 409,
    },
    meta: {
      authMode: 'scaffold',
      authTransport: 'same-origin-middleware',
    },
  })
})

test('readAuthSession reconstructs backend connection metadata from auth headers when the payload omits it', async () => {
  const result = await readAuthSession({
    endpoint: '/api/auth/session',
    apiBaseUrl: 'https://api.example.com',
    credentialsMode: 'same-origin',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json',
        [AUTH_SCAFFOLD_HEADER]: 'true',
        [AUTH_HANDOFF_HEADER]: 'auth-session-header-123',
        [AUTH_CONNECTION_METHOD_HEADER]: 'POST',
        [AUTH_CONNECTION_ENDPOINT_HEADER]: '/api/auth/login',
        [AUTH_CONNECTION_TARGET_HEADER]: 'api.example.com',
        [AUTH_CONNECTION_CREDENTIALS_HEADER]: 'same-origin',
        [AUTH_CONNECTION_SOURCE_HEADER]: 'runtime',
      }),
      json: async () => ({
        ok: true,
        sessionId: 'demo-user-example-com',
        user: { email: 'user@example.com', name: 'user@example.com' },
      }),
    }),
  })

  assert.equal(result.data.handoffId, 'auth-session-header-123')
  assert.deepEqual(result.data.connection, {
    method: 'POST',
    endpoint: '/api/auth/login',
    resolvedUrl: 'https://api.example.com/api/auth/login',
    targetLabel: 'api.example.com',
    isExternal: true,
    isSameOriginScaffold: false,
    credentialsMode: 'same-origin',
    source: 'runtime',
  })
})

test('readAuthSession keeps absolute same-origin bootstrap targets canonical when api base matches the app origin', async () => {
  const calls = []
  const result = await readAuthSession({
    endpoint: '/api/auth/session',
    apiBaseUrl: 'https://havenly.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'include',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ ok: true }),
      }
    },
  })

  assert.equal(calls[0].url, 'https://havenly.example.com/api/auth/session')
  assert.equal(calls[0].options.headers[AUTH_CONNECTION_TARGET_HEADER], 'same-origin /api auth scaffold')
  assert.deepEqual(result.data.connection, {
    method: 'GET',
    endpoint: '/api/auth/session',
    resolvedUrl: 'https://havenly.example.com/api/auth/session',
    targetLabel: 'same-origin /api auth scaffold',
    isExternal: false,
    isSameOriginScaffold: true,
    credentialsMode: 'include',
    source: 'env/runtime-configured',
  })
})

test('readAuthSession preserves the configured auth source label across bootstrap reads', async () => {
  const calls = []
  const result = await readAuthSession({
    endpoint: '/api/auth/session',
    apiBaseUrl: 'https://api.example.com',
    credentialsMode: 'include',
    source: 'env:VITE_AUTH_API_BASE_URL',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ ok: true }),
      }
    },
  })

  assert.equal(calls[0].options.headers[AUTH_CONNECTION_SOURCE_HEADER], 'env:VITE_AUTH_API_BASE_URL')
  assert.equal(result.data.connection?.source, 'env:VITE_AUTH_API_BASE_URL')
})

test('readAuthSession can preserve the canonical login contract when bootstrap payloads omit connection metadata', async () => {
  const result = await readAuthSession({
    endpoint: '/api/auth/session',
    apiBaseUrl: 'https://api.example.com',
    credentialsMode: 'include',
    connectionFallbackOverride: {
      method: 'POST',
      endpoint: '/api/auth/login',
      resolvedUrl: 'https://api.example.com/api/auth/login',
      targetLabel: 'api.example.com',
      isExternal: true,
      isSameOriginScaffold: false,
      credentialsMode: 'include',
      source: 'runtime',
    },
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json',
      }),
      json: async () => ({
        ok: true,
        sessionId: 'demo-user-example-com',
        user: { email: 'user@example.com', name: 'user@example.com' },
      }),
    }),
  })

  assert.deepEqual(result.data.connection, {
    method: 'POST',
    endpoint: '/api/auth/login',
    resolvedUrl: 'https://api.example.com/api/auth/login',
    targetLabel: 'api.example.com',
    isExternal: true,
    isSameOriginScaffold: false,
    credentialsMode: 'include',
    source: 'runtime',
  })
})

test('readAuthSession can recover continuation metadata from scaffold headers when the payload omits it', async () => {
  const result = await readAuthSession({
    endpoint: '/api/auth/session',
    fetchImpl: async () => {
      const headers = new Map([
        ['content-type', 'application/json'],
        [AUTH_SCAFFOLD_HEADER, 'true'],
        [AUTH_RESUME_TOKEN_HEADER, 'resume-session-123'],
        [AUTH_NEXT_ACTION_HEADER, 'resume-layout-checkout'],
        [AUTH_STATUS_HEADER, 'action-required'],
        [AUTH_STATUS_LABEL_HEADER, encodeURIComponent('프로필 보완 필요')],
      ])
      return {
        ok: true,
        status: 200,
        headers: { get: (name) => headers.get(name) ?? null },
        json: async () => ({
          ok: true,
          sessionId: 'demo-user-example-com',
          user: { email: 'user@example.com', name: 'user@example.com' },
        }),
      }
    },
  })

  assert.equal(result.data.resumeToken, 'resume-session-123')
  assert.equal(result.data.nextAction, 'resume-layout-checkout')
  assert.equal(result.data.status, 'action-required')
  assert.equal(result.data.statusLabel, '프로필 보완 필요')
})

test('readAuthPending can preserve the canonical login contract when pending bootstrap payloads omit connection metadata', async () => {
  const result = await readAuthPending({
    endpoint: '/api/auth/pending',
    apiBaseUrl: 'https://api.example.com',
    credentialsMode: 'include',
    connectionFallbackOverride: {
      method: 'POST',
      endpoint: '/api/auth/login',
      resolvedUrl: 'https://api.example.com/api/auth/login',
      targetLabel: 'api.example.com',
      isExternal: true,
      isSameOriginScaffold: false,
      credentialsMode: 'include',
      source: 'runtime',
    },
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json',
      }),
      json: async () => ({
        submittedAt: '2026-04-07T00:20:00.000Z',
        handoffId: 'auth-20260407002000-abcd',
        email: 'user@example.com',
        status: 409,
      }),
    }),
  })

  assert.deepEqual(result.data.connection, {
    method: 'POST',
    endpoint: '/api/auth/login',
    resolvedUrl: 'https://api.example.com/api/auth/login',
    targetLabel: 'api.example.com',
    isExternal: true,
    isSameOriginScaffold: false,
    credentialsMode: 'include',
    source: 'runtime',
  })
})

test('readAuthPending keeps absolute same-origin bootstrap targets canonical when api base matches the app origin', async () => {
  const calls = []
  const result = await readAuthPending({
    endpoint: '/api/auth/pending',
    apiBaseUrl: 'https://havenly.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'include',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ handoffId: 'pending-1', status: 409 }),
      }
    },
  })

  assert.equal(calls[0].url, 'https://havenly.example.com/api/auth/pending')
  assert.equal(calls[0].options.headers[AUTH_CONNECTION_TARGET_HEADER], 'same-origin /api auth scaffold')
  assert.deepEqual(result.data.connection, {
    method: 'GET',
    endpoint: '/api/auth/pending',
    resolvedUrl: 'https://havenly.example.com/api/auth/pending',
    targetLabel: 'same-origin /api auth scaffold',
    isExternal: false,
    isSameOriginScaffold: true,
    credentialsMode: 'include',
    source: 'env/runtime-configured',
  })
})

test('readAuthPending lifts serializable continuation fields, draft save, and guest draft summary from sparse pending payloads', async () => {
  const result = await readAuthPending({
    endpoint: '/api/auth/pending',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json',
      }),
      json: async () => ({
        submittedAt: '2026-04-09T23:10:00.000Z',
        handoffId: 'auth-20260409231000-resume',
        email: 'user@example.com',
        status: 409,
        request: {
          fields: {
            mergeResolution: 'keep-guest',
          },
          draftSave: {
            draftLabel: '거실 보드',
            apartmentLabel: '래미안 84A',
            recommendationRoom: '거실',
            selectedSpaceIds: ['living-room'],
            layoutItems: [{ id: 'sofa', x: 10, y: 20 }],
            layoutItemCount: 1,
          },
          guestDraftSnapshot: {
            recommendationDraft: { room: '거실' },
            spaceProfile: { spaces: ['living-room'] },
            continuity: {
              apartmentLabel: '래미안 84A',
              selectedRooms: ['거실'],
              wishlistIds: ['sku-1', 'sku-2'],
              cartItems: [{ id: 'sku-3', qty: 1 }],
              layoutItems: [{ id: 'sofa', x: 10, y: 20 }],
            },
          },
        },
      }),
    }),
  })

  assert.deepEqual(result.data.continuationFields, {
    mergeResolution: 'keep-guest',
  })
  assert.deepEqual(result.data.draftSave, {
    draftLabel: '거실 보드',
    apartmentLabel: '래미안 84A',
    recommendationRoom: '거실',
    selectedSpaceIds: ['living-room'],
    layoutItems: [{ id: 'sofa', x: 10, y: 20 }],
    layoutItemCount: 1,
  })
  assert.deepEqual(result.data.guestDraftSummary, {
    apartmentLabel: '래미안 84A',
    selectedRoomCount: 1,
    selectedRooms: ['거실'],
    selectedSpaceIds: ['living-room'],
    recommendationRoom: '거실',
    wishlistCount: 2,
    cartCount: 1,
    layoutItemCount: 1,
  })
})

test('readAuthPending preserves the configured auth source label across pending bootstrap reads', async () => {
  const calls = []
  const result = await readAuthPending({
    endpoint: '/api/auth/pending',
    apiBaseUrl: 'https://api.example.com',
    credentialsMode: 'include',
    source: 'query',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ handoffId: 'pending-1', status: 409 }),
      }
    },
  })

  assert.equal(calls[0].options.headers[AUTH_CONNECTION_SOURCE_HEADER], 'query')
  assert.equal(result.data.connection?.source, 'query')
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
          [AUTH_NEXT_ACTION_HEADER]: 'login-required',
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
      headers: {
        [AUTH_CONNECTION_METHOD_HEADER]: 'POST',
        [AUTH_CONNECTION_ENDPOINT_HEADER]: '/api/auth/logout',
        [AUTH_CONNECTION_TARGET_HEADER]: 'api.example.com',
        [AUTH_CONNECTION_CREDENTIALS_HEADER]: 'same-origin',
        [AUTH_CONNECTION_SOURCE_HEADER]: 'env/runtime-configured',
      },
    },
  }])
  assert.deepEqual(result, {
    ok: true,
    status: 200,
    data: {
      ok: true,
      resumeToken: null,
      nextAction: 'login-required',
      connection: {
        method: 'POST',
        endpoint: '/api/auth/logout',
        resolvedUrl: 'https://api.example.com/api/auth/logout',
        targetLabel: 'api.example.com',
        isExternal: true,
        isSameOriginScaffold: false,
        credentialsMode: 'same-origin',
        source: 'env/runtime-configured',
      },
    },
    meta: {
      authMode: 'scaffold',
      authTransport: 'same-origin-middleware',
    },
  })
})

test('signOutAuthSession keeps absolute same-origin scaffold targets canonical when api base matches the app origin', async () => {
  const calls = []
  const result = await signOutAuthSession({
    endpoint: '/api/auth/logout',
    apiBaseUrl: 'https://havenly.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'include',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ ok: true }),
      }
    },
  })

  assert.equal(calls[0].url, 'https://havenly.example.com/api/auth/logout')
  assert.equal(calls[0].options.headers[AUTH_CONNECTION_TARGET_HEADER], 'same-origin /api auth scaffold')
  assert.deepEqual(result.data.connection, {
    method: 'POST',
    endpoint: '/api/auth/logout',
    resolvedUrl: 'https://havenly.example.com/api/auth/logout',
    targetLabel: 'same-origin /api auth scaffold',
    isExternal: false,
    isSameOriginScaffold: true,
    credentialsMode: 'include',
    source: 'env/runtime-configured',
  })
})

test('signOutAuthSession preserves the configured auth source label during logout wiring', async () => {
  const calls = []
  const result = await signOutAuthSession({
    endpoint: '/api/auth/logout',
    apiBaseUrl: 'https://api.example.com',
    credentialsMode: 'include',
    source: 'runtime',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ ok: true }),
      }
    },
  })

  assert.equal(calls[0].options.headers[AUTH_CONNECTION_SOURCE_HEADER], 'runtime')
  assert.equal(result.data.connection?.source, 'runtime')
})


test('submitAuthContinuationPlan can target same-origin scaffold endpoints under a configured app base path', async () => {
  const calls = []
  const result = await submitAuthContinuationPlan({
    endpoint: '/api/auth/continue',
    method: 'POST',
    handoffId: 'auth-continue-basepath-123',
    request: {
      handoffId: 'auth-continue-basepath-123',
      continuation: {
        resumeToken: 'resume-basepath-123',
        nextAction: 'verify-email',
      },
      fields: { verificationCode: '123456' },
    },
  }, {
    appBasePath: '/github-pages-react-hello/',
    currentOrigin: 'https://havenly.example.com',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ ok: true, nextAction: 'resume-authenticated-flow' }),
      }
    },
  })

  assert.equal(result.ok, true)
  assert.equal(calls[0].url, '/github-pages-react-hello/api/auth/continue')
  assert.equal(calls[0].options.headers[AUTH_CONNECTION_TARGET_HEADER], 'same-origin /api auth scaffold')
})
test('submitAuthLoginPlan falls back to the local scaffold when a same-origin preview serves HTML instead of an auth payload', async () => {
  resetAuthScaffoldState()

  const result = await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    handoffId: 'auth-preview-html-0001',
    request: {
      email: 'user@example.com',
      password: 'password123',
      handoffId: 'auth-preview-html-0001',
    },
  }, {
    apiBaseUrl: 'https://havenly.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'include',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      headers: {
        get: (name) => name === 'content-type' ? 'text/html; charset=utf-8' : null,
      },
      text: async () => '<!doctype html><html><body>preview shell</body></html>',
    }),
  })

  assert.equal(result.ok, true)
  assert.equal(result.meta.authMode, 'scaffold')
  assert.equal(result.meta.authTransport, 'local-fallback')
  assert.equal(result.data.user.email, 'user@example.com')
  assert.equal(result.data.connection.targetLabel, 'same-origin /api auth scaffold')
})

test('readAuthSession falls back to the local scaffold when a same-origin preview serves HTML for the session endpoint', async () => {
  resetAuthScaffoldState()

  await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    handoffId: 'auth-preview-html-0002',
    request: {
      email: 'user@example.com',
      password: 'password123',
      handoffId: 'auth-preview-html-0002',
    },
  }, {
    apiBaseUrl: 'https://havenly.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'include',
    fetchImpl: async () => {
      throw new Error('connect ECONNREFUSED')
    },
  })

  const session = await readAuthSession({
    endpoint: '/api/auth/session',
    apiBaseUrl: 'https://havenly.example.com',
    currentOrigin: 'https://havenly.example.com',
    credentialsMode: 'include',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      headers: {
        get: (name) => name === 'content-type' ? 'text/html; charset=utf-8' : null,
      },
      text: async () => '<!doctype html><html><body>preview shell</body></html>',
    }),
  })

  assert.equal(session.ok, true)
  assert.equal(session.meta.authMode, 'scaffold')
  assert.equal(session.meta.authTransport, 'local-fallback')
  assert.equal(session.data.user.email, 'user@example.com')
})
