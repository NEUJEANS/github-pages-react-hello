import test from 'node:test'
import assert from 'node:assert/strict'

import { buildLayoutAuthPanelState } from './layout-auth-panel-state.js'

test('buildLayoutAuthPanelState exposes authenticated save + restore affordances', () => {
  const state = buildLayoutAuthPanelState({
    authSession: {
      savedAt: '2026-04-14T03:23:00.000Z',
      accountState: {
        layoutItems: [{ id: 'saved-chair' }],
        recommendationDraft: { room: '거실' },
      },
    },
    editorItems: [{ id: 'live-chair' }, { id: 'live-sofa' }],
    draftLabel: '거실 84A',
    recommendationRoom: '거실',
    saveState: { status: 'saved', message: '계정에 저장했어요.' },
  })

  assert.equal(state.isAuthenticated, true)
  assert.equal(state.savedLayoutCount, 1)
  assert.equal(state.currentLayoutCount, 2)
  assert.equal(state.hasDrift, true)
  assert.equal(state.saveDisabled, false)
  assert.equal(state.restoreDisabled, false)
  assert.equal(state.saveButtonLabel, '현재 배치 다시 저장')
  assert.equal(state.restoreButtonLabel, '계정 저장본 불러오기')
  assert.equal(state.savedRoom, '거실')
})

test('buildLayoutAuthPanelState disables save and restore while signed out or empty', () => {
  const signedOut = buildLayoutAuthPanelState({
    authSession: null,
    editorItems: [],
    saveState: { status: 'idle' },
  })

  assert.equal(signedOut.isAuthenticated, false)
  assert.equal(signedOut.saveDisabled, true)
  assert.equal(signedOut.restoreDisabled, true)
  assert.equal(signedOut.restoreButtonLabel, null)
})

test('buildLayoutAuthPanelState keeps restore disabled when editor already matches the saved board', () => {
  const items = [{ id: 'chair-1', x: 10, y: 20 }]
  const state = buildLayoutAuthPanelState({
    authSession: {
      accountState: {
        layoutItems: items,
        recommendationDraft: null,
      },
    },
    editorItems: [{ id: 'chair-1', x: 10, y: 20 }],
    saveState: { status: 'saving' },
  })

  assert.equal(state.hasDrift, false)
  assert.equal(state.saveDisabled, true)
  assert.equal(state.restoreDisabled, true)
  assert.equal(state.saveButtonLabel, '보드 저장 중…')
})
