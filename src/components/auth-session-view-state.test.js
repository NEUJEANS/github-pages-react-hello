import test from 'node:test'
import assert from 'node:assert/strict'

import { buildAuthSessionNotice } from './auth-session-view-state.js'

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
