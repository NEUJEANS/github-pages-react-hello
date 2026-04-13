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

export function buildPostAuthContinuityPatch(result) {
  const mergedDraft = result?.data?.mergedGuestDraft ?? null
  const accountState = result?.data?.accountState ?? null

  if (!mergedDraft || mergedDraft.mode !== 'replaced') return null

  return {
    mergeMode: mergedDraft.mode,
    wishlistIds: [...(accountState?.wishlistIds ?? [])],
    cartItems: cloneCartItems(accountState?.cartItems),
    layoutItems: cloneLayoutItems(accountState?.layoutItems),
    recommendationDraft: cloneRecommendationDraft(accountState?.recommendationDraft),
  }
}
