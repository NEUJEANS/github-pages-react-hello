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

export function buildSerializableAuthContinuation(continuation = null) {
  if (!continuation || typeof continuation !== 'object') return null

  const resumeToken = typeof continuation.resumeToken === 'string' ? continuation.resumeToken.trim() : ''
  const nextAction = typeof continuation.nextAction === 'string' ? continuation.nextAction.trim() : ''

  if (!resumeToken && !nextAction) return null

  return {
    resumeToken: resumeToken || null,
    nextAction: nextAction || null,
  }
}

function safeUrl(url) {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

function readCurrentOrigin(currentOrigin = '') {
  if (typeof currentOrigin === 'string' && currentOrigin.trim()) return currentOrigin.trim()
  if (typeof globalThis?.location?.origin === 'string' && globalThis.location.origin.trim()) return globalThis.location.origin.trim()
  return ''
}

export function buildAuthConnectionSummary(plan, { apiBaseUrl, currentOrigin, source = 'default', credentialsMode = 'include' } = {}) {
  const resolvedUrl = resolveAuthEndpoint(plan.endpoint, { apiBaseUrl })
  const resolved = safeUrl(resolvedUrl)
  const canonicalOrigin = readCurrentOrigin(currentOrigin)
  const isSameOriginScaffold = (!resolved && plan.endpoint.startsWith('/api/auth'))
    || Boolean(
      resolved
      && canonicalOrigin
      && resolved.origin === canonicalOrigin
      && resolved.pathname.startsWith('/api/auth'),
    )

  return {
    method: plan.method,
    endpoint: plan.endpoint,
    resolvedUrl,
    targetLabel: isSameOriginScaffold ? 'same-origin /api auth scaffold' : (resolved?.host ?? 'same-origin /api auth scaffold'),
    isExternal: !isSameOriginScaffold && Boolean(resolved?.host),
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

export function buildPersistedAuthHandoff(plan, guestDraftSnapshot, { submittedAt = new Date().toISOString(), connection = null, continuation = null } = {}) {
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
    continuation: buildSerializableAuthContinuation(continuation),
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

function buildSerializableAuthAccountState(accountState = null) {
  if (!accountState || typeof accountState !== 'object') return null

  const wishlistIds = Array.isArray(accountState.wishlistIds)
    ? accountState.wishlistIds.filter((value) => typeof value === 'string' && value.trim())
    : []
  const cartItems = Array.isArray(accountState.cartItems)
    ? accountState.cartItems.map((item) => ({ id: item.id, qty: item.qty ?? 1 }))
    : []
  const layoutItems = Array.isArray(accountState.layoutItems)
    ? accountState.layoutItems.map((item) => ({ ...item }))
    : []
  const recommendationDraft = accountState.recommendationDraft && typeof accountState.recommendationDraft === 'object'
    ? {
        room: accountState.recommendationDraft.room ?? null,
        style: accountState.recommendationDraft.style ?? null,
        priority: accountState.recommendationDraft.priority ?? null,
        lifestyle: [...(accountState.recommendationDraft.lifestyle ?? [])],
        extraRequest: accountState.recommendationDraft.extraRequest ?? '',
      }
    : null

  if (!wishlistIds.length && !cartItems.length && !layoutItems.length && !recommendationDraft) return null

  return {
    wishlistIds,
    cartItems,
    layoutItems,
    recommendationDraft,
  }
}

export function buildPersistedAuthSession(resultSummary, { guestDraftSnapshot = null, savedAt = new Date().toISOString(), intent = null, connection = null, continuation = null, accountState = null } = {}) {
  const derivedGuestDraftSummary = guestDraftSnapshot
    ? buildGuestDraftSessionSummary(guestDraftSnapshot)
    : (resultSummary?.guestDraftSummary ?? null)

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
    continuation: buildSerializableAuthContinuation(continuation ?? resultSummary),
    guestDraftSummary: derivedGuestDraftSummary,
    accountState: buildSerializableAuthAccountState(accountState ?? resultSummary?.accountState ?? null),
  }
}

function buildAuthResumeResult(handoff = null) {
  if (!handoff || typeof handoff !== 'object') return null

  const status = typeof handoff.status === 'number' ? handoff.status : null
  const message = typeof handoff.error === 'string' && handoff.error.trim()
    ? handoff.error.trim()
    : null
  const allowedMergeResolutions = Array.isArray(handoff.allowedMergeResolutions)
    ? [...handoff.allowedMergeResolutions]
    : (handoff.allowedMergeResolutions === null ? [] : undefined)
  const continuation = buildSerializableAuthContinuation(handoff.continuation)

  if (status === null && !message && !continuation && allowedMergeResolutions === undefined) return null

  return {
    ok: false,
    status: status ?? 0,
    data: {
      ...(message ? { message } : {}),
      ...(continuation ?? {}),
      ...(allowedMergeResolutions !== undefined ? { allowedMergeResolutions } : {}),
    },
  }
}

export function buildAuthResumeState(handoff, session = null) {
  if (!handoff) return null

  return {
    email: handoff.email ?? '',
    handoffId: handoff.handoffId ?? handoff.summary?.handoffId ?? null,
    status: 'resume-ready',
    result: buildAuthResumeResult(handoff),
    resumedAt: new Date().toISOString(),
    handoff,
    session,
    mergeResolution: handoff.summary?.mergeResolution ?? null,
    intent: buildSerializableAuthIntent(handoff.summary?.intent ?? session?.intent ?? null),
    connection: buildSerializableAuthConnection(handoff.connection ?? session?.connection ?? null),
    continuation: buildSerializableAuthContinuation(handoff.continuation ?? session?.continuation ?? null),
  }
}

export function buildAuthReadyState(session = null, { intent = null } = {}) {
  if (!session?.accountLabel && !session?.sessionId) return null

  return {
    email: session.accountLabel ?? '',
    handoffId: session.handoffId ?? null,
    status: 'ready',
    result: null,
    resumedAt: session.savedAt ?? new Date().toISOString(),
    handoff: null,
    session,
    mergeResolution: null,
    intent: buildSerializableAuthIntent(intent ?? session.intent ?? null),
    connection: buildSerializableAuthConnection(session.connection ?? null),
    continuation: buildSerializableAuthContinuation(session.continuation ?? null),
    accountState: buildSerializableAuthAccountState(session.accountState ?? null),
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
