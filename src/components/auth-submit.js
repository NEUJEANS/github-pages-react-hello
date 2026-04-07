import { buildAuthScaffoldResponse } from './auth-backend-scaffold.js'

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

export function resolveAuthEndpoint(endpoint, { apiBaseUrl } = {}) {
  if (/^https?:\/\//.test(endpoint)) return endpoint

  const normalizedBase = trimTrailingSlash(apiBaseUrl?.trim?.() ?? '')
  if (!normalizedBase) return endpoint

  return `${normalizedBase}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

function shouldUseLocalAuthScaffold(plan, { apiBaseUrl } = {}) {
  const resolvedUrl = resolveAuthEndpoint(plan.endpoint, { apiBaseUrl })
  return !/^https?:\/\//.test(resolvedUrl) && plan.endpoint.startsWith('/api/auth/')
}

function buildScaffoldMeta({ via }) {
  return {
    authMode: 'scaffold',
    authTransport: via,
  }
}

function buildScaffoldLoginResult(plan, { via = 'local-fallback' } = {}) {
  const scaffoldResponse = buildAuthScaffoldResponse(plan.request)

  return {
    ok: scaffoldResponse.status >= 200 && scaffoldResponse.status < 300,
    status: scaffoldResponse.status,
    data: scaffoldResponse.data,
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

function readHeaderValue(response, headerName) {
  return typeof response?.headers?.get === 'function'
    ? (response.headers.get(headerName) ?? '').trim()
    : ''
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

function applyAuthResponseDecorators(data, response, { connectionFallback = null } = {}) {
  const continuation = readAuthContinuation(data, response)
  const connection = readAuthConnection(data, response, connectionFallback)

  if (!continuation && !connection) return data

  return {
    ...(data ?? {}),
    ...(continuation ?? {}),
    ...(connection ? { connection } : {}),
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
    if (canonicalOrigin && resolved.origin === canonicalOrigin && resolved.pathname.startsWith('/api/auth')) {
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

async function requestAuthJson(endpoint, requestInit, { fetchImpl = fetch } = {}) {
  const response = await fetchImpl(endpoint, requestInit)
  const data = await parseAuthResponse(response)

  return {
    response,
    data: data && typeof data === 'object' && !Array.isArray(data)
      ? data
      : null,
    meta: buildResponseMeta(response),
  }
}

export async function submitAuthLoginPlan(plan, { fetchImpl = fetch, apiBaseUrl, currentOrigin, credentialsMode = 'include', source = 'default' } = {}) {
  const endpoint = resolveAuthEndpoint(plan.endpoint, { apiBaseUrl })
  const { headers: connectionHeaders, connectionFallback } = buildAuthConnectionHeaders({
    method: plan.method,
    endpoint: plan.endpoint,
    resolvedEndpoint: endpoint,
    credentialsMode,
    source,
    currentOrigin,
  })
  const continuation = plan.request?.continuation && typeof plan.request.continuation === 'object'
    ? {
        resumeToken: typeof plan.request.continuation.resumeToken === 'string' ? plan.request.continuation.resumeToken.trim() : '',
        nextAction: typeof plan.request.continuation.nextAction === 'string' ? plan.request.continuation.nextAction.trim() : '',
      }
    : null
  const requestInit = {
    method: plan.method,
    credentials: credentialsMode,
    headers: {
      'content-type': 'application/json',
      ...(plan.handoffId ? { [AUTH_HANDOFF_HEADER]: plan.handoffId } : {}),
      ...(continuation?.resumeToken ? { [AUTH_RESUME_TOKEN_HEADER]: continuation.resumeToken } : {}),
      ...(continuation?.nextAction ? { [AUTH_NEXT_ACTION_HEADER]: continuation.nextAction } : {}),
      ...connectionHeaders,
    },
    body: JSON.stringify(plan.request),
  }

  try {
    const { response, data, meta } = await requestAuthJson(endpoint, requestInit, { fetchImpl })

    if (shouldUseLocalAuthScaffold(plan, { apiBaseUrl }) && [404, 405, 501].includes(response.status)) {
      return buildScaffoldLoginResult(plan)
    }

    return {
      ok: response.ok,
      status: response.status,
      data: applyAuthResponseDecorators(
        data
          ? { ...data, handoffId: data.handoffId ?? plan.handoffId ?? null }
          : data,
        response,
        {
          connectionFallback,
        },
      ),
      meta,
    }
  } catch {
    if (shouldUseLocalAuthScaffold(plan, { apiBaseUrl })) {
      return buildScaffoldLoginResult(plan)
    }

    throw new Error('Auth request failed')
  }
}

export async function readAuthSession({
  endpoint = '/api/auth/session',
  fetchImpl = fetch,
  apiBaseUrl,
  currentOrigin,
  credentialsMode = 'include',
  connectionFallbackOverride = null,
} = {}) {
  const resolvedEndpoint = resolveAuthEndpoint(endpoint, { apiBaseUrl })
  const source = apiBaseUrl ? 'env/runtime-configured' : 'default'
  const { headers: connectionHeaders, connectionFallback } = buildAuthConnectionHeaders({
    method: 'GET',
    endpoint,
    resolvedEndpoint,
    credentialsMode,
    source,
    currentOrigin,
  })

  try {
    const { response, data, meta } = await requestAuthJson(resolvedEndpoint, {
      method: 'GET',
      credentials: credentialsMode,
      headers: connectionHeaders,
    }, { fetchImpl })

    return {
      ok: response.ok,
      status: response.status,
      data: applyAuthResponseDecorators(data, response, {
        connectionFallback: connectionFallbackOverride ?? connectionFallback,
      }),
      meta,
    }
  } catch {
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
  currentOrigin,
  credentialsMode = 'include',
  connectionFallbackOverride = null,
} = {}) {
  const resolvedEndpoint = resolveAuthEndpoint(endpoint, { apiBaseUrl })
  const source = apiBaseUrl ? 'env/runtime-configured' : 'default'
  const { headers: connectionHeaders, connectionFallback } = buildAuthConnectionHeaders({
    method: 'GET',
    endpoint,
    resolvedEndpoint,
    credentialsMode,
    source,
    currentOrigin,
  })

  try {
    const { response, data, meta } = await requestAuthJson(resolvedEndpoint, {
      method: 'GET',
      credentials: credentialsMode,
      headers: connectionHeaders,
    }, { fetchImpl })

    return {
      ok: response.ok,
      status: response.status,
      data: applyAuthResponseDecorators(data, response, {
        connectionFallback: connectionFallbackOverride ?? connectionFallback,
      }),
      meta,
    }
  } catch {
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
  currentOrigin,
  credentialsMode = 'include',
} = {}) {
  const resolvedEndpoint = resolveAuthEndpoint(endpoint, { apiBaseUrl })
  const source = apiBaseUrl ? 'env/runtime-configured' : 'default'
  const { headers: connectionHeaders, connectionFallback } = buildAuthConnectionHeaders({
    method: 'POST',
    endpoint,
    resolvedEndpoint,
    credentialsMode,
    source,
    currentOrigin,
  })

  try {
    const { response, data, meta } = await requestAuthJson(resolvedEndpoint, {
      method: 'POST',
      credentials: credentialsMode,
      headers: connectionHeaders,
    }, { fetchImpl })

    return {
      ok: response.ok,
      status: response.status,
      data: applyAuthResponseDecorators(data, response, {
        connectionFallback,
      }),
      meta,
    }
  } catch {
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
