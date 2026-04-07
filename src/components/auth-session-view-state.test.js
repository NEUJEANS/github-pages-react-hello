import test from 'node:test'
import assert from 'node:assert/strict'

import { buildAuthReadyPanelState, buildAuthSessionNotice } from './auth-session-view-state.js'

test('buildAuthReadyPanelState summarizes the authenticated resume panel for bootstrapped login state', () => {
  assert.deepEqual(buildAuthReadyPanelState({
    accountLabel: 'user@example.com',
    sessionId: 'session-1234',
    handoffId: 'auth-20260406123000-2n9c',
    mergeMode: 'merged',
    restoredWishlistCount: 2,
    restoredCartCount: 1,
    restoredLayoutItemCount: 3,
    restoredRecommendationDraft: true,
    intent: {
      label: '로그인 후 보드 저장',
      draftLabel: '거실 84A',
      returnScreen: 'layout',
    },
    continuation: {
      nextAction: 'save-layout-draft',
      resumeToken: 'auth-20260406123000-2n9c:resume',
    },
    connection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/login',
    },
    guestDraftSummary: {
      apartmentLabel: '래미안 포레스트 84A',
      selectedRoomCount: 2,
      recommendationRoom: '거실',
    },
  }), {
    title: 'user@example.com 계정 연결됨',
    subtitle: '게스트 초안을 계정에 이어붙인 상태예요.',
    restoredBits: ['찜 2개', '장바구니 1개', '배치 3개', '추천 초안'],
    draftContextBits: ['래미안 포레스트 84A', '공간 2개', '거실 추천'],
    accountLabel: 'user@example.com',
    handoffId: 'auth-20260406123000-2n9c',
    sessionId: 'session-1234',
    mergeMode: 'merged',
    intentLabel: '로그인 후 보드 저장',
    intentDraftLabel: '거실 84A',
    nextAction: 'save-layout-draft',
    resumeToken: 'auth-20260406123000-2n9c:resume',
    returnScreen: 'layout',
    connectionLabel: 'same-origin /api auth scaffold',
    connectionEndpoint: '/api/auth/login',
    primaryActionLabel: '보드 저장 이어가기',
    primaryActionHint: '로그인 후 저장하려던 배치 초안을 그대로 이어갈 수 있어요.',
  })

  assert.equal(buildAuthReadyPanelState(null), null)
})

test('buildAuthReadyPanelState adapts primary CTA copy to backend continuation actions', () => {
  assert.deepEqual(buildAuthReadyPanelState({
    accountLabel: 'user@example.com',
    intent: {
      label: '로그인 후 주문 이어가기',
      draftLabel: '장바구니 2개',
      returnScreen: null,
    },
    continuation: {
      nextAction: 'checkout-cart',
      resumeToken: 'auth-user-1234:resume',
    },
  }), {
    title: 'user@example.com 계정 연결됨',
    subtitle: '현재 로그인 연결이 유지되고 있어요.',
    restoredBits: [],
    draftContextBits: [],
    accountLabel: 'user@example.com',
    handoffId: null,
    sessionId: null,
    mergeMode: null,
    intentLabel: '로그인 후 주문 이어가기',
    intentDraftLabel: '장바구니 2개',
    nextAction: 'checkout-cart',
    resumeToken: 'auth-user-1234:resume',
    returnScreen: null,
    connectionLabel: null,
    connectionEndpoint: null,
    primaryActionLabel: '주문 흐름 이어가기',
    primaryActionHint: '계정 장바구니 기준으로 다음 주문 단계를 이어갈 수 있어요.',
  })
})

test('buildAuthSessionNotice summarizes restored guest draft details after login', () => {
  assert.deepEqual(buildAuthSessionNotice({
    accountLabel: 'user@example.com',
    handoffId: 'auth-20260406123000-2n9c',
    mergeMode: 'merged',
    restoredWishlistCount: 2,
    restoredCartCount: 1,
    restoredLayoutItemCount: 3,
    restoredRecommendationDraft: true,
    authMode: 'scaffold',
    authTransport: 'same-origin-middleware',
    intent: {
      label: '로그인 후 보드 저장',
      draftLabel: '거실 84A',
    },
    connection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/login',
    },
    guestDraftSummary: {
      apartmentLabel: '래미안 포레스트 84A',
      selectedRoomCount: 2,
      recommendationRoom: '거실',
    },
  }), {
    title: 'user@example.com 계정 연결됨',
    body: '게스트 초안을 계정에 이어붙였어요. 래미안 포레스트 84A · 공간 2개 · 거실 추천 기준으로 이어졌어요. handoff auth-20260406123000-2n9c 기준으로 이어졌어요. 현재는 same-origin scaffold 응답으로 연결 상태를 확인 중이에요. 로그인 요청 대상은 same-origin /api auth scaffold (/api/auth/login)로 기록해뒀어요. 로그인 후 보드 저장 (거실 84A) 단계까지 이어서 진행할 수 있어요. 찜 2개 · 장바구니 1개 · 배치 3개 · 추천 초안 복원 내용을 이번 세션에 반영했어요.',
    restoredBits: ['찜 2개', '장바구니 1개', '배치 3개', '추천 초안'],
    draftContextBits: ['래미안 포레스트 84A', '공간 2개', '거실 추천'],
  })
})

test('buildAuthSessionNotice falls back gracefully when nothing was restored', () => {
  assert.deepEqual(buildAuthSessionNotice({
    accountLabel: 'user@example.com',
    mergeMode: 'replaced',
  }), {
    title: 'user@example.com 계정 연결됨',
    body: '계정 상태로 전환했어요.',
    restoredBits: [],
    draftContextBits: [],
  })

  assert.equal(buildAuthSessionNotice(null), null)
})
