import { resolveAuthEndpoint } from './auth-submit.js'

export const AUTH_HANDOFF_STORAGE_KEY = 'havenly.auth.handoff'
export const AUTH_SESSION_STORAGE_KEY = 'havenly.auth.session'

function safeHostLabel(url) {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

export function buildAuthConnectionSummary(plan, { apiBaseUrl, source = 'default' } = {}) {
  const resolvedUrl = resolveAuthEndpoint(plan.endpoint, { apiBaseUrl })
  const hostLabel = safeHostLabel(resolvedUrl)
  const isSameOriginScaffold = !hostLabel && plan.endpoint.startsWith('/api/auth')

  return {
    method: plan.method,
    endpoint: plan.endpoint,
    resolvedUrl,
    targetLabel: hostLabel ?? 'same-origin /api auth scaffold',
    isExternal: Boolean(hostLabel),
    isSameOriginScaffold,
    source,
  }
}

export function buildPersistedAuthHandoff(plan, guestDraftSnapshot, { submittedAt = new Date().toISOString() } = {}) {
  return {
    submittedAt,
    endpoint: plan.endpoint,
    method: plan.method,
    email: plan.summary.email,
    summary: { ...plan.summary },
    guestDraftSnapshot,
  }
}

export function buildGuestDraftSessionSummary(guestDraftSnapshot = null) {
  if (!guestDraftSnapshot) return null

  const continuity = guestDraftSnapshot.continuity ?? {}
  const selectedRooms = [...(continuity.selectedRooms ?? [])]

  return {
    apartmentLabel: continuity.apartmentLabel ?? null,
    selectedRoomCount: selectedRooms.length,
    selectedRooms,
    recommendationRoom: guestDraftSnapshot.recommendationDraft?.room ?? null,
    wishlistCount: Array.isArray(continuity.wishlistIds) ? continuity.wishlistIds.length : 0,
    cartCount: Array.isArray(continuity.cartItems) ? continuity.cartItems.length : 0,
    layoutItemCount: Array.isArray(continuity.layoutItems) ? continuity.layoutItems.length : 0,
  }
}

export function buildPersistedAuthSession(resultSummary, { guestDraftSnapshot = null, savedAt = new Date().toISOString() } = {}) {
  return {
    savedAt,
    sessionId: resultSummary?.sessionId ?? null,
    accountLabel: resultSummary?.accountLabel ?? null,
    mergeMode: resultSummary?.mergeMode ?? null,
    mergedDraftCount: resultSummary?.mergedDraftCount ?? 0,
    restoredWishlistCount: resultSummary?.restoredWishlistCount ?? 0,
    restoredCartCount: resultSummary?.restoredCartCount ?? 0,
    restoredLayoutItemCount: resultSummary?.restoredLayoutItemCount ?? 0,
    restoredRecommendationDraft: Boolean(resultSummary?.restoredRecommendationDraft),
    wishlistCount: resultSummary?.wishlistCount ?? 0,
    cartCount: resultSummary?.cartCount ?? 0,
    layoutItemCount: resultSummary?.layoutItemCount ?? 0,
    hasRecommendationDraft: Boolean(resultSummary?.hasRecommendationDraft),
    guestDraftSummary: buildGuestDraftSessionSummary(guestDraftSnapshot),
  }
}

export function buildAuthResumeState(handoff, session = null) {
  if (!handoff) return null

  return {
    email: handoff.email ?? '',
    status: 'resume-ready',
    result: null,
    resumedAt: new Date().toISOString(),
    handoff,
    session,
  }
}

function safeSetItem(storage, key, value) {
  if (!storage?.setItem) return false

  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function safeGetItem(storage, key) {
  if (!storage?.getItem) return null

  try {
    const value = storage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function safeRemoveItem(storage, key) {
  if (!storage?.removeItem) return false

  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function persistAuthHandoff(storage, handoff) {
  return safeSetItem(storage, AUTH_HANDOFF_STORAGE_KEY, handoff)
}

export function readPersistedAuthHandoff(storage) {
  return safeGetItem(storage, AUTH_HANDOFF_STORAGE_KEY)
}

export function clearPersistedAuthHandoff(storage) {
  return safeRemoveItem(storage, AUTH_HANDOFF_STORAGE_KEY)
}

export function persistAuthSession(storage, session) {
  return safeSetItem(storage, AUTH_SESSION_STORAGE_KEY, session)
}

export function readPersistedAuthSession(storage) {
  return safeGetItem(storage, AUTH_SESSION_STORAGE_KEY)
}

export function clearPersistedAuthSession(storage) {
  return safeRemoveItem(storage, AUTH_SESSION_STORAGE_KEY)
}
