import test from 'node:test'
import assert from 'node:assert/strict'

import { buildAuthSessionNotice } from './auth-session-view-state.js'

test('buildAuthSessionNotice summarizes restored guest draft details after login', () => {
  assert.deepEqual(buildAuthSessionNotice({
    accountLabel: 'user@example.com',
    mergeMode: 'merged',
    restoredWishlistCount: 2,
    restoredCartCount: 1,
    restoredLayoutItemCount: 3,
    restoredRecommendationDraft: true,
  }), {
    title: 'user@example.com 계정 연결됨',
    body: '게스트 초안을 계정에 이어붙였어요. 찜 2개 · 장바구니 1개 · 배치 3개 · 추천 초안 복원 내용을 이번 세션에 반영했어요.',
    restoredBits: ['찜 2개', '장바구니 1개', '배치 3개', '추천 초안'],
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
  })

  assert.equal(buildAuthSessionNotice(null), null)
})
