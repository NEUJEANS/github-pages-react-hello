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

export function buildAccountContinuityPatch(accountState = null) {
  if (!accountState || typeof accountState !== 'object') return null

  return {
    wishlistIds: [...(accountState.wishlistIds ?? [])],
    cartItems: cloneCartItems(accountState.cartItems),
    layoutItems: cloneLayoutItems(accountState.layoutItems),
    ...(Array.isArray(accountState.layoutTrayItems)
      ? { layoutTrayItems: cloneLayoutTrayItems(accountState.layoutTrayItems) }
      : {}),
    recommendationDraft: cloneRecommendationDraft(accountState.recommendationDraft),
  }
}
