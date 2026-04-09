import {
  readAuthScaffoldPending,
  readAuthScaffoldSession,
  signOutAuthScaffoldSession,
  submitAuthScaffoldContinuation,
  submitAuthScaffoldRequest,
} from './auth-backend-scaffold.js'

export const AUTH_SCAFFOLD_HEADER = 'x-havenly-auth-scaffold'
export const AUTH_HANDOFF_HEADER = 'x-havenly-auth-handoff-id'
export const AUTH_RESUME_TOKEN_HEADER = 'x-havenly-auth-resume-token'
export const AUTH_NEXT_ACTION_HEADER = 'x-havenly-auth-next-action'
export const AUTH_STATUS_HEADER = 'x-havenly-auth-status'
export const AUTH_STATUS_LABEL_HEADER = 'x-havenly-auth-status-label'
export const AUTH_CONNECTION_METHOD_HEADER = 'x-havenly-auth-connection-method'
export const AUTH_CONNECTION_ENDPOINT_HEADER = 'x-havenly-auth-connection-endpoint'
export const AUTH_CONNECTION_TARGET_HEADER = 'x-havenly-auth-connection-target'
export const AUTH_CONNECTION_CREDENTIALS_HEADER = 'x-havenly-auth-connection-credentials'
export const AUTH_CONNECTION_SOURCE_HEADER = 'x-havenly-auth-connection-source'

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

