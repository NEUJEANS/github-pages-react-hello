import test from 'node:test'
import assert from 'node:assert/strict'

import { buildAuthDraftSavePayload } from './auth-draft-save-payload.js'

test('buildAuthDraftSavePayload prefers an explicit login-form draft save', () => {
  const loginFormDraftSave = { draftLabel: 'explicit', selectedSpaceIds: ['living'] }
  const authSessionDraftSave = { draftLabel: 'session', selectedSpaceIds: ['bed1'] }
  const guestDraftSnapshot = {
    continuity: { apartmentLabel: '래미안 포레스트 84A', layoutItems: [{ id: 'layout-1' }], layoutTrayItems: [] },
    recommendationDraft: { room: '거실' },
    spaceProfile: { apartmentSelectionId: 'forest-84a', spaces: ['living', 'kitchen'] },
  }

  assert.equal(buildAuthDraftSavePayload(loginFormDraftSave, authSessionDraftSave, guestDraftSnapshot, { draftLabel: 'ignored' }), loginFormDraftSave)
})

test('buildAuthDraftSavePayload merges the current guest board context over stale authenticated draft-save state', () => {
  const authSessionDraftSave = {
    draftLabel: '래미안 포레스트 84A · 2개 공간 선택',
    apartmentLabel: '래미안 포레스트 84A',
    apartmentSelectionId: 'forest-84a',
    recommendationRoom: '거실',
    recommendationDraft: { room: '거실', style: '미니멀' },
    selectedSpaceIds: ['living', 'bed1'],
    layoutItems: [{ id: 'saved-layout-1' }],
    layoutTrayItems: [{ id: 'tray-1' }],
  }
  const guestDraftSnapshot = {
    continuity: {
      apartmentLabel: '아크로 리버뷰 101A',
      layoutItems: [{ id: 'layout-2' }],
      layoutTrayItems: [{ id: 'tray-2' }],
    },
    recommendationDraft: { room: '거실', style: '내추럴', lifestyle: ['pet-friendly'] },
    spaceProfile: { apartmentSelectionId: 'acro-101a', spaces: ['living', 'kitchen', 'bed1'] },
  }

  assert.deepEqual(
    buildAuthDraftSavePayload(null, authSessionDraftSave, guestDraftSnapshot, { draftLabel: '아크로 리버뷰 101A · 3개 공간 선택' }),
    {
      draftLabel: '아크로 리버뷰 101A · 3개 공간 선택',
      apartmentLabel: '아크로 리버뷰 101A',
      apartmentSelectionId: 'acro-101a',
      recommendationRoom: '거실',
      recommendationDraft: { room: '거실', style: '내추럴', lifestyle: ['pet-friendly'] },
      selectedSpaceIds: ['living', 'kitchen', 'bed1'],
      layoutItems: [{ id: 'layout-2' }],
      layoutTrayItems: [{ id: 'tray-2' }],
    },
  )
})

test('buildAuthDraftSavePayload falls back to the authenticated draft-save when no current guest board snapshot exists', () => {
  const authSessionDraftSave = {
    draftLabel: '기존 저장본',
    apartmentSelectionId: 'forest-84a',
    selectedSpaceIds: ['living', 'bed1'],
  }

  assert.deepEqual(buildAuthDraftSavePayload(null, authSessionDraftSave, null, null), authSessionDraftSave)
})
