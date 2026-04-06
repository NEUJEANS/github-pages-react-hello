import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAuthResultSummary,
  buildAuthStatusCopy,
  buildAuthSubmitPlan,
  buildGuestDraftSnapshot,
} from './auth-flow-state.js'

test('buildGuestDraftSnapshot keeps the login handoff payload serializable and focused', () => {
  const snapshot = buildGuestDraftSnapshot({
    engagement: { aiRequests: 2, furniturePlacements: 1, draftBoards: 1 },
    aiForm: {
      room: '거실',
      style: 'natural',
      priority: 'flow',
      lifestyle: ['반려동물'],
      extraRequest: '우드 톤',
    },
    spaceProfile: {
      query: '서울 성동구',
      apartmentType: '84A',
      apartmentSelectionId: 'apt-1',
      spaces: ['living', 'bed1'],
    },
    selectedApartment: { brand: '래미안', complex: '포레스트', unitLabel: '84A' },
    selectedSpaceSummary: { availableRooms: ['거실', '침실'] },
    wishlistedIds: ['bed-001'],
    cartItems: [{ id: 'bed-001', qty: 2, name: 'ignore me' }],
    editorItems: [{ id: 'placed-sofa', sourceId: 'sofa-001', x: 10, y: 20, rotation: 0, colorIndex: 2, label: 'SOFA' }],
  })

  assert.deepEqual(snapshot, {
    engagement: { aiRequests: 2, furniturePlacements: 1, draftBoards: 1 },
    recommendationDraft: {
      room: '거실',
      style: 'natural',
      priority: 'flow',
      lifestyle: ['반려동물'],
      extraRequest: '우드 톤',
    },
    spaceProfile: {
      query: '서울 성동구',
      apartmentType: '84A',
      apartmentSelectionId: 'apt-1',
      spaces: ['living', 'bed1'],
    },
    continuity: {
      apartmentLabel: '래미안 포레스트 84A',
      selectedRooms: ['거실', '침실'],
      wishlistIds: ['bed-001'],
      cartItems: [{ id: 'bed-001', qty: 2 }],
      layoutItems: [{ id: 'placed-sofa', sourceId: 'sofa-001', x: 10, y: 20, rotation: 0, colorIndex: 2 }],
    },
  })
})

test('buildAuthSubmitPlan prepares a backend-friendly login request', () => {
  const plan = buildAuthSubmitPlan({
    email: ' USER@Example.com ',
    password: 'password123',
    guestDraftSnapshot: {
      recommendationDraft: { room: '거실' },
      continuity: {
        wishlistIds: ['a', 'b'],
        cartItems: [{ id: 'x', qty: 1 }],
        layoutItems: [{ id: 'placed-sofa' }],
      },
    },
  })

  assert.equal(plan.canSubmit, true)
  assert.equal(plan.endpoint, '/api/auth/login')
  assert.equal(plan.method, 'POST')
  assert.equal(plan.request.email, 'user@example.com')
  assert.equal(plan.summary.wishlistCount, 2)
  assert.equal(plan.summary.cartCount, 1)
  assert.equal(plan.summary.layoutItemCount, 1)
  assert.equal(plan.summary.hasRecommendationDraft, true)
})

test('buildAuthResultSummary extracts backend auth response details without widening the login flow contract', () => {
  const summary = buildAuthResultSummary({
    data: {
      sessionId: 'session-1',
      user: { email: 'user@example.com' },
      mergedGuestDraft: { count: 3 },
    },
  }, {
    wishlistCount: 2,
    cartCount: 1,
    layoutItemCount: 3,
    hasRecommendationDraft: true,
  })

  assert.deepEqual(summary, {
    sessionId: 'session-1',
    accountLabel: 'user@example.com',
    mergedDraftCount: 3,
    wishlistCount: 2,
    cartCount: 1,
    layoutItemCount: 3,
    hasRecommendationDraft: true,
  })
})

test('buildAuthStatusCopy reflects the staged auth handoff state', () => {
  assert.match(buildAuthStatusCopy('submitting', { wishlistCount: 0, cartCount: 0, layoutItemCount: 0 }), /준비 중/)
  assert.match(
    buildAuthStatusCopy(
      'ready',
      { wishlistCount: 2, cartCount: 1, layoutItemCount: 3 },
      { sessionId: 'session-1', accountLabel: 'user@example.com' },
    ),
    /user@example.com 계정과 연결 준비됨.*session-1|session-1.*user@example.com 계정과 연결 준비됨/,
  )
  assert.match(buildAuthStatusCopy('error', { wishlistCount: 0, cartCount: 0, layoutItemCount: 0 }), /실패/)
  assert.match(buildAuthStatusCopy('idle', { wishlistCount: 0, cartCount: 0, layoutItemCount: 0 }), /게스트 상태/)
})
