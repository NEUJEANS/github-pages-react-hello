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

export function resolveAuthConnectionOverride(result = null, fallbackConnection = null) {
  return buildSerializableAuthConnection(result?.data?.connection ?? result?.data?.authConnection ?? null)
    ?? buildSerializableAuthConnection(fallbackConnection)
    ?? null
}

export function resolvePersistedAuthConnection(result = null, fallbackConnection = null) {
  const resolvedConnection = buildSerializableAuthConnection(result?.data?.connection ?? result?.data?.authConnection ?? null)
  const fallback = buildSerializableAuthConnection(fallbackConnection)

  if (!resolvedConnection) return fallback ?? null
  if (!fallback) return resolvedConnection

  const resolvedEndpoint = typeof resolvedConnection.endpoint === 'string' ? resolvedConnection.endpoint.trim() : ''
  const fallbackEndpoint = typeof fallback.endpoint === 'string' ? fallback.endpoint.trim() : ''
  const continuationEndpoint = resolvedEndpoint.endsWith('/api/auth/continue') || resolvedEndpoint === '/api/auth/continue'
  const canonicalSessionEndpoint = fallbackEndpoint.endsWith('/api/auth/login') || fallbackEndpoint.endsWith('/api/auth/session') || fallbackEndpoint === '/api/auth/login' || fallbackEndpoint === '/api/auth/session'

  if (continuationEndpoint && canonicalSessionEndpoint) {
    return fallback
  }

  return resolvedConnection
}

export function hasAuthConnectionDrift(savedConnection = null, activeConnection = null) {
  const saved = buildSerializableAuthConnection(savedConnection)
  const active = buildSerializableAuthConnection(activeConnection)

  if (!saved || !active) return false

  return [
    'resolvedUrl',
    'endpoint',
    'targetLabel',
    'credentialsMode',
    'source',
    'method',
  ].some((key) => (saved[key] ?? null) !== (active[key] ?? null))
}

export function buildAuthConnectionDriftSummary(savedConnection = null, activeConnection = null) {
  if (!hasAuthConnectionDrift(savedConnection, activeConnection)) return null

  const saved = buildSerializableAuthConnection(savedConnection)
  const active = buildSerializableAuthConnection(activeConnection)
  const changes = []

  if ((saved?.targetLabel ?? null) !== (active?.targetLabel ?? null)) {
    changes.push(`target ${saved?.targetLabel ?? 'unknown'} → ${active?.targetLabel ?? 'unknown'}`)
  }
  if ((saved?.endpoint ?? null) !== (active?.endpoint ?? null)) {
    changes.push(`endpoint ${saved?.endpoint ?? 'unknown'} → ${active?.endpoint ?? 'unknown'}`)
  }
  if ((saved?.credentialsMode ?? null) !== (active?.credentialsMode ?? null)) {
    changes.push(`credentials ${saved?.credentialsMode ?? 'unknown'} → ${active?.credentialsMode ?? 'unknown'}`)
  }
  if ((saved?.source ?? null) !== (active?.source ?? null)) {
    changes.push(`source ${saved?.source ?? 'unknown'} → ${active?.source ?? 'unknown'}`)
  }

  return {
    saved,
    active,
    changes,
  }
}

function normalizeAuthContinuationNextAction(nextAction = '') {
  switch (nextAction) {
    case 'login':
      return 'resume-authenticated-flow'
    case 'checkout':
      return 'checkout-cart'
    default:
      return nextAction
  }
}

export function buildSerializableAuthContinuation(continuation = null) {
  if (!continuation || typeof continuation !== 'object') return null

  const resumeToken = typeof continuation.resumeToken === 'string' ? continuation.resumeToken.trim() : ''
  const nextAction = normalizeAuthContinuationNextAction(
    typeof continuation.nextAction === 'string' ? continuation.nextAction.trim() : '',
  )
  const status = typeof continuation.status === 'string' ? continuation.status.trim() : ''
  const statusLabel = typeof continuation.statusLabel === 'string' ? continuation.statusLabel.trim() : ''

  if (!resumeToken && !nextAction && !status && !statusLabel) return null

  return {
    resumeToken: resumeToken || null,
    nextAction: nextAction || null,
    status: status || null,
    statusLabel: statusLabel || null,
  }
}

export function buildSerializableAuthContinuationFields(fields = null) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return null

  const entries = Object.entries(fields)
    .map(([key, value]) => [typeof key === 'string' ? key.trim() : '', typeof value === 'string' ? value.trim() : value])
    .filter(([key, value]) => key && value !== undefined && value !== null && value !== '')

  if (!entries.length) return null

  return Object.fromEntries(entries)
}

