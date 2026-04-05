import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLoginGuardSnapshot } from './login-guard.js'

test('buildLoginGuardSnapshot returns no guard state for empty activity', () => {
  const snapshot = buildLoginGuardSnapshot({
    engagement: { aiRequests: 0, furniturePlacements: 0, draftBoards: 0 },
    wishlistCount: 0,
    cartCount: 0,
  })

  assert.equal(snapshot.hasLoginGuard, false)
  assert.deepEqual(snapshot.reasons, [])
  assert.deepEqual(snapshot.metrics, {
    aiRequests: 0,
    furniturePlacements: 0,
    draftBoards: 0,
    wishlistCount: 0,
    cartCount: 0,
  })
})

test('buildLoginGuardSnapshot includes AI, board, wishlist, and cart continuity signals', () => {
  const snapshot = buildLoginGuardSnapshot({
    engagement: { aiRequests: 2, furniturePlacements: 1, draftBoards: 1 },
    wishlistCount: 3,
    cartCount: 2,
  })

  assert.equal(snapshot.hasLoginGuard, true)
  assert.deepEqual(snapshot.reasons, [
    'AI 추천 요청 2회',
    '가구 배치 1회',
    '진행 중 보드 1개',
    '찜 3개',
    '장바구니 2개',
  ])
})
