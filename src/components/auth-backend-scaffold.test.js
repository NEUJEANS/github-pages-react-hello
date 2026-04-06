import test from 'node:test'
import assert from 'node:assert/strict'

import { buildAuthScaffoldResponse } from './auth-backend-scaffold.js'

test('buildAuthScaffoldResponse returns a merged session payload for valid credentials', () => {
  const response = buildAuthScaffoldResponse({
    email: 'User@Example.com ',
    password: 'password123',
    guestDraftSnapshot: {
      recommendationDraft: { room: '거실' },
      continuity: {
        wishlistIds: ['wish-1', 'wish-2'],
        cartItems: [{ id: 'cart-1', qty: 1 }],
        layoutItems: [{ id: 'layout-1' }, { id: 'layout-2' }],
      },
    },
  })

  assert.equal(response.status, 200)
  assert.equal(response.data.sessionId, 'demo-user-example-com')
  assert.equal(response.data.user.email, 'user@example.com')
  assert.deepEqual(response.data.mergedGuestDraft, {
    mode: 'merged',
    resolution: null,
    count: 2,
    wishlistCount: 2,
    cartCount: 1,
    layoutItemCount: 2,
    recommendationDraftRestored: true,
  })
})

test('buildAuthScaffoldResponse returns 409 for the merge-conflict demo password', () => {
  const response = buildAuthScaffoldResponse({
    email: 'user@example.com',
    password: 'merge-conflict',
    guestDraftSnapshot: {
      continuity: {
        wishlistIds: ['wish-1'],
        cartItems: [],
        layoutItems: [{ id: 'layout-1' }],
      },
    },
  })

  assert.equal(response.status, 409)
  assert.equal(response.data.message, 'Guest draft merge confirmation required')
  assert.equal(response.data.allowedMergeResolution, 'keep-guest')
  assert.equal(response.data.mergedGuestDraft.layoutItemCount, 1)
})

test('buildAuthScaffoldResponse accepts an explicit merge confirmation for the guest draft retry', () => {
  const response = buildAuthScaffoldResponse({
    email: 'user@example.com',
    password: 'merge-conflict',
    mergeResolution: 'keep-guest',
    guestDraftSnapshot: {
      continuity: {
        wishlistIds: ['wish-1'],
        cartItems: [],
        layoutItems: [{ id: 'layout-1' }],
      },
    },
  })

  assert.equal(response.status, 200)
  assert.equal(response.data.mergedGuestDraft.mode, 'merge-confirmed')
  assert.equal(response.data.mergedGuestDraft.resolution, 'keep-guest')
})

test('buildAuthScaffoldResponse can switch to the account state after a merge conflict confirmation', () => {
  const response = buildAuthScaffoldResponse({
    email: 'user@example.com',
    password: 'merge-conflict',
    mergeResolution: 'replace-with-account',
    guestDraftSnapshot: {
      continuity: {
        wishlistIds: ['wish-1'],
        cartItems: [],
        layoutItems: [{ id: 'layout-1' }],
      },
    },
  })

  assert.equal(response.status, 200)
  assert.equal(response.data.mergedGuestDraft.mode, 'replaced')
  assert.equal(response.data.mergedGuestDraft.resolution, 'replace-with-account')
  assert.deepEqual(response.data.accountState, {
    wishlistIds: [],
    cartItems: [],
    layoutItems: [],
    recommendationDraft: null,
  })
})

test('buildAuthScaffoldResponse rejects short passwords and malformed emails', () => {
  const response = buildAuthScaffoldResponse({
    email: 'not-an-email',
    password: 'short',
  })

  assert.equal(response.status, 401)
  assert.deepEqual(response.data, { message: 'Invalid credentials' })
})