function safeUrl(url) {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

function trimTrailingSlash(value = '') {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function trimLeadingSlash(value = '') {
  return value.startsWith('/') ? value.slice(1) : value
}

function normalizeAppBasePath(appBasePath = '') {
  const normalized = typeof appBasePath === 'string' ? appBasePath.trim() : ''
  if (!normalized || normalized === '/') return ''
  return `/${trimLeadingSlash(trimTrailingSlash(normalized))}`
}

function resolveCanonicalSameOriginAuthUrl(endpoint = '', { appBasePath } = {}) {
  if (typeof endpoint !== 'string' || !endpoint.startsWith('/')) return endpoint

  const normalizedAppBasePath = normalizeAppBasePath(appBasePath)
  if (!normalizedAppBasePath || !endpoint.startsWith('/api/auth/')) return endpoint

  return `${normalizedAppBasePath}${endpoint}`
}

function readCurrentOrigin(currentOrigin = '') {
  if (typeof currentOrigin === 'string' && currentOrigin.trim()) return currentOrigin.trim()
  if (typeof globalThis?.location?.origin === 'string' && globalThis.location.origin.trim()) return globalThis.location.origin.trim()
  return ''
}

export function buildAuthConnectionSummary(plan, { apiBaseUrl, appBasePath, currentOrigin, source = 'default', credentialsMode = 'include' } = {}) {
  const endpoint = typeof plan?.endpoint === 'string' ? plan.endpoint.trim() : ''
  const resolvedUrl = endpoint.startsWith('/')
    ? resolveCanonicalSameOriginAuthUrl(endpoint, { appBasePath })
    : resolveAuthEndpoint(endpoint, { apiBaseUrl, appBasePath, currentOrigin })
  const resolved = safeUrl(resolvedUrl)
  const canonicalOrigin = readCurrentOrigin(currentOrigin)
  const isSameOriginScaffold = endpoint.startsWith('/')
    || Boolean(
      resolved
      && canonicalOrigin
      && resolved.origin === canonicalOrigin
      && resolved.pathname.includes('/api/auth/'),
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

function buildSerializableAuthHandoffResult(result = null) {
  if (!result || typeof result !== 'object') return {}

  const status = typeof result.status === 'number' ? result.status : null
  const data = result.data && typeof result.data === 'object' && !Array.isArray(result.data)
    ? result.data
    : null
  const message = typeof data?.message === 'string' && data.message.trim()
    ? data.message.trim()
    : (typeof data?.error === 'string' && data.error.trim() ? data.error.trim() : null)
  const allowedMergeResolutions = Array.isArray(data?.allowedMergeResolutions)
    ? [...data.allowedMergeResolutions]
    : (data?.allowedMergeResolution ? [data.allowedMergeResolution] : null)

  return {
    ...(status !== null ? { status } : {}),
    ...(message ? { error: message } : {}),
    ...(allowedMergeResolutions?.length ? { allowedMergeResolutions } : {}),
  }
}

export function buildPersistedAuthHandoff(plan, guestDraftSnapshot, { submittedAt = new Date().toISOString(), connection = null, actionConnection = null, continuation = null, continuationFields = null, draftSave = null, result = null } = {}) {
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
    actionConnection: buildSerializableAuthConnection(actionConnection),
    continuation: buildSerializableAuthContinuation(continuation),
    continuationFields: buildSerializableAuthContinuationFields(continuationFields),
    draftSave: buildSerializableDraftSave(draftSave),
    guestDraftSnapshot,
    ...buildSerializableAuthHandoffResult(result),
  }
}

export function buildGuestDraftSessionSummary(guestDraftSnapshot = null) {
  if (!guestDraftSnapshot) return null

  const continuity = guestDraftSnapshot.continuity ?? {}
  const selectedRooms = [...(continuity.selectedRooms ?? [])]

  return {
    apartmentLabel: continuity.apartmentLabel ?? null,
    ...(guestDraftSnapshot.spaceProfile?.apartmentSelectionId ? { apartmentSelectionId: guestDraftSnapshot.spaceProfile.apartmentSelectionId } : {}),
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

function buildGuestDraftSummaryFromDraftSave(draftSave = null) {
  const serializableDraftSave = buildSerializableDraftSave(draftSave)
  if (!serializableDraftSave) return null

  return {
    apartmentLabel: serializableDraftSave.apartmentLabel ?? serializableDraftSave.draftLabel ?? null,
    ...(serializableDraftSave.apartmentSelectionId ? { apartmentSelectionId: serializableDraftSave.apartmentSelectionId } : {}),
    selectedRoomCount: Array.isArray(serializableDraftSave.selectedSpaceIds)
      ? serializableDraftSave.selectedSpaceIds.length
      : 0,
    selectedRooms: [],
    selectedSpaceIds: Array.isArray(serializableDraftSave.selectedSpaceIds)
      ? [...serializableDraftSave.selectedSpaceIds]
      : [],
    recommendationRoom: serializableDraftSave.recommendationRoom ?? null,
    wishlistCount: 0,
    cartCount: 0,
    layoutItemCount: serializableDraftSave.layoutItemCount ?? 0,
  }
}

function buildSerializableRecommendationDraft(recommendationDraft = null, recommendationRoom = null) {
  if (!recommendationDraft || typeof recommendationDraft !== 'object' || Array.isArray(recommendationDraft)) {
    return null
  }

  const room = typeof recommendationDraft?.room === 'string' && recommendationDraft.room.trim()
    ? recommendationDraft.room.trim()
    : (typeof recommendationRoom === 'string' && recommendationRoom.trim() ? recommendationRoom.trim() : null)
  const style = typeof recommendationDraft?.style === 'string' && recommendationDraft.style.trim() ? recommendationDraft.style.trim() : null
  const priority = typeof recommendationDraft?.priority === 'string' && recommendationDraft.priority.trim() ? recommendationDraft.priority.trim() : null
  const lifestyle = Array.isArray(recommendationDraft?.lifestyle)
    ? recommendationDraft.lifestyle.filter((value, index, array) => typeof value === 'string' && value.trim() && array.indexOf(value) === index)
    : []
  const extraRequest = typeof recommendationDraft?.extraRequest === 'string' ? recommendationDraft.extraRequest.trim() : ''

  if (!room && !style && !priority && !lifestyle.length && !extraRequest) return null

  return {
    room,
    style,
    priority,
    lifestyle,
    extraRequest,
  }
}

function buildSerializableDraftSave(draftSave = null) {
  if (!draftSave || typeof draftSave !== 'object' || Array.isArray(draftSave)) return null

  const selectedSpaceIds = Array.isArray(draftSave.selectedSpaceIds)
    ? draftSave.selectedSpaceIds.filter((value, index, array) => typeof value === 'string' && value.trim() && array.indexOf(value) === index)
    : []
  const layoutItems = Array.isArray(draftSave.layoutItems)
    ? draftSave.layoutItems.map((item) => ({ ...item }))
    : []
  const layoutTrayItems = Array.isArray(draftSave.layoutTrayItems)
    ? draftSave.layoutTrayItems.map((item) => ({ ...item }))
    : []
  const recommendationDraft = buildSerializableRecommendationDraft(draftSave.recommendationDraft, draftSave.recommendationRoom)
  const apartmentSelectionId = typeof draftSave.apartmentSelectionId === 'string' && draftSave.apartmentSelectionId.trim()
    ? draftSave.apartmentSelectionId.trim()
    : null

  const recommendationRoom = typeof draftSave.recommendationRoom === 'string' && draftSave.recommendationRoom.trim()
    ? draftSave.recommendationRoom.trim()
    : (recommendationDraft?.room ?? null)

  if (!selectedSpaceIds.length && !layoutItems.length && !layoutTrayItems.length && !draftSave.draftLabel && !draftSave.apartmentLabel && !apartmentSelectionId && !recommendationRoom) {
    return null
  }

  return {
    draftLabel: typeof draftSave.draftLabel === 'string' ? draftSave.draftLabel.trim() || null : null,
    apartmentLabel: typeof draftSave.apartmentLabel === 'string' ? draftSave.apartmentLabel.trim() || null : null,
    ...(apartmentSelectionId ? { apartmentSelectionId } : {}),
    recommendationRoom,
    ...(recommendationDraft ? { recommendationDraft } : {}),
    selectedSpaceIds,
    layoutItems,
    ...(Array.isArray(draftSave.layoutTrayItems) ? { layoutTrayItems } : {}),
    layoutItemCount: typeof draftSave.layoutItemCount === 'number' ? draftSave.layoutItemCount : layoutItems.length,
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
  const layoutTrayItems = Array.isArray(accountState.layoutTrayItems)
    ? accountState.layoutTrayItems.map((item) => ({ ...item }))
    : []
  const apartmentSelectionId = typeof accountState.apartmentSelectionId === 'string' && accountState.apartmentSelectionId.trim()
    ? accountState.apartmentSelectionId.trim()
    : null
  const draftLabel = typeof accountState.draftLabel === 'string' && accountState.draftLabel.trim()
    ? accountState.draftLabel.trim()
    : null
  const apartmentLabel = typeof accountState.apartmentLabel === 'string' && accountState.apartmentLabel.trim()
    ? accountState.apartmentLabel.trim()
    : null
  const selectedSpaceIds = Array.isArray(accountState.selectedSpaceIds)
    ? accountState.selectedSpaceIds.filter((value, index, array) => typeof value === 'string' && value.trim() && array.indexOf(value) === index)
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
  const layoutBoardSavedAt = typeof accountState.layoutBoardSavedAt === 'string' && accountState.layoutBoardSavedAt.trim()
    ? accountState.layoutBoardSavedAt.trim()
    : null

  if (!wishlistIds.length && !cartItems.length && !layoutItems.length && !layoutTrayItems.length && !apartmentSelectionId && !draftLabel && !apartmentLabel && !selectedSpaceIds.length && !layoutBoardSavedAt && !recommendationDraft) return null

  return {
    wishlistIds,
    cartItems,
    layoutItems,
    ...(Array.isArray(accountState.layoutTrayItems) ? { layoutTrayItems } : {}),
    ...(apartmentSelectionId ? { apartmentSelectionId } : {}),
    ...(draftLabel ? { draftLabel } : {}),
    ...(apartmentLabel ? { apartmentLabel } : {}),
    ...(selectedSpaceIds.length ? { selectedSpaceIds } : {}),
    ...(layoutBoardSavedAt ? { layoutBoardSavedAt } : {}),
    recommendationDraft,
  }
}

export function buildPersistedAuthSession(resultSummary, { guestDraftSnapshot = null, savedAt = new Date().toISOString(), intent = null, connection = null, actionConnection = null, continuation = null, continuationFields = null, draftSave = null, accountState = null } = {}) {
  const persistedDraftSave = buildSerializableDraftSave(draftSave ?? resultSummary?.draftSave ?? null)
  const derivedGuestDraftSummary = guestDraftSnapshot
    ? buildGuestDraftSessionSummary(guestDraftSnapshot)
    : (resultSummary?.guestDraftSummary ?? buildGuestDraftSummaryFromDraftSave(persistedDraftSave) ?? null)

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
    actionConnection: buildSerializableAuthConnection(actionConnection),
    continuation: buildSerializableAuthContinuation(continuation ?? resultSummary),
    continuationFields: buildSerializableAuthContinuationFields(continuationFields ?? resultSummary?.continuationFields ?? null),
    guestDraftSummary: derivedGuestDraftSummary,
    draftSave: persistedDraftSave,
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
      ...(continuation
        ? {
            ...(continuation.resumeToken ? { resumeToken: continuation.resumeToken } : {}),
            ...(continuation.nextAction ? { nextAction: continuation.nextAction } : {}),
            ...(continuation.status ? { status: continuation.status } : {}),
            ...(continuation.statusLabel ? { statusLabel: continuation.statusLabel } : {}),
          }
        : {}),
      ...(allowedMergeResolutions !== undefined ? { allowedMergeResolutions } : {}),
    },
  }
}

export function buildAuthResumeState(handoff, session = null) {
  if (!handoff) return null

  return {
    mode: 'login',
    email: handoff.email ?? '',
    password: '',
    displayName: '',
    confirmPassword: '',
    agreeToTerms: false,
    handoffId: handoff.handoffId ?? handoff.summary?.handoffId ?? null,
    status: 'resume-ready',
    result: buildAuthResumeResult(handoff),
    resumedAt: new Date().toISOString(),
    handoff,
    session,
    mergeResolution: handoff.summary?.mergeResolution ?? null,
    intent: buildSerializableAuthIntent(handoff.summary?.intent ?? session?.intent ?? null),
    connection: buildSerializableAuthConnection(handoff.connection ?? session?.connection ?? null),
    actionConnection: buildSerializableAuthConnection(handoff.actionConnection ?? session?.actionConnection ?? null),
    continuation: buildSerializableAuthContinuation(handoff.continuation ?? session?.continuation ?? null),
    continuationFields: buildSerializableAuthContinuationFields(handoff.continuationFields ?? session?.continuationFields ?? null),
    draftSave: buildSerializableDraftSave(handoff.draftSave ?? session?.draftSave ?? null),
    accountState: buildSerializableAuthAccountState(session?.accountState ?? null),
  }
}

export function buildAuthReadyState(session = null, { intent = null } = {}) {
  if (!session?.accountLabel && !session?.sessionId) return null

  return {
    mode: 'login',
    email: session.accountLabel ?? '',
    password: '',
    displayName: '',
    confirmPassword: '',
    agreeToTerms: false,
    handoffId: session.handoffId ?? null,
    status: 'ready',
    result: null,
    resumedAt: session.savedAt ?? new Date().toISOString(),
    handoff: null,
    session,
    mergeResolution: null,
    intent: buildSerializableAuthIntent(intent ?? session.intent ?? null),
    connection: buildSerializableAuthConnection(session.connection ?? null),
    actionConnection: buildSerializableAuthConnection(session.actionConnection ?? null),
    continuation: buildSerializableAuthContinuation(session.continuation ?? null),
    continuationFields: buildSerializableAuthContinuationFields(session.continuationFields ?? null),
    draftSave: buildSerializableDraftSave(session.draftSave ?? null),
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
