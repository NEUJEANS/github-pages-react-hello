function toIsoString(value = null) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function formatBoardSavedAtLabel(value = null) {
  const iso = toIsoString(value)
  if (!iso) return null

  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return null

  return `최근 저장 · ${parsed.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

function normalizeLabel(value = null) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeRecommendationDraft(draft = null) {
  if (!draft || typeof draft !== 'object') return null

  const entries = Object.entries(draft)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))

  if (!entries.length) return null
  return Object.fromEntries(entries)
}

function cloneTrayItems(items = []) {
  return Array.isArray(items) ? items.map((item) => ({ ...item })) : []
}

function buildBoardContextCopy({ room = null, draftLabel = null } = {}) {
  const parts = [normalizeLabel(room), normalizeLabel(draftLabel)].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

export function buildLayoutAuthPanelState({
  authSession = null,
  editorItems = [],
  trayItems = [],
  draftLabel = null,
  currentApartmentSelectionId = null,
  recommendationRoom = null,
  currentRecommendationDraft = null,
  saveState = null,
} = {}) {
  const accountState = authSession?.accountState ?? null
  const savedLayoutItems = Array.isArray(accountState?.layoutItems) ? accountState.layoutItems : []
  const savedTrayItems = cloneTrayItems(accountState?.layoutTrayItems)
  const currentTrayItems = cloneTrayItems(trayItems)
  const savedRecommendationDraft = normalizeRecommendationDraft(accountState?.recommendationDraft)
  const currentRecommendationDraftNormalized = normalizeRecommendationDraft(currentRecommendationDraft)
  const hasPersistedAccountBoardContext = Boolean(
    normalizeLabel(accountState?.apartmentSelectionId)
    || normalizeLabel(accountState?.apartmentLabel)
    || normalizeLabel(accountState?.draftLabel),
  )
  const savedDraftLabel = hasPersistedAccountBoardContext
    ? normalizeLabel(accountState?.apartmentLabel)
      ?? normalizeLabel(accountState?.draftLabel)
      ?? normalizeLabel(authSession?.draftSave?.apartmentLabel)
      ?? normalizeLabel(authSession?.draftSave?.draftLabel)
    : normalizeLabel(authSession?.draftSave?.apartmentLabel)
      ?? normalizeLabel(authSession?.draftSave?.draftLabel)
      ?? normalizeLabel(accountState?.apartmentLabel)
      ?? normalizeLabel(accountState?.draftLabel)
  const currentDraftLabel = normalizeLabel(draftLabel)
  const savedApartmentSelectionId = hasPersistedAccountBoardContext
    ? normalizeLabel(accountState?.apartmentSelectionId)
      ?? normalizeLabel(authSession?.draftSave?.apartmentSelectionId)
    : normalizeLabel(authSession?.draftSave?.apartmentSelectionId)
      ?? normalizeLabel(accountState?.apartmentSelectionId)
  const normalizedCurrentApartmentSelectionId = normalizeLabel(currentApartmentSelectionId)
  const layoutBoardSavedAt = toIsoString(accountState?.layoutBoardSavedAt ?? saveState?.savedAt ?? authSession?.savedAt ?? null)
  const savedLayoutCount = savedLayoutItems.length
  const currentLayoutCount = Array.isArray(editorItems) ? editorItems.length : 0
  const savedTrayCount = savedTrayItems.length
  const currentTrayCount = currentTrayItems.length
  const savedRoom = typeof accountState?.recommendationDraft?.room === 'string' && accountState.recommendationDraft.room.trim()
    ? accountState.recommendationDraft.room.trim()
    : (typeof recommendationRoom === 'string' && recommendationRoom.trim() ? recommendationRoom.trim() : null)
  const hasSavedLayout = savedLayoutCount > 0
  const hasCurrentLayout = currentLayoutCount > 0
  const hasSavedBoard = hasSavedLayout || savedTrayCount > 0 || Boolean(savedRecommendationDraft)
  const hasCurrentBoard = hasCurrentLayout || currentTrayCount > 0 || Boolean(currentRecommendationDraftNormalized)
  const layoutDrift = hasSavedLayout && JSON.stringify(savedLayoutItems) !== JSON.stringify(editorItems)
  const trayDrift = JSON.stringify(savedTrayItems) !== JSON.stringify(currentTrayItems)
  const recommendationDrift = Boolean(savedRecommendationDraft)
    && JSON.stringify(savedRecommendationDraft) !== JSON.stringify(currentRecommendationDraftNormalized)
  const savedBoardContextCopy = buildBoardContextCopy({
    room: savedRoom,
    draftLabel: savedDraftLabel,
  })
  const currentBoardContextCopy = buildBoardContextCopy({
    room: recommendationRoom,
    draftLabel: currentDraftLabel,
  })
  const boardContextMatches = savedApartmentSelectionId && normalizedCurrentApartmentSelectionId
    ? savedApartmentSelectionId === normalizedCurrentApartmentSelectionId
      && (savedRoom ?? null) === (recommendationRoom ?? null)
    : savedBoardContextCopy && currentBoardContextCopy
      ? savedBoardContextCopy === currentBoardContextCopy
      : savedBoardContextCopy === currentBoardContextCopy
  const contextDrift = Boolean(savedBoardContextCopy && currentBoardContextCopy && !boardContextMatches)
  const hasDrift = layoutDrift || trayDrift || recommendationDrift || contextDrift
  const status = saveState?.status ?? 'idle'
  const rawMessage = typeof saveState?.message === 'string' && saveState.message.trim() ? saveState.message.trim() : null
  const shouldHideStaleStatusMessage = hasDrift && (status === 'saved' || status === 'restored')

  const savedBoardSummary = hasSavedBoard
    ? `저장본 배치 ${savedLayoutCount}개 · 트레이 ${savedTrayCount}개`
    : null
  const currentBoardSummary = hasCurrentBoard
    ? `현재 보드 배치 ${currentLayoutCount}개 · 트레이 ${currentTrayCount}개`
    : null
  const boardComparisonCopy = !authSession
    ? null
    : !hasSavedBoard
      ? (currentBoardSummary ? '아직 계정 저장본이 없어요. 지금 보드를 첫 저장본으로 만들 수 있어요.' : '로그인 후 보드를 계정 저장본으로 만들 수 있어요.')
      : hasDrift
        ? '현재 보드가 계정 저장본과 달라졌어요. 다시 저장하거나 저장본으로 되돌릴 수 있어요.'
        : '현재 보드가 계정 저장본과 같아요.'
  return {
    isAuthenticated: Boolean(authSession),
    draftLabel: currentDraftLabel,
    savedDraftLabel,
    savedApartmentSelectionId,
    savedRoom,
    savedBoardContextCopy,
    currentBoardContextCopy,
    currentApartmentSelectionId: normalizedCurrentApartmentSelectionId,
    boardContextMatches,
    contextDrift,
    currentLayoutCount,
    savedLayoutCount,
    currentTrayCount,
    savedTrayCount,
    hasSavedLayout,
    hasCurrentLayout,
    hasSavedBoard,
    hasCurrentBoard,
    hasDrift,
    savedBoardSummary,
    currentBoardSummary,
    boardComparisonCopy,
    lastSavedAt: layoutBoardSavedAt,
    lastSavedAtLabel: formatBoardSavedAtLabel(layoutBoardSavedAt),
    status,
    message: shouldHideStaleStatusMessage ? null : rawMessage,
    saveButtonLabel: status === 'saving'
      ? '보드 저장 중…'
      : hasSavedBoard
        ? '현재 보드 다시 저장'
        : '현재 보드 계정에 저장',
    restoreButtonLabel: hasSavedBoard ? '계정 저장본 불러오기' : null,
    saveDisabled: !authSession || !hasCurrentBoard || status === 'saving',
    restoreDisabled: !authSession || !hasSavedBoard || status === 'saving' || !hasDrift,
  }
}
