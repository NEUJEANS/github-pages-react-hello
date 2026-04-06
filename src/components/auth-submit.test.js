import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveAuthEndpoint, submitAuthLoginPlan } from './auth-submit.js'

test('resolveAuthEndpoint keeps local auth routes by default and prefixes configured api base urls', () => {
  assert.equal(resolveAuthEndpoint('/api/auth/login'), '/api/auth/login')
  assert.equal(resolveAuthEndpoint('/api/auth/login', { apiBaseUrl: 'https://api.example.com/' }), 'https://api.example.com/api/auth/login')
  assert.equal(resolveAuthEndpoint('https://auth.example.com/login', { apiBaseUrl: 'https://api.example.com/' }), 'https://auth.example.com/login')
})

test('submitAuthLoginPlan sends the backend-ready payload as json', async () => {
  const calls = []
  const result = await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    request: {
      email: 'user@example.com',
      password: 'password123',
      guestDraftSnapshot: { continuity: { wishlistIds: ['a'] } },
      mergeResolution: 'keep-guest',
    },
  }, {
    apiBaseUrl: 'https://api.example.com',
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
  assert.equal(calls[0].options.headers['content-type'], 'application/json')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    email: 'user@example.com',
    password: 'password123',
    guestDraftSnapshot: { continuity: { wishlistIds: ['a'] } },
    mergeResolution: 'keep-guest',
  })
  assert.deepEqual(result, {
    ok: true,
    status: 200,
    data: { ok: true, sessionId: 'session-1' },
  })
})

test('submitAuthLoginPlan captures text errors from non-json auth scaffolds', async () => {
  const result = await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    request: { email: 'user@example.com', password: 'password123', guestDraftSnapshot: null },
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
    data: { message: 'Auth service unavailable' },
  })
})

test('submitAuthLoginPlan falls back to the local scaffold when the same-origin auth route is missing', async () => {
  const result = await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    request: {
      email: 'user@example.com',
      password: 'password123',
      guestDraftSnapshot: {
        recommendationDraft: { room: '거실' },
        continuity: {
          wishlistIds: ['wish-1'],
          cartItems: [{ id: 'cart-1', qty: 1 }],
          layoutItems: [{ id: 'layout-1' }],
        },
      },
    },
  }, {
    fetchImpl: async () => ({
      ok: false,
      status: 404,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'Not found',
    }),
  })

  assert.equal(result.ok, true)
  assert.equal(result.status, 200)
  assert.equal(result.data.sessionId, 'demo-user-example-com')
  assert.equal(result.data.mergedGuestDraft.layoutItemCount, 1)
  assert.equal(result.data.mergedGuestDraft.recommendationDraftRestored, true)
})

test('submitAuthLoginPlan falls back to the local scaffold when same-origin auth fetch throws', async () => {
  const result = await submitAuthLoginPlan({
    endpoint: '/api/auth/login',
    method: 'POST',
    request: {
      email: 'user@example.com',
      password: 'merge-conflict',
      guestDraftSnapshot: {
        continuity: {
          wishlistIds: ['wish-1'],
          cartItems: [],
          layoutItems: [{ id: 'layout-1' }],
        },
      },
    },
  }, {
    fetchImpl: async () => {
      throw new TypeError('fetch failed')
    },
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 409)
  assert.equal(result.data.message, 'Guest draft merge confirmation required')
  assert.equal(result.data.allowedMergeResolution, 'keep-guest')
  assert.equal(result.data.mergedGuestDraft.layoutItemCount, 1)
})
