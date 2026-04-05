import test from 'node:test'
import assert from 'node:assert/strict'
import { toggleWishlistId } from './wishlist-state.js'

test('toggleWishlistId adds an id when it is not present', () => {
  assert.deepEqual(toggleWishlistId(['bed-001'], 'bed-002'), ['bed-001', 'bed-002'])
})

test('toggleWishlistId removes an id when it is already present', () => {
  assert.deepEqual(toggleWishlistId(['bed-001', 'bed-002'], 'bed-001'), ['bed-002'])
})

test('toggleWishlistId does not mutate the current wishlist array', () => {
  const currentIds = ['bed-001']
  const result = toggleWishlistId(currentIds, 'bed-002')

  assert.notEqual(result, currentIds)
  assert.deepEqual(currentIds, ['bed-001'])
})
