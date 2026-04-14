import test from 'node:test'
import assert from 'node:assert/strict'

import { buildLayoutAuthPanelState } from './layout-auth-panel-state.js'

test('buildLayoutAuthPanelState exposes authenticated save + restore affordances', () => {
  const state = buildLayoutAuthPanelState({
    authSession: {
      savedAt: '2026-04-14T03:23:00.000Z',
      draftSave: {
        apartmentLabel: '래미안 포레스트 84A',
        apartmentSelectionId: 'raemian-forest-84a',
      },
      accountState: {
        layoutItems: [{ id: 'saved-chair' }],
        recommendationDraft: { room: '거실' },
      },
    },
    editorItems: [{ id: 'live-chair' }, { id: 'live-sofa' }],
    draftLabel: '거실 84A',
    currentApartmentSelectionId: 'raemian-forest-84a',
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
  assert.equal(state.savedBoardContextCopy, '거실 · 래미안 포레스트 84A')
  assert.equal(state.currentBoardContextCopy, '거실 · 거실 84A')
  assert.equal(state.boardContextMatches, true)
  assert.equal(state.lastSavedAt, '2026-04-14T03:23:00.000Z')
  assert.equal(state.lastSavedAtLabel, '최근 저장 · 2026-04-14 03:23 UTC')
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

test('buildLayoutAuthPanelState keeps saved board context separate from the current layout context', () => {
  const state = buildLayoutAuthPanelState({
    authSession: {
      draftSave: {
        apartmentLabel: '트리마제 101동',
      },
      accountState: {
        layoutItems: [{ id: 'chair-1', x: 10, y: 20 }],
        layoutTrayItems: [{ id: 'table-1', name: '테이블' }],
        recommendationDraft: { room: '거실', style: '모던' },
      },
    },
    editorItems: [{ id: 'chair-1', x: 10, y: 20 }],
    trayItems: [{ id: 'table-1', name: '테이블' }],
    draftLabel: '래미안 포레스트 84A',
    recommendationRoom: '침실',
    currentRecommendationDraft: { room: '침실', style: '모던' },
    saveState: { status: 'idle' },
  })

  assert.equal(state.savedBoardContextCopy, '거실 · 트리마제 101동')
  assert.equal(state.currentBoardContextCopy, '침실 · 래미안 포레스트 84A')
  assert.equal(state.boardContextMatches, false)
})

test('buildLayoutAuthPanelState does not force perpetual drift when older saved boards have no persisted recommendation draft', () => {
  const state = buildLayoutAuthPanelState({
    authSession: {
      accountState: {
        layoutItems: [{ id: 'chair-1', x: 10, y: 20 }],
        layoutTrayItems: [{ id: 'table-1', name: '테이블' }],
        recommendationDraft: null,
      },
    },
    editorItems: [{ id: 'chair-1', x: 10, y: 20 }],
    trayItems: [{ id: 'table-1', name: '테이블' }],
    currentRecommendationDraft: { room: '거실', style: 'minimal', priority: 'flow', lifestyle: ['기본'] },
    saveState: { status: 'restored', message: '계정에 저장된 보드를 다시 불러왔어요.' },
  })

  assert.equal(state.hasDrift, false)
  assert.equal(state.restoreDisabled, true)
  assert.equal(state.boardComparisonCopy, '현재 보드가 계정 저장본과 같아요.')
})

test('buildLayoutAuthPanelState does not report context drift when apartment ids match but labels differ', () => {
  const state = buildLayoutAuthPanelState({
    authSession: {
      draftSave: {
        apartmentLabel: '래미안 포레스트 84A',
        apartmentSelectionId: 'raemian-forest-84a',
      },
      accountState: {
        layoutItems: [{ id: 'chair-1', x: 10, y: 20 }],
        layoutTrayItems: [{ id: 'table-1', name: '테이블' }],
        apartmentSelectionId: 'raemian-forest-84a',
        recommendationDraft: { room: '거실', style: '모던' },
      },
    },
    editorItems: [{ id: 'chair-1', x: 10, y: 20 }],
    trayItems: [{ id: 'table-1', name: '테이블' }],
    draftLabel: '84A · 3개 공간 선택',
    currentApartmentSelectionId: 'raemian-forest-84a',
    recommendationRoom: '거실',
    currentRecommendationDraft: { room: '거실', style: '모던' },
    saveState: { status: 'idle' },
  })

  assert.equal(state.contextDrift, false)
  assert.equal(state.hasDrift, false)
  assert.equal(state.restoreDisabled, true)
  assert.equal(state.boardComparisonCopy, '현재 보드가 계정 저장본과 같아요.')
})

test('buildLayoutAuthPanelState enables restore when only the saved/current context copy drifts', () => {
  const state = buildLayoutAuthPanelState({
    authSession: {
      draftSave: {
        apartmentLabel: '래미안 포레스트 84A',
        apartmentSelectionId: 'raemian-forest-84a',
      },
      accountState: {
        layoutItems: [{ id: 'chair-1', x: 10, y: 20 }],
        layoutTrayItems: [{ id: 'table-1', name: '테이블' }],
        apartmentSelectionId: 'raemian-forest-84a',
        recommendationDraft: { room: '거실', style: '모던' },
      },
    },
    editorItems: [{ id: 'chair-1', x: 10, y: 20 }],
    trayItems: [{ id: 'table-1', name: '테이블' }],
    draftLabel: '아크로 리버뷰 101A',
    currentApartmentSelectionId: 'acrovista-river-101a',
    recommendationRoom: '거실',
    currentRecommendationDraft: { room: '거실', style: '모던' },
    saveState: { status: 'idle' },
  })

  assert.equal(state.contextDrift, true)
  assert.equal(state.hasDrift, true)
  assert.equal(state.restoreDisabled, false)
  assert.equal(state.boardComparisonCopy, '현재 보드가 계정 저장본과 달라졌어요. 다시 저장하거나 저장본으로 되돌릴 수 있어요.')
})

test('buildLayoutAuthPanelState prefers persisted account board context when draftSave is unavailable', () => {
  const state = buildLayoutAuthPanelState({
    authSession: {
      accountState: {
        layoutItems: [{ id: 'chair-1' }],
        layoutTrayItems: [{ id: 'table-1', name: '테이블' }],
        apartmentSelectionId: 'raemian-forest-84a',
        apartmentLabel: '래미안 포레스트 84A',
        recommendationDraft: { room: '거실' },
      },
    },
    editorItems: [{ id: 'chair-1' }],
    trayItems: [{ id: 'table-1', name: '테이블' }],
    draftLabel: '84A · 3개 공간 선택',
    currentApartmentSelectionId: 'raemian-forest-84a',
    recommendationRoom: '거실',
    currentRecommendationDraft: { room: '거실' },
    saveState: { status: 'idle' },
  })

  assert.equal(state.savedBoardContextCopy, '거실 · 래미안 포레스트 84A')
  assert.equal(state.contextDrift, false)
})

test('buildLayoutAuthPanelState prefers persisted account board context over stale draftSave labels', () => {
  const state = buildLayoutAuthPanelState({
    authSession: {
      draftSave: {
        apartmentSelectionId: 'raemian-forest-84a',
        apartmentLabel: '래미안 포레스트 84A',
      },
      accountState: {
        layoutItems: [{ id: 'chair-1' }],
        layoutTrayItems: [{ id: 'table-1', name: '테이블' }],
        apartmentSelectionId: 'acrovista-river-101a',
        apartmentLabel: '아크로 리버뷰 101A',
        recommendationDraft: { room: '거실' },
      },
    },
    editorItems: [{ id: 'chair-1' }],
    trayItems: [{ id: 'table-1', name: '테이블' }],
    draftLabel: '84A · 3개 공간 선택',
    currentApartmentSelectionId: 'raemian-forest-84a',
    recommendationRoom: '거실',
    currentRecommendationDraft: { room: '거실' },
    saveState: { status: 'idle' },
  })

  assert.equal(state.savedBoardContextCopy, '거실 · 아크로 리버뷰 101A')
  assert.equal(state.currentBoardContextCopy, '거실 · 84A · 3개 공간 선택')
  assert.equal(state.contextDrift, true)
  assert.equal(state.hasDrift, true)
  assert.equal(state.restoreDisabled, false)
})

test('buildLayoutAuthPanelState prefers persisted board save timestamps over session timestamps', () => {
  const state = buildLayoutAuthPanelState({
    authSession: {
      savedAt: '2026-04-14T03:23:00.000Z',
      accountState: {
        layoutItems: [{ id: 'chair-1' }],
        layoutTrayItems: [{ id: 'table-1', name: '테이블' }],
        layoutBoardSavedAt: '2026-04-14T09:18:00.000Z',
        recommendationDraft: { room: '거실' },
      },
    },
    editorItems: [{ id: 'chair-1' }],
    trayItems: [{ id: 'table-1', name: '테이블' }],
    currentRecommendationDraft: { room: '거실' },
    saveState: { status: 'idle' },
  })

  assert.equal(state.lastSavedAt, '2026-04-14T09:18:00.000Z')
  assert.equal(state.lastSavedAtLabel, '최근 저장 · 2026-04-14 09:18 UTC')
})
