import test from 'node:test'
import assert from 'node:assert/strict'

import { buildAuthScaffoldResponse, buildAuthScaffoldSessionResponse } from './auth-backend-scaffold.js'

test('buildAuthScaffoldResponse returns a merged session payload for valid credentials', () => {
  const response = buildAuthScaffoldResponse({
    email: 'User@Example.com ',
    password: 'password123',
    intent: {
      source: 'layout-editor',
      action: 'save-layout-draft',
      label: '로그인 후 보드 저장',
      returnScreen: 'layout',
    },
    guestDraftSnapshot: {
      recommendationDraft: { room: '거실' },
      spaceProfile: { spaces: ['living', 'bed1'] },
      continuity: {
        apartmentLabel: '래미안 포레스트 84A',
        selectedRooms: ['거실', '침실'],
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
  assert.deepEqual(response.data.guestDraftSummary, {
    apartmentLabel: '래미안 포레스트 84A',
    selectedRoomCount: 2,
    selectedRooms: ['거실', '침실'],
    selectedSpaceIds: ['living', 'bed1'],
    recommendationRoom: '거실',
    wishlistCount: 2,
    cartCount: 1,
    layoutItemCount: 2,
  })
  assert.deepEqual(response.data.intent, {
    source: 'layout-editor',
    action: 'save-layout-draft',
    label: '로그인 후 보드 저장',
    returnScreen: 'layout',
  })
  assert.equal(response.data.resumeToken, null)
  assert.equal(response.data.nextAction, 'save-layout-draft')
})

test('buildAuthScaffoldResponse returns 409 for the merge-conflict demo password', () => {
  const response = buildAuthScaffoldResponse({
    email: 'user@example.com',
    password: 'merge-conflict',
    handoffId: 'auth-merge-1234',
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
  assert.equal(response.data.resumeToken, 'auth-merge-1234:merge')
  assert.equal(response.data.nextAction, 'confirm-merge-resolution')
  assert.equal(response.data.mergedGuestDraft.layoutItemCount, 1)
})

test('buildAuthScaffoldResponse accepts an explicit merge confirmation for the guest draft retry', () => {
  const response = buildAuthScaffoldResponse({
    email: 'user@example.com',
    password: 'merge-conflict',
    handoffId: 'auth-merge-1234',
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
  assert.equal(response.data.resumeToken, 'auth-merge-1234:resume')
  assert.equal(response.data.nextAction, 'resume-guest-draft')
})

test('buildAuthScaffoldResponse can switch to the account state after a merge conflict confirmation', () => {
  const response = buildAuthScaffoldResponse({
    email: 'user@example.com',
    password: 'merge-conflict',
    handoffId: 'auth-merge-1234',
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
  assert.equal(response.data.resumeToken, 'auth-merge-1234:resume')
  assert.equal(response.data.nextAction, 'resume-account-state')
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
    handoffId: 'auth-invalid-1234',
  })

  assert.equal(response.status, 401)
  assert.deepEqual(response.data, {
    message: 'Invalid credentials',
    handoffId: 'auth-invalid-1234',
    resumeToken: 'auth-invalid-1234:retry',
    nextAction: 'retry-login',
  })
})

test('buildAuthScaffoldSessionResponse exposes the latest scaffold auth session payload', () => {
  const response = buildAuthScaffoldSessionResponse({
    ok: true,
    sessionId: 'demo-user-example-com',
    user: {
      email: 'user@example.com',
      name: 'user@example.com',
    },
    resumeToken: 'auth-user-1234:resume',
    nextAction: 'checkout-cart',
  })

  assert.equal(response.status, 200)
  assert.equal(response.data.sessionId, 'demo-user-example-com')
  assert.equal(response.data.user.email, 'user@example.com')
  assert.equal(response.data.resumeToken, 'auth-user-1234:resume')
  assert.equal(response.data.nextAction, 'checkout-cart')
})

test('buildAuthScaffoldSessionResponse returns 401 when no scaffold auth session exists', () => {
  const response = buildAuthScaffoldSessionResponse(null)

  assert.equal(response.status, 401)
  assert.deepEqual(response.data, {
    message: 'No scaffold auth session',
    nextAction: 'login-required',
  })
})
