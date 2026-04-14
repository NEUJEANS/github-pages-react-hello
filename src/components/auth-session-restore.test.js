import test from 'node:test'
import assert from 'node:assert/strict'

import { buildPostAuthSessionRestorePatch, shouldApplyPostAuthSessionRestore } from './auth-session-restore.js'

test('shouldApplyPostAuthSessionRestore only applies new backend session snapshots once', () => {
  assert.equal(shouldApplyPostAuthSessionRestore(null), false)
  assert.equal(shouldApplyPostAuthSessionRestore({ savedAt: null }), false)
  assert.equal(shouldApplyPostAuthSessionRestore({ savedAt: '2026-04-06T07:01:00.000Z' }, null), true)
  assert.equal(shouldApplyPostAuthSessionRestore({ savedAt: '2026-04-06T07:01:00.000Z' }, '2026-04-06T07:01:00.000Z'), false)
  assert.equal(shouldApplyPostAuthSessionRestore({ savedAt: '2026-04-06T07:02:00.000Z' }, '2026-04-06T07:01:00.000Z'), true)
})

test('buildPostAuthSessionRestorePatch revives serializable selected space ids and recommendation room', () => {
  assert.deepEqual(buildPostAuthSessionRestorePatch({
    draftSave: {
      apartmentSelectionId: 'apt-84a',
    },
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
    apartmentSelectionId: 'apt-84a',
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
