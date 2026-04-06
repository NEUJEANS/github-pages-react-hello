import test from 'node:test'
import assert from 'node:assert/strict'

import { buildPostAuthSessionRestorePatch } from './auth-session-restore.js'

test('buildPostAuthSessionRestorePatch revives serializable selected space ids and recommendation room', () => {
  assert.deepEqual(buildPostAuthSessionRestorePatch({
    guestDraftSummary: {
      selectedSpaceIds: ['living', 'bed1'],
      selectedRooms: ['거실', '침실'],
      recommendationRoom: '침실',
    },
  }, {
    spaceZones: [
      { id: 'living', name: '거실' },
      { id: 'bed1', name: '안방' },
    ],
    roomOptions: ['거실', '침실', '주방', '서재'],
  }), {
    selectedSpaceIds: ['living', 'bed1'],
    recommendationRoom: '침실',
  })
})

test('buildPostAuthSessionRestorePatch falls back to room labels when older sessions lack selected space ids', () => {
  assert.deepEqual(buildPostAuthSessionRestorePatch({
    guestDraftSummary: {
      selectedRooms: ['거실', '서재'],
      recommendationRoom: '거실',
    },
  }, {
    spaceZones: [
      { id: 'living', name: '거실' },
      { id: 'bed2', name: '침실/서재' },
    ],
    roomOptions: ['거실', '침실', '주방', '서재'],
  }), {
    selectedSpaceIds: ['living', 'bed2'],
    recommendationRoom: '거실',
  })
})

test('buildPostAuthSessionRestorePatch returns null when nothing restorable was persisted', () => {
  assert.equal(buildPostAuthSessionRestorePatch({ guestDraftSummary: null }, {
    spaceZones: [],
    roomOptions: ['거실'],
  }), null)
})
