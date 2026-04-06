import test from 'node:test'
import assert from 'node:assert/strict'

import {
  AUTH_HANDOFF_STORAGE_KEY,
  AUTH_SESSION_STORAGE_KEY,
  buildAuthConnectionSummary,
  buildAuthResumeState,
  buildPersistedAuthHandoff,
  buildPersistedAuthSession,
  clearPersistedAuthHandoff,
  persistAuthHandoff,
  persistAuthSession,
  readPersistedAuthHandoff,
  readPersistedAuthSession,
} from './auth-storage.js'

function createMemoryStorage() {
  const map = new Map()

  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null
    },
    setItem(key, value) {
      map.set(key, value)
    },
    removeItem(key) {
      map.delete(key)
    },
  }
}

test('buildAuthConnectionSummary resolves same-origin and external auth targets', () => {
  assert.deepEqual(
    buildAuthConnectionSummary({ endpoint: '/api/auth/login', method: 'POST' }),
    {
      method: 'POST',
      endpoint: '/api/auth/login',
      resolvedUrl: '/api/auth/login',
      targetLabel: 'same-origin /api auth scaffold',
      isExternal: false,
    },
  )

  assert.deepEqual(
    buildAuthConnectionSummary({ endpoint: '/api/auth/login', method: 'POST' }, { apiBaseUrl: 'https://api.example.com/' }),
    {
      method: 'POST',
      endpoint: '/api/auth/login',
      resolvedUrl: 'https://api.example.com/api/auth/login',
      targetLabel: 'api.example.com',
      isExternal: true,
    },
  )
})

test('persistAuthHandoff stores the serializable guest draft payload for follow-up auth wiring', () => {
  const storage = createMemoryStorage()
  const handoff = buildPersistedAuthHandoff({
    endpoint: '/api/auth/login',
    method: 'POST',
    summary: {
      email: 'user@example.com',
      wishlistCount: 1,
      cartCount: 2,
      layoutItemCount: 3,
      hasRecommendationDraft: true,
    },
  }, {
    continuity: {
      wishlistIds: ['wish-1'],
      cartItems: [{ id: 'sku-1', qty: 2 }],
      layoutItems: [{ id: 'layout-1', x: 12, y: 16 }],
    },
  }, { submittedAt: '2026-04-06T06:59:00.000Z' })

  assert.equal(persistAuthHandoff(storage, handoff), true)
  assert.equal(storage.getItem(AUTH_HANDOFF_STORAGE_KEY) !== null, true)
  assert.deepEqual(readPersistedAuthHandoff(storage), handoff)
})

test('buildAuthResumeState revives an interrupted login attempt from persisted handoff data', () => {
  const handoff = {
    submittedAt: '2026-04-06T06:59:00.000Z',
    email: 'user@example.com',
    summary: { wishlistCount: 1, cartCount: 2, layoutItemCount: 3, hasRecommendationDraft: true },
  }
  const session = { accountLabel: 'user@example.com' }
  const resumeState = buildAuthResumeState(handoff, session)

  assert.equal(resumeState.email, 'user@example.com')
  assert.equal(resumeState.status, 'resume-ready')
  assert.equal(resumeState.handoff, handoff)
  assert.equal(resumeState.session, session)
})

test('clearPersistedAuthHandoff removes the saved handoff after a successful login', () => {
  const storage = createMemoryStorage()
  storage.setItem(AUTH_HANDOFF_STORAGE_KEY, JSON.stringify({ email: 'user@example.com' }))

  assert.equal(clearPersistedAuthHandoff(storage), true)
  assert.equal(storage.getItem(AUTH_HANDOFF_STORAGE_KEY), null)
})

test('persistAuthSession stores the latest successful auth summary for the frontend shell', () => {
  const storage = createMemoryStorage()
  const session = buildPersistedAuthSession({
    sessionId: 'sess_123',
    accountLabel: 'user@example.com',
    mergedDraftCount: 3,
    wishlistCount: 1,
    cartCount: 2,
    layoutItemCount: 3,
    hasRecommendationDraft: true,
  }, { savedAt: '2026-04-06T07:01:00.000Z' })

  assert.equal(persistAuthSession(storage, session), true)
  assert.equal(storage.getItem(AUTH_SESSION_STORAGE_KEY) !== null, true)
  assert.deepEqual(readPersistedAuthSession(storage), session)
})
