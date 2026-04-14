function cloneCartItems(items = []) {
  return Array.isArray(items)
    ? items.map((item) => ({ id: item.id, qty: item.qty ?? 1 }))
    : []
}

function cloneLayoutItems(items = []) {
  return Array.isArray(items)
    ? items.map((item) => ({ ...item }))
    : []
}

function cloneLayoutTrayItems(items = []) {
  return Array.isArray(items)
    ? items.map((item) => ({ ...item }))
    : []
}

function cloneRecommendationDraft(draft = null) {
  if (!draft || typeof draft !== 'object') return null

  return {
    room: draft.room ?? null,
    style: draft.style ?? null,
    priority: draft.priority ?? null,
    lifestyle: [...(draft.lifestyle ?? [])],
    extraRequest: draft.extraRequest ?? '',
  }
}

function cloneSelectedSpaceIds(selectedSpaceIds = []) {
  return Array.isArray(selectedSpaceIds)
    ? selectedSpaceIds.filter((value, index, array) => typeof value === 'string' && value.trim() && array.indexOf(value) === index)
    : []
}

function normalizeLabel(value = null) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function buildRestoredRecommendationDraft(accountState = null, fallbackDraft = null) {
  return cloneRecommendationDraft(accountState?.recommendationDraft) ?? cloneRecommendationDraft(fallbackDraft)
}

export function buildAccountContinuityPatch(accountState = null) {
  if (!accountState || typeof accountState !== 'object') return null

  const selectedSpaceIds = cloneSelectedSpaceIds(accountState.selectedSpaceIds)
  const draftLabel = normalizeLabel(accountState.draftLabel)
  const apartmentLabel = normalizeLabel(accountState.apartmentLabel)

  return {
    wishlistIds: [...(accountState.wishlistIds ?? [])],
    cartItems: cloneCartItems(accountState.cartItems),
    layoutItems: cloneLayoutItems(accountState.layoutItems),
    ...(Array.isArray(accountState.layoutTrayItems)
      ? { layoutTrayItems: cloneLayoutTrayItems(accountState.layoutTrayItems) }
      : {}),
    ...(typeof accountState.apartmentSelectionId === 'string' && accountState.apartmentSelectionId.trim()
      ? { apartmentSelectionId: accountState.apartmentSelectionId.trim() }
      : {}),
    ...(draftLabel ? { draftLabel } : {}),
    ...(apartmentLabel ? { apartmentLabel } : {}),
    ...(selectedSpaceIds.length ? { selectedSpaceIds } : {}),
    ...(typeof accountState.layoutBoardSavedAt === 'string' && accountState.layoutBoardSavedAt.trim()
      ? { layoutBoardSavedAt: accountState.layoutBoardSavedAt.trim() }
      : {}),
    recommendationDraft: cloneRecommendationDraft(accountState.recommendationDraft),
  }
}
