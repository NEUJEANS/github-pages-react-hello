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
  assert.equal(state.saveButtonLabel, '현재 보드 다시 저장')
  assert.equal(state.restoreButtonLabel, '계정 저장본 불러오기')
  assert.equal(state.savedRoom, '거실')
  assert.equal(state.savedBoardSummary, '저장본 배치 1개 · 트레이 0개')
  assert.equal(state.currentBoardSummary, '현재 보드 배치 2개 · 트레이 0개')
  assert.equal(state.boardComparisonCopy, '현재 보드가 계정 저장본과 달라졌어요. 다시 저장하거나 저장본으로 되돌릴 수 있어요.')
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

test('buildLayoutAuthPanelState keeps board save available for tray-only layouts', () => {
  const state = buildLayoutAuthPanelState({
    authSession: {
      accountState: {
        layoutItems: [],
        layoutTrayItems: [],
        recommendationDraft: { room: '거실', style: '모던' },
      },
    },
    editorItems: [],
    trayItems: [{ id: 'sofa-1', name: '소파' }],
    currentRecommendationDraft: { room: '거실', style: '모던' },
    saveState: { status: 'idle' },
  })

  assert.equal(state.hasCurrentBoard, true)
  assert.equal(state.hasSavedBoard, true)
  assert.equal(state.currentTrayCount, 1)
  assert.equal(state.saveDisabled, false)
  assert.equal(state.saveButtonLabel, '현재 보드 다시 저장')
})

test('buildLayoutAuthPanelState keeps restore disabled when editor already matches the saved board', () => {
  const items = [{ id: 'chair-1', x: 10, y: 20 }]
  const trayItems = [{ id: 'sofa-1', name: '소파' }]
  const recommendationDraft = { room: '거실', style: '모던' }
  const state = buildLayoutAuthPanelState({
    authSession: {
      accountState: {
        layoutItems: items,
        layoutTrayItems: trayItems,
        recommendationDraft,
      },
    },
    editorItems: [{ id: 'chair-1', x: 10, y: 20 }],
    trayItems: [{ id: 'sofa-1', name: '소파' }],
    currentRecommendationDraft: { style: '모던', room: '거실' },
    saveState: { status: 'saving' },
  })

  assert.equal(state.hasDrift, false)
  assert.equal(state.saveDisabled, true)
  assert.equal(state.restoreDisabled, true)
  assert.equal(state.saveButtonLabel, '보드 저장 중…')
  assert.equal(state.boardComparisonCopy, '현재 보드가 계정 저장본과 같아요.')
})

test('buildLayoutAuthPanelState enables restore when tray-only drift exists', () => {
  const state = buildLayoutAuthPanelState({
    authSession: {
      accountState: {
        layoutItems: [{ id: 'chair-1', x: 10, y: 20 }],
        layoutTrayItems: [{ id: 'sofa-1', name: '소파' }, { id: 'table-1', name: '테이블' }],
        recommendationDraft: { room: '거실', style: '모던' },
      },
    },
    editorItems: [{ id: 'chair-1', x: 10, y: 20 }],
    trayItems: [{ id: 'table-1', name: '테이블' }],
    currentRecommendationDraft: { room: '거실', style: '모던' },
    saveState: { status: 'saved', message: '현재 배치를 계정 저장본으로 업데이트했어요.' },
  })

  assert.equal(state.hasDrift, true)
  assert.equal(state.restoreDisabled, false)
  assert.equal(state.message, null)
})

test('buildLayoutAuthPanelState enables restore when recommendation draft drift exists', () => {
  const state = buildLayoutAuthPanelState({
    authSession: {
      accountState: {
        layoutItems: [{ id: 'chair-1', x: 10, y: 20 }],
        layoutTrayItems: [{ id: 'sofa-1', name: '소파' }],
        recommendationDraft: { room: '거실', style: '모던', priority: '수납' },
      },
    },
    editorItems: [{ id: 'chair-1', x: 10, y: 20 }],
    trayItems: [{ id: 'sofa-1', name: '소파' }],
    currentRecommendationDraft: { room: '거실', style: '미니멀', priority: '수납' },
    saveState: { status: 'saved' },
  })

  assert.equal(state.hasDrift, true)
  assert.equal(state.restoreDisabled, false)
})


test('buildLayoutAuthPanelState keeps success copy visible while the board still matches the saved account state', () => {
  const state = buildLayoutAuthPanelState({
    authSession: {
      accountState: {
        layoutItems: [{ id: 'chair-1', x: 10, y: 20 }],
        layoutTrayItems: [{ id: 'table-1', name: '테이블' }],
        recommendationDraft: { room: '거실', style: '모던' },
      },
    },
    editorItems: [{ id: 'chair-1', x: 10, y: 20 }],
    trayItems: [{ id: 'table-1', name: '테이블' }],
    currentRecommendationDraft: { room: '거실', style: '모던' },
    saveState: { status: 'saved', message: '현재 배치를 계정 저장본으로 업데이트했어요.' },
  })

  assert.equal(state.hasDrift, false)
  assert.equal(state.message, '현재 배치를 계정 저장본으로 업데이트했어요.')
})

test('buildLayoutAuthPanelState explains first-save state when no account board exists yet', () => {
  const state = buildLayoutAuthPanelState({
    authSession: {
      accountState: {
        layoutItems: [],
        layoutTrayItems: [],
        recommendationDraft: null,
      },
    },
    editorItems: [{ id: 'chair-1', x: 10, y: 20 }],
    trayItems: [],
    saveState: { status: 'idle' },
  })

  assert.equal(state.hasSavedBoard, false)
  assert.equal(state.currentBoardSummary, '현재 보드 배치 1개 · 트레이 0개')
  assert.equal(state.boardComparisonCopy, '아직 계정 저장본이 없어요. 지금 보드를 첫 저장본으로 만들 수 있어요.')
})
