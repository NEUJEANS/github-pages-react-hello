import test from 'node:test'
import assert from 'node:assert/strict'

import { buildSelectedSpaceSummary } from './selected-space-summary-state.js'

const baseZones = [
  { id: 'living', icon: '🛋️', name: '거실' },
  { id: 'kitchen', icon: '🍳', name: '주방' },
  { id: 'bed1', icon: '🛏️', name: '안방' },
  { id: 'bed2', icon: '📚', name: '침실/서재' },
]

const roomOptions = ['거실', '침실', '주방', '서재']

test('keeps living room as primary room and filters available chips from selected zones', () => {
  const summary = buildSelectedSpaceSummary(baseZones, roomOptions, ['living', 'bed2'])

  assert.equal(summary.primaryRoom, '거실')
  assert.deepEqual(summary.availableRooms, ['거실', '침실', '서재'])
  assert.deepEqual(summary.chips, [
    { id: 'living', icon: '🛋️', name: '거실' },
    { id: 'bed2', icon: '📚', name: '침실/서재' },
  ])
  assert.match(summary.caption, /2개 공간/)
})

test('falls back to bedroom recommendation when no living or kitchen zone is selected', () => {
  const summary = buildSelectedSpaceSummary(baseZones, roomOptions, ['bed1'])

  assert.equal(summary.primaryRoom, '침실')
  assert.deepEqual(summary.availableRooms, ['침실'])
})

test('falls back safely when no linked spaces are selected', () => {
  const summary = buildSelectedSpaceSummary(baseZones, roomOptions, [])

  assert.equal(summary.primaryRoom, '거실')
  assert.deepEqual(summary.availableRooms, ['거실'])
  assert.equal(summary.caption, '아직 연결된 공간이 없어요.')
})
