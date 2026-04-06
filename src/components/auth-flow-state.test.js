import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAuthErrorSummary,
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

test('buildAuthSubmitPlan prepares a backend-friendly login request with handoff metadata', () => {
  const plan = buildAuthSubmitPlan({
    email: ' USER@Example.com ',
    password: 'password123',
    handoffId: 'auth-20260406123000-2n9c',
    endpoint: '/internal/auth/login',
    intent: { action: 'save-layout-draft', label: '로그인 후 보드 저장' },
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
  assert.equal(plan.endpoint, '/internal/auth/login')
  assert.equal(plan.method, 'POST')
  assert.equal(plan.handoffId, 'auth-20260406123000-2n9c')
  assert.equal(plan.request.email, 'user@example.com')
  assert.equal(plan.request.handoffId, 'auth-20260406123000-2n9c')
  assert.deepEqual(plan.request.intent, { action: 'save-layout-draft', label: '로그인 후 보드 저장' })
  assert.equal(plan.summary.handoffId, 'auth-20260406123000-2n9c')
  assert.equal(plan.summary.wishlistCount, 2)
  assert.equal(plan.summary.cartCount, 1)
  assert.equal(plan.summary.layoutItemCount, 1)
  assert.equal(plan.summary.hasRecommendationDraft, true)
  assert.equal(plan.summary.mergeResolution, null)
  assert.deepEqual(plan.summary.intent, { action: 'save-layout-draft', label: '로그인 후 보드 저장' })
})

test('buildAuthResultSummary extracts backend auth response details without widening the login flow contract', () => {
  const summary = buildAuthResultSummary({
    data: {
      sessionId: 'session-1',
      handoffId: 'auth-20260406123000-2n9c',
      user: { email: 'user@example.com' },
      mergedGuestDraft: {
        count: 3,
        mode: 'merged',
        wishlistCount: 2,
        cartCount: 1,
        layoutItemCount: 3,
        recommendationDraftRestored: true,
      },
    },
    meta: {
      authMode: 'scaffold',
      authTransport: 'same-origin-middleware',
    },
  }, {
    handoffId: 'auth-20260406123000-2n9c',
    wishlistCount: 2,
    cartCount: 1,
    layoutItemCount: 3,
    hasRecommendationDraft: true,
  })

  assert.deepEqual(summary, {
    sessionId: 'session-1',
    handoffId: 'auth-20260406123000-2n9c',
    accountLabel: 'user@example.com',
    mergeMode: 'merged',
    mergedDraftCount: 3,
    restoredWishlistCount: 2,
    restoredCartCount: 1,
    restoredLayoutItemCount: 3,
    restoredRecommendationDraft: true,
    wishlistCount: 2,
    cartCount: 1,
    layoutItemCount: 3,
    hasRecommendationDraft: true,
    authMode: 'scaffold',
    authTransport: 'same-origin-middleware',
  })
})

test('buildAuthErrorSummary categorizes backend auth failures for the modal state', () => {
  assert.deepEqual(
    buildAuthErrorSummary({ ok: false, status: 401, data: { message: 'Invalid credentials' } }, {
      handoffId: 'auth-20260406123000-2n9c',
      wishlistCount: 2,
      cartCount: 1,
      layoutItemCount: 3,
      hasRecommendationDraft: true,
    }),
    {
      tone: 'credentials',
      message: 'Invalid credentials',
      summary: {
        handoffId: 'auth-20260406123000-2n9c',
        wishlistCount: 2,
        cartCount: 1,
        layoutItemCount: 3,
        hasRecommendationDraft: true,
      },
    },
  )
})

test('buildAuthStatusCopy reflects the staged auth handoff state', () => {
  assert.match(
    buildAuthStatusCopy('resume-ready', { handoffId: 'auth-20260406123000-2n9c', wishlistCount: 0, cartCount: 0, layoutItemCount: 0 }),
    /handoff auth-20260406123000-2n9c/,
  )

  assert.match(
    buildAuthStatusCopy(
      'ready',
      { handoffId: 'auth-20260406123000-2n9c', wishlistCount: 2, cartCount: 1, layoutItemCount: 3 },
      {
        sessionId: 'session-1',
        handoffId: 'auth-20260406123000-2n9c',
        accountLabel: 'user@example.com',
        mergeMode: 'merged',
        authMode: 'scaffold',
        authTransport: 'same-origin-middleware',
      },
    ),
    /user@example.com 계정과 연결 준비됨.*handoff auth-20260406123000-2n9c.*session-1.*게스트 초안 병합 완료.*same-origin scaffold로 응답 확인/,
  )
}
)