export function resolveAuthEndpoint(endpoint, { apiBaseUrl, appBasePath, currentOrigin } = {}) {
  if (/^https?:\/\//.test(endpoint)) return endpoint

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const normalizedBase = trimTrailingSlash(apiBaseUrl?.trim?.() ?? '')
  const normalizedAppBasePath = normalizeAppBasePath(appBasePath)
  const canonicalOrigin = readCurrentOrigin(currentOrigin)
  const shouldPrefixAppBasePath = Boolean(
    normalizedAppBasePath
    && normalizedEndpoint.startsWith('/api/auth/')
    && normalizedBase
    && canonicalOrigin
    && normalizedBase == canonicalOrigin
  )

  if (normalizedBase) {
    return shouldPrefixAppBasePath
      ? `${normalizedBase}${normalizedAppBasePath}${normalizedEndpoint}`
      : `${normalizedBase}${normalizedEndpoint}`
  }

  if (normalizedAppBasePath && normalizedEndpoint.startsWith('/api/auth/')) {
    return `${normalizedAppBasePath}${normalizedEndpoint}`
  }

  return endpoint
}

function isSameOriginAuthScaffoldPath(pathname = '') {
  return typeof pathname === 'string' && pathname.includes('/api/auth/')
}

function isSameOriginAuthScaffoldEndpoint(resolvedUrl, endpoint, { currentOrigin } = {}) {
  if (!endpoint?.startsWith('/api/auth/')) return false
  if (!/^https?:\/\//.test(resolvedUrl)) return true

  const origin = readCurrentOrigin(currentOrigin)
  if (!origin) return false

  try {
    const resolved = new URL(resolvedUrl)
    return resolved.origin === origin && isSameOriginAuthScaffoldPath(resolved.pathname)
  } catch {
    return false
  }
}

function shouldUseLocalAuthScaffold(plan, { apiBaseUrl, appBasePath, currentOrigin } = {}) {
  const resolvedUrl = resolveAuthEndpoint(plan.endpoint, { apiBaseUrl, appBasePath, currentOrigin })
  return isSameOriginAuthScaffoldEndpoint(resolvedUrl, plan.endpoint, { currentOrigin })
}

function buildScaffoldMeta({ via }) {
  return {
    authMode: 'scaffold',
    authTransport: via,
  }
}

function buildScaffoldLoginResult(plan, connectionFallback, { via = 'local-fallback' } = {}) {
  const scaffoldResponse = submitAuthScaffoldRequest({
    request: plan.request,
    connection: connectionFallback,
  })

  return {
    ok: scaffoldResponse.status >= 200 && scaffoldResponse.status < 300,
    status: scaffoldResponse.status,
    data: scaffoldResponse.data,
    meta: buildScaffoldMeta({ via }),
  }
}

function buildScaffoldReadResult(readResponse, { via = 'local-fallback' } = {}) {
  return {
    ok: readResponse.status >= 200 && readResponse.status < 300,
    status: readResponse.status,
    data: readResponse.data,
    meta: buildScaffoldMeta({ via }),
  }
}

async function parseAuthResponse(response) {
  const contentType = typeof response?.headers?.get === 'function'
    ? (response.headers.get('content-type') ?? '')
    : ''

  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  try {
    const text = await response.text()
    return text ? { message: text } : null
  } catch {
    return null
  }
}

function decodeHeaderValue(value = '') {
  if (!value) return ''

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function readHeaderValue(response, headerName) {
  const rawValue = typeof response?.headers?.get === 'function'
    ? (response.headers.get(headerName) ?? '').trim()
    : ''

  return decodeHeaderValue(rawValue)
}

function readAuthHandoffId(data = {}, response = null, fallbackHandoffId = null) {
  const bodyHandoffId = typeof data?.handoffId === 'string' ? data.handoffId.trim() : ''
  const headerHandoffId = readHeaderValue(response, AUTH_HANDOFF_HEADER)
  const fallback = typeof fallbackHandoffId === 'string' ? fallbackHandoffId.trim() : ''

  return bodyHandoffId || headerHandoffId || fallback || null
}

function readAuthContinuation(data = {}, response = null) {
  const bodyResumeToken = typeof data?.resumeToken === 'string' ? data.resumeToken.trim() : ''
  const headerResumeToken = readHeaderValue(response, AUTH_RESUME_TOKEN_HEADER)
  const bodyNextAction = typeof data?.nextAction === 'string' ? data.nextAction.trim() : ''
  const headerNextAction = readHeaderValue(response, AUTH_NEXT_ACTION_HEADER)
  const bodyStatus = typeof data?.status === 'string' ? data.status.trim() : ''
  const headerStatus = readHeaderValue(response, AUTH_STATUS_HEADER)
  const bodyStatusLabel = typeof data?.statusLabel === 'string' ? data.statusLabel.trim() : ''
  const headerStatusLabel = readHeaderValue(response, AUTH_STATUS_LABEL_HEADER)

  const resumeToken = bodyResumeToken || headerResumeToken || null
  const nextAction = bodyNextAction || headerNextAction || null
  const status = bodyStatus || headerStatus || null
  const statusLabel = bodyStatusLabel || headerStatusLabel || null

  if (!resumeToken && !nextAction && !status && !statusLabel) return null

  return {
    resumeToken,
    nextAction,
    ...(status ? { status } : {}),
    ...(statusLabel ? { statusLabel } : {}),
  }
}

function pickFirstText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return ''
}

function readAuthConnection(data = {}, response = null, fallback = null) {
  const bodyConnection = data?.connection ?? data?.authConnection ?? null
  const method = pickFirstText(bodyConnection?.method, readHeaderValue(response, AUTH_CONNECTION_METHOD_HEADER), fallback?.method)
  const endpoint = pickFirstText(bodyConnection?.endpoint, readHeaderValue(response, AUTH_CONNECTION_ENDPOINT_HEADER), fallback?.endpoint)
  const targetLabel = pickFirstText(bodyConnection?.targetLabel, readHeaderValue(response, AUTH_CONNECTION_TARGET_HEADER), fallback?.targetLabel)
  const credentialsMode = pickFirstText(bodyConnection?.credentialsMode, readHeaderValue(response, AUTH_CONNECTION_CREDENTIALS_HEADER), fallback?.credentialsMode)
  const source = pickFirstText(bodyConnection?.source, readHeaderValue(response, AUTH_CONNECTION_SOURCE_HEADER), fallback?.source)
  const headerResolvedUrl = endpoint && targetLabel && targetLabel !== 'same-origin /api auth scaffold'
    ? `https://${targetLabel}${endpoint}`
    : ''
  const resolvedUrl = typeof bodyConnection?.resolvedUrl === 'string' && bodyConnection.resolvedUrl.trim()
    ? bodyConnection.resolvedUrl.trim()
    : (headerResolvedUrl || (typeof fallback?.resolvedUrl === 'string' && fallback.resolvedUrl.trim()
      ? fallback.resolvedUrl.trim()
      : ''))

  if (!method && !endpoint && !targetLabel && !credentialsMode && !source && !resolvedUrl) return null

  const nextResolvedUrl = resolvedUrl || null
  const isSameOriginScaffold = bodyConnection?.isSameOriginScaffold ?? fallback?.isSameOriginScaffold ?? targetLabel === 'same-origin /api auth scaffold'
  const isExternal = bodyConnection?.isExternal ?? fallback?.isExternal ?? Boolean(targetLabel && targetLabel !== 'same-origin /api auth scaffold')

  return {
    method: method || null,
    endpoint: endpoint || null,
    resolvedUrl: nextResolvedUrl,
    targetLabel: targetLabel || null,
    isExternal,
    isSameOriginScaffold,
    credentialsMode: credentialsMode || null,
    source: source || null,
  }
}

function cloneJsonValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

function readSerializableContinuationFields(data = {}) {
  if (data?.continuationFields && typeof data.continuationFields === 'object' && !Array.isArray(data.continuationFields)) {
    return cloneJsonValue(data.continuationFields)
  }

  const requestFields = data?.request?.fields
  if (requestFields && typeof requestFields === 'object' && !Array.isArray(requestFields)) {
    return cloneJsonValue(requestFields)
  }

  return null
}

function readSerializableDraftSave(data = {}) {
  if (data?.draftSave && typeof data.draftSave === 'object' && !Array.isArray(data.draftSave)) {
    return cloneJsonValue(data.draftSave)
  }

  const requestDraftSave = data?.request?.draftSave
  if (requestDraftSave && typeof requestDraftSave === 'object' && !Array.isArray(requestDraftSave)) {
    return cloneJsonValue(requestDraftSave)
  }

  return null
}

function buildGuestDraftSummaryFromSnapshot(guestDraftSnapshot = null) {
  if (!guestDraftSnapshot || typeof guestDraftSnapshot !== 'object') return null

  const continuity = guestDraftSnapshot.continuity ?? {}
  const selectedRooms = Array.isArray(continuity.selectedRooms)
    ? [...continuity.selectedRooms]
    : []

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

function readGuestDraftSummary(data = {}) {
  if (data?.guestDraftSummary && typeof data.guestDraftSummary === 'object' && !Array.isArray(data.guestDraftSummary)) {
    return cloneJsonValue(data.guestDraftSummary)
  }

  const summary = data?.summary
  if (summary && typeof summary === 'object' && !Array.isArray(summary)) {
    const hasSummaryShape = summary.wishlistCount != null
      || summary.cartCount != null
      || summary.layoutItemCount != null
      || summary.selectedRoomCount != null
      || summary.recommendationRoom != null
      || summary.apartmentLabel != null
      || summary.selectedSpaceIds != null

    if (hasSummaryShape) {
      return {
        apartmentLabel: summary.apartmentLabel ?? null,
        selectedRoomCount: summary.selectedRoomCount ?? 0,
        selectedRooms: Array.isArray(summary.selectedRooms) ? [...summary.selectedRooms] : [],
        selectedSpaceIds: Array.isArray(summary.selectedSpaceIds) ? [...summary.selectedSpaceIds] : [],
        recommendationRoom: summary.recommendationRoom ?? null,
        wishlistCount: summary.wishlistCount ?? 0,
        cartCount: summary.cartCount ?? 0,
        layoutItemCount: summary.layoutItemCount ?? 0,
      }
    }
  }

  return buildGuestDraftSummaryFromSnapshot(data?.guestDraftSnapshot ?? data?.request?.guestDraftSnapshot ?? null)
}

function applyAuthResponseDecorators(data, response, { handoffIdFallback = null, connectionFallback = null } = {}) {
  const handoffId = readAuthHandoffId(data, response, handoffIdFallback)
  const continuation = readAuthContinuation(data, response)
  const connection = readAuthConnection(data, response, connectionFallback)
  const continuationFields = readSerializableContinuationFields(data)
  const draftSave = readSerializableDraftSave(data)
  const guestDraftSummary = readGuestDraftSummary(data)

  if (!handoffId && !continuation && !connection && !continuationFields && !draftSave && !guestDraftSummary) return data

  return {
    ...(data ?? {}),
    ...(handoffId ? { handoffId } : {}),
    ...(continuation ?? {}),
    ...(connection ? { connection } : {}),
    ...(continuationFields ? { continuationFields } : {}),
    ...(draftSave ? { draftSave } : {}),
    ...(guestDraftSummary ? { guestDraftSummary } : {}),
  }
}

function buildResponseMeta(response) {
  if (typeof response?.headers?.get === 'function' && response.headers.get(AUTH_SCAFFOLD_HEADER) === 'true') {
    return buildScaffoldMeta({ via: 'same-origin-middleware' })
  }

  return {
    authMode: 'remote',
    authTransport: 'network',
  }
}

function readCurrentOrigin(currentOrigin = '') {
  if (typeof currentOrigin === 'string' && currentOrigin.trim()) return currentOrigin.trim()
  if (typeof globalThis?.location?.origin === 'string' && globalThis.location.origin.trim()) return globalThis.location.origin.trim()
  return ''
}

function resolveAuthTargetLabel(endpoint, { currentOrigin } = {}) {
  if (!/^https?:\/\//.test(endpoint)) return 'same-origin /api auth scaffold'

  try {
    const resolved = new URL(endpoint)
    const canonicalOrigin = readCurrentOrigin(currentOrigin)
    if (canonicalOrigin && resolved.origin === canonicalOrigin && isSameOriginAuthScaffoldPath(resolved.pathname)) {
      return 'same-origin /api auth scaffold'
    }
    return resolved.host
  } catch {
    return endpoint
  }
}

function buildAuthConnectionHeaders({ method, endpoint, resolvedEndpoint, credentialsMode, source, currentOrigin }) {
  const targetLabel = resolveAuthTargetLabel(resolvedEndpoint, { currentOrigin })

  return {
    headers: {
      [AUTH_CONNECTION_METHOD_HEADER]: method,
      [AUTH_CONNECTION_ENDPOINT_HEADER]: endpoint,
      [AUTH_CONNECTION_TARGET_HEADER]: targetLabel,
      [AUTH_CONNECTION_CREDENTIALS_HEADER]: credentialsMode,
      [AUTH_CONNECTION_SOURCE_HEADER]: source,
    },
    connectionFallback: {
      method,
      endpoint,
      resolvedUrl: resolvedEndpoint,
      targetLabel,
      isExternal: targetLabel !== 'same-origin /api auth scaffold',
      isSameOriginScaffold: targetLabel === 'same-origin /api auth scaffold',
      credentialsMode,
      source,
    },
  }
}

function shouldTreatAsDocumentFallback(response) {
  const contentType = typeof response?.headers?.get === 'function'
    ? (response.headers.get('content-type') ?? '')
    : ''

  if (!response?.ok) return false
  return contentType.includes('text/html')
}

async function requestAuthJson(endpoint, requestInit, { fetchImpl = fetch } = {}) {
  const response = await fetchImpl(endpoint, requestInit)
  const data = await parseAuthResponse(response)

  return {
    response,
    data: data && typeof data === 'object' && !Array.isArray(data)
      ? data
      : null,
    treatAsDocumentFallback: shouldTreatAsDocumentFallback(response, data),
    meta: buildResponseMeta(response),
  }
}

function readRequestContinuation(continuation) {
  return continuation && typeof continuation === 'object'
    ? {
        resumeToken: typeof continuation.resumeToken === 'string' ? continuation.resumeToken.trim() : '',
        nextAction: typeof continuation.nextAction === 'string' ? continuation.nextAction.trim() : '',
      }
    : null
}

function buildAuthJsonRequestInit(plan, credentialsMode, connectionHeaders, connectionFallback = null) {
  const continuation = readRequestContinuation(plan.request?.continuation)
  const requestBody = {
    ...(plan.request ?? {}),
    ...(connectionFallback ? { connection: { ...connectionFallback } } : {}),
  }

  return {
    method: plan.method,
    credentials: credentialsMode,
    headers: {
      'content-type': 'application/json',
      ...(plan.handoffId ? { [AUTH_HANDOFF_HEADER]: plan.handoffId } : {}),
      ...(continuation?.resumeToken ? { [AUTH_RESUME_TOKEN_HEADER]: continuation.resumeToken } : {}),
      ...(continuation?.nextAction ? { [AUTH_NEXT_ACTION_HEADER]: continuation.nextAction } : {}),
      ...connectionHeaders,
    },
    body: JSON.stringify(requestBody),
  }
}

async function submitAuthAccessPlan(plan, { fetchImpl = fetch, apiBaseUrl, appBasePath, currentOrigin, credentialsMode = 'include', source = 'default' } = {}) {
  const endpoint = resolveAuthEndpoint(plan.endpoint, { apiBaseUrl, appBasePath, currentOrigin })
  const { headers: connectionHeaders, connectionFallback } = buildAuthConnectionHeaders({
    method: plan.method,
    endpoint: plan.endpoint,
    resolvedEndpoint: endpoint,
    credentialsMode,
    source,
    currentOrigin,
  })
  const requestInit = buildAuthJsonRequestInit(plan, credentialsMode, connectionHeaders, connectionFallback)

  try {
    const { response, data, treatAsDocumentFallback, meta } = await requestAuthJson(endpoint, requestInit, { fetchImpl })

    if (shouldUseLocalAuthScaffold(plan, { apiBaseUrl, appBasePath, currentOrigin }) && ([404, 405, 501].includes(response.status) || treatAsDocumentFallback)) {
      return buildScaffoldLoginResult(plan, connectionFallback)
    }

    return {
      ok: response.ok,
      status: response.status,
      data: applyAuthResponseDecorators(
        data,
        response,
        {
          handoffIdFallback: plan.handoffId ?? null,
          connectionFallback,
        },
      ),
      meta,
    }
  } catch {
    if (shouldUseLocalAuthScaffold(plan, { apiBaseUrl, appBasePath, currentOrigin })) {
      return buildScaffoldLoginResult(plan, connectionFallback)
    }

    throw new Error('Auth request failed')
  }
}

export async function submitAuthLoginPlan(plan, options = {}) {
  return submitAuthAccessPlan(plan, options)
}

export async function submitAuthSignupPlan(plan, options = {}) {
  return submitAuthAccessPlan(plan, options)
}

export async function submitAuthContinuationPlan(plan, { fetchImpl = fetch, apiBaseUrl, appBasePath, currentOrigin, credentialsMode = 'include', source = 'default' } = {}) {
  const endpoint = resolveAuthEndpoint(plan.endpoint, { apiBaseUrl, appBasePath, currentOrigin })
  const { headers: connectionHeaders, connectionFallback } = buildAuthConnectionHeaders({
    method: plan.method,
    endpoint: plan.endpoint,
    resolvedEndpoint: endpoint,
    credentialsMode,
    source,
    currentOrigin,
  })
  const requestInit = buildAuthJsonRequestInit(plan, credentialsMode, connectionHeaders, connectionFallback)

  const submitScaffoldContinuation = () => {
    const scaffoldResponse = submitAuthScaffoldContinuation({
      request: plan.request,
      connection: connectionFallback,
    })

    return {
      ok: scaffoldResponse.status >= 200 && scaffoldResponse.status < 300,
      status: scaffoldResponse.status,
      data: scaffoldResponse.data,
      meta: buildScaffoldMeta({ via: 'local-fallback' }),
    }
  }

  try {
    const { response, data, treatAsDocumentFallback, meta } = await requestAuthJson(endpoint, requestInit, { fetchImpl })

    if (shouldUseLocalAuthScaffold(plan, { apiBaseUrl, appBasePath, currentOrigin }) && ([404, 405, 501].includes(response.status) || treatAsDocumentFallback)) {
      return submitScaffoldContinuation()
    }

    return {
      ok: response.ok,
      status: response.status,
      data: applyAuthResponseDecorators(
        data,
        response,
        {
          handoffIdFallback: plan.handoffId ?? null,
          connectionFallback,
        },
      ),
      meta,
    }
  } catch {
    if (shouldUseLocalAuthScaffold(plan, { apiBaseUrl, appBasePath, currentOrigin })) {
      return submitScaffoldContinuation()
    }

    throw new Error('Auth continuation request failed')
  }
}

export async function readAuthSession({
  endpoint = '/api/auth/session',
  fetchImpl = fetch,
  apiBaseUrl,
  appBasePath,
  currentOrigin,
  credentialsMode = 'include',
  source = apiBaseUrl ? 'env/runtime-configured' : 'default',
  connectionFallbackOverride = null,
} = {}) {
  const resolvedEndpoint = resolveAuthEndpoint(endpoint, { apiBaseUrl, appBasePath, currentOrigin })
  const { headers: connectionHeaders, connectionFallback } = buildAuthConnectionHeaders({
    method: 'GET',
    endpoint,
    resolvedEndpoint,
    credentialsMode,
    source,
    currentOrigin,
  })

  try {
    const { response, data, treatAsDocumentFallback, meta } = await requestAuthJson(resolvedEndpoint, {
      method: 'GET',
      credentials: credentialsMode,
      headers: connectionHeaders,
    }, { fetchImpl })

    if (shouldUseLocalAuthScaffold({ endpoint }, { apiBaseUrl, appBasePath, currentOrigin }) && ([404, 405, 501].includes(response.status) || treatAsDocumentFallback)) {
      return buildScaffoldReadResult(readAuthScaffoldSession())
    }

    return {
      ok: response.ok,
      status: response.status,
      data: applyAuthResponseDecorators(data, response, {
        handoffIdFallback: connectionFallbackOverride?.handoffId ?? connectionFallback?.handoffId ?? null,
        connectionFallback: connectionFallbackOverride ?? connectionFallback,
      }),
      meta,
    }
  } catch {
    if (shouldUseLocalAuthScaffold({ endpoint }, { apiBaseUrl, appBasePath, currentOrigin })) {
      return buildScaffoldReadResult(readAuthScaffoldSession())
    }

    return {
      ok: false,
      status: 0,
      data: { message: 'Auth session request failed' },
      meta: {
        authMode: 'remote',
        authTransport: 'network',
      },
    }
  }
}

export async function readAuthPending({
  endpoint = '/api/auth/pending',
  fetchImpl = fetch,
  apiBaseUrl,
  appBasePath,
  currentOrigin,
  credentialsMode = 'include',
  source = apiBaseUrl ? 'env/runtime-configured' : 'default',
  connectionFallbackOverride = null,
} = {}) {
  const resolvedEndpoint = resolveAuthEndpoint(endpoint, { apiBaseUrl, appBasePath, currentOrigin })
  const { headers: connectionHeaders, connectionFallback } = buildAuthConnectionHeaders({
    method: 'GET',
    endpoint,
    resolvedEndpoint,
    credentialsMode,
    source,
    currentOrigin,
  })

  try {
    const { response, data, treatAsDocumentFallback, meta } = await requestAuthJson(resolvedEndpoint, {
      method: 'GET',
      credentials: credentialsMode,
      headers: connectionHeaders,
    }, { fetchImpl })

    if (shouldUseLocalAuthScaffold({ endpoint }, { apiBaseUrl, appBasePath, currentOrigin }) && ([404, 405, 501].includes(response.status) || treatAsDocumentFallback)) {
      return buildScaffoldReadResult(readAuthScaffoldPending())
    }

    return {
      ok: response.ok,
      status: response.status,
      data: applyAuthResponseDecorators(data, response, {
        handoffIdFallback: connectionFallbackOverride?.handoffId ?? connectionFallback?.handoffId ?? null,
        connectionFallback: connectionFallbackOverride ?? connectionFallback,
      }),
      meta,
    }
  } catch {
    if (shouldUseLocalAuthScaffold({ endpoint }, { apiBaseUrl, appBasePath, currentOrigin })) {
      return buildScaffoldReadResult(readAuthScaffoldPending())
    }

    return {
      ok: false,
      status: 0,
      data: { message: 'Auth pending request failed' },
      meta: {
        authMode: 'remote',
        authTransport: 'network',
      },
    }
  }
}

export async function signOutAuthSession({
  endpoint = '/api/auth/logout',
  fetchImpl = fetch,
  apiBaseUrl,
  appBasePath,
  currentOrigin,
  credentialsMode = 'include',
  source = apiBaseUrl ? 'env/runtime-configured' : 'default',
} = {}) {
  const resolvedEndpoint = resolveAuthEndpoint(endpoint, { apiBaseUrl, appBasePath, currentOrigin })
  const { headers: connectionHeaders, connectionFallback } = buildAuthConnectionHeaders({
    method: 'POST',
    endpoint,
    resolvedEndpoint,
    credentialsMode,
    source,
    currentOrigin,
  })

  try {
    const { response, data, treatAsDocumentFallback, meta } = await requestAuthJson(resolvedEndpoint, {
      method: 'POST',
      credentials: credentialsMode,
      headers: connectionHeaders,
    }, { fetchImpl })

    if (shouldUseLocalAuthScaffold({ endpoint }, { apiBaseUrl, appBasePath, currentOrigin }) && ([404, 405, 501].includes(response.status) || treatAsDocumentFallback)) {
      return buildScaffoldReadResult(signOutAuthScaffoldSession())
    }

    return {
      ok: response.ok,
      status: response.status,
      data: applyAuthResponseDecorators(data, response, {
        connectionFallback,
      }),
      meta,
    }
  } catch {
    if (shouldUseLocalAuthScaffold({ endpoint }, { apiBaseUrl, appBasePath, currentOrigin })) {
      return buildScaffoldReadResult(signOutAuthScaffoldSession())
    }

    return {
      ok: false,
      status: 0,
      data: { message: 'Auth logout request failed' },
      meta: {
        authMode: 'remote',
        authTransport: 'network',
      },
    }
  }
}
