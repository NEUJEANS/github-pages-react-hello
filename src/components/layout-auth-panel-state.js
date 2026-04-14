function toIsoString(value = null) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function buildLayoutAuthPanelState({
  authSession = null,
  editorItems = [],
  draftLabel = null,
  recommendationRoom = null,
  saveState = null,
} = {}) {
  const accountState = authSession?.accountState ?? null
  const savedLayoutCount = Array.isArray(accountState?.layoutItems) ? accountState.layoutItems.length : 0
  const currentLayoutCount = Array.isArray(editorItems) ? editorItems.length : 0
  const savedRoom = typeof accountState?.recommendationDraft?.room === 'string' && accountState.recommendationDraft.room.trim()
    ? accountState.recommendationDraft.room.trim()
    : (typeof recommendationRoom === 'string' && recommendationRoom.trim() ? recommendationRoom.trim() : null)
  const hasSavedLayout = savedLayoutCount > 0
  const hasCurrentLayout = currentLayoutCount > 0
  const hasDrift = hasSavedLayout && JSON.stringify(accountState.layoutItems) !== JSON.stringify(editorItems)
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
