function toIsoString(value = null) {
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

export function buildLayoutAuthPanelState({
  authSession = null,
  editorItems = [],
  trayItems = [],
  draftLabel = null,
  recommendationRoom = null,
  currentRecommendationDraft = null,
  saveState = null,
} = {}) {
  const accountState = authSession?.accountState ?? null
  const savedLayoutItems = Array.isArray(accountState?.layoutItems) ? accountState.layoutItems : []
  const savedTrayItems = cloneTrayItems(accountState?.layoutTrayItems)
  const currentTrayItems = cloneTrayItems(trayItems)
  const savedLayoutCount = savedLayoutItems.length
  const currentLayoutCount = Array.isArray(editorItems) ? editorItems.length : 0
  const savedRoom = typeof accountState?.recommendationDraft?.room === 'string' && accountState.recommendationDraft.room.trim()
    ? accountState.recommendationDraft.room.trim()
    : (typeof recommendationRoom === 'string' && recommendationRoom.trim() ? recommendationRoom.trim() : null)
  const hasSavedLayout = savedLayoutCount > 0
  const hasCurrentLayout = currentLayoutCount > 0
  const layoutDrift = hasSavedLayout && JSON.stringify(savedLayoutItems) !== JSON.stringify(editorItems)
  const trayDrift = savedTrayItems.length > 0 && JSON.stringify(savedTrayItems) !== JSON.stringify(currentTrayItems)
  const recommendationDrift = Boolean(normalizeRecommendationDraft(accountState?.recommendationDraft) || normalizeRecommendationDraft(currentRecommendationDraft))
    && JSON.stringify(normalizeRecommendationDraft(accountState?.recommendationDraft)) !== JSON.stringify(normalizeRecommendationDraft(currentRecommendationDraft))
  const hasDrift = layoutDrift || trayDrift || recommendationDrift
  const status = saveState?.status ?? 'idle'

  return {
    isAuthenticated: Boolean(authSession),
    draftLabel: typeof draftLabel === 'string' && draftLabel.trim() ? draftLabel.trim() : null,
    savedRoom,
    currentLayoutCount,
    savedLayoutCount,
    hasSavedLayout,
    hasCurrentLayout,
    hasDrift,
    lastSavedAt: toIsoString(saveState?.savedAt ?? authSession?.savedAt ?? null),
    status,
    message: typeof saveState?.message === 'string' && saveState.message.trim() ? saveState.message.trim() : null,
    saveButtonLabel: status === 'saving'
      ? '보드 저장 중…'
      : hasSavedLayout
        ? '현재 배치 다시 저장'
        : '현재 배치 계정에 저장',
    restoreButtonLabel: hasSavedLayout ? '계정 저장본 불러오기' : null,
    saveDisabled: !authSession || !hasCurrentLayout || status === 'saving',
    restoreDisabled: !authSession || !hasSavedLayout || status === 'saving' || !hasDrift,
  }
}
