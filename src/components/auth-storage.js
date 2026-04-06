import { resolveAuthEndpoint } from './auth-submit.js'

export const AUTH_HANDOFF_STORAGE_KEY = 'havenly.auth.handoff'
export const AUTH_SESSION_STORAGE_KEY = 'havenly.auth.session'

export function buildSerializableAuthIntent(intent = null) {
  if (!intent || typeof intent !== 'object') return null

  const source = typeof intent.source === 'string' ? intent.source.trim() : ''
  const action = typeof intent.action === 'string' ? intent.action.trim() : ''
  const label = typeof intent.label === 'string' ? intent.label.trim() : ''
  const returnScreen = typeof intent.returnScreen === 'string' ? intent.returnScreen.trim() : ''
  const draftLabel = typeof intent.draftLabel === 'string' ? intent.draftLabel.trim() : ''

  if (!source && !action && !label && !returnScreen && !draftLabel) return null

  return {
    source: source || null,
    action: action || null,
    label: label || null,
    returnScreen: returnScreen || null,
    draftLabel: draftLabel || null,
  }
}

export function buildSerializableAuthConnection(connection = null) {
  if (!connection || typeof connection !== 'object') return null

  const method = typeof connection.method === 'string' ? connection.method.trim() : ''
  const endpoint = typeof connection.endpoint === 'string' ? connection.endpoint.trim() : ''
  const resolvedUrl = typeof connection.resolvedUrl === 'string' ? connection.resolvedUrl.trim() : ''
  const targetLabel = typeof connection.targetLabel === 'string' ? connection.targetLabel.trim() : ''
  const credentialsMode = typeof connection.credentialsMode === 'string' ? connection.credentialsMode.trim() : ''
  const source = typeof connection.source === 'string' ? connection.source.trim() : ''

  if (!method && !endpoint && !resolvedUrl && !targetLabel && !credentialsMode && !source) return null

  return {
    method: method || null,
    endpoint: endpoint || null,
    resolvedUrl: resolvedUrl || null,
    targetLabel: targetLabel || null,
    isExternal: Boolean(connection.isExternal),
    isSameOriginScaffold: Boolean(connection.isSameOriginScaffold),
    credentialsMode: credentialsMode || null,
    source: source || null,
  }
}

function safeHostLabel(url) {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

export function buildAuthConnectionSummary(plan, { apiBaseUrl, source = 'default', credentialsMode = 'include' } = {}) {
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
    credentialsMode,
    source,
  }
}

export function createAuthHandoffId({ now = new Date(), random = Math.random } = {}) {
  const timestamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  const entropy = Math.floor(random() * 1e6).toString(36).padStart(4, '0').slice(0, 4)
  return `auth-${timestamp}-${entropy}`
}

export function buildPersistedAuthHandoff(plan, guestDraftSnapshot, { submittedAt = new Date().toISOString(), connection = null } = {}) {
  return {
    submittedAt,
    handoffId: plan.handoffId ?? plan.summary?.handoffId ?? null,
    endpoint: plan.endpoint,
    method: plan.method,
    email: plan.summary.email,
    summary: {
      ...plan.summary,
      intent: buildSerializableAuthIntent(plan.summary?.intent),
    },
    connection: buildSerializableAuthConnection(connection),
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
    selectedSpaceIds: Array.isArray(guestDraftSnapshot.spaceProfile?.spaces)
      ? [...guestDraftSnapshot.spaceProfile.spaces]
      : [],
    recommendationRoom: guestDraftSnapshot.recommendationDraft?.room ?? null,
    wishlistCount: Array.isArray(continuity.wishlistIds) ? continuity.wishlistIds.length : 0,
    cartCount: Array.isArray(continuity.cartItems) ? continuity.cartItems.length : 0,
    layoutItemCount: Array.isArray(continuity.layoutItems) ? continuity.layoutItems.length : 0,
  }
}

export function buildPersistedAuthSession(resultSummary, { guestDraftSnapshot = null, savedAt = new Date().toISOString(), intent = null, connection = null } = {}) {
  return {
    savedAt,
    sessionId: resultSummary?.sessionId ?? null,
    handoffId: resultSummary?.handoffId ?? null,
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
    authMode: resultSummary?.authMode ?? 'remote',
    authTransport: resultSummary?.authTransport ?? 'network',
    intent: buildSerializableAuthIntent(intent ?? resultSummary?.intent ?? null),
    connection: buildSerializableAuthConnection(connection),
    guestDraftSummary: buildGuestDraftSessionSummary(guestDraftSnapshot),
  }
}

export function buildAuthResumeState(handoff, session = null) {
  if (!handoff) return null

  return {
    email: handoff.email ?? '',
    handoffId: handoff.handoffId ?? handoff.summary?.handoffId ?? null,
    status: 'resume-ready',
    result: null,
    resumedAt: new Date().toISOString(),
    handoff,
    session,
    mergeResolution: handoff.summary?.mergeResolution ?? null,
    intent: buildSerializableAuthIntent(handoff.summary?.intent ?? session?.intent ?? null),
    connection: buildSerializableAuthConnection(handoff.connection ?? session?.connection ?? null),
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
