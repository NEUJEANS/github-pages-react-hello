import { buildAuthScaffoldResponse } from './auth-backend-scaffold.js'

export const AUTH_SCAFFOLD_HEADER = 'x-havenly-auth-scaffold'
export const AUTH_HANDOFF_HEADER = 'x-havenly-auth-handoff-id'
export const AUTH_RESUME_TOKEN_HEADER = 'x-havenly-auth-resume-token'
export const AUTH_NEXT_ACTION_HEADER = 'x-havenly-auth-next-action'
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
  const contentType = response.headers?.get?.('content-type') ?? ''

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

function readAuthContinuation(data = {}, response = null) {
  const bodyResumeToken = typeof data?.resumeToken === 'string' ? data.resumeToken.trim() : ''
  const headerResumeToken = typeof response?.headers?.get === 'function'
    ? (response.headers.get(AUTH_RESUME_TOKEN_HEADER) ?? '').trim()
    : ''
  const bodyNextAction = typeof data?.nextAction === 'string' ? data.nextAction.trim() : ''
  const headerNextAction = typeof response?.headers?.get === 'function'
    ? (response.headers.get(AUTH_NEXT_ACTION_HEADER) ?? '').trim()
    : ''

  const resumeToken = bodyResumeToken || headerResumeToken || null
  const nextAction = bodyNextAction || headerNextAction || null

  if (!resumeToken && !nextAction) return null

  return {
    resumeToken,
    nextAction,
  }
}

function applyAuthContinuation(data, response) {
  const continuation = readAuthContinuation(data, response)
  if (!continuation) return data

  return {
    ...(data ?? {}),
    ...continuation,
  }
}

function buildResponseMeta(response) {
  if (response?.headers?.get?.(AUTH_SCAFFOLD_HEADER) === 'true') {
    return buildScaffoldMeta({ via: 'same-origin-middleware' })
  }

  return {
    authMode: 'remote',
    authTransport: 'network',
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

export async function submitAuthLoginPlan(plan, { fetchImpl = fetch, apiBaseUrl, credentialsMode = 'include', source = 'default' } = {}) {
  const endpoint = resolveAuthEndpoint(plan.endpoint, { apiBaseUrl })
  const targetLabel = /^https?:\/\//.test(endpoint)
    ? (() => {
        try {
          return new URL(endpoint).host
        } catch {
          return endpoint
        }
      })()
    : 'same-origin /api auth scaffold'
  const requestInit = {
    method: plan.method,
    credentials: credentialsMode,
    headers: {
      'content-type': 'application/json',
      ...(plan.handoffId ? { [AUTH_HANDOFF_HEADER]: plan.handoffId } : {}),
      [AUTH_CONNECTION_ENDPOINT_HEADER]: plan.endpoint,
      [AUTH_CONNECTION_TARGET_HEADER]: targetLabel,
      [AUTH_CONNECTION_CREDENTIALS_HEADER]: credentialsMode,
      [AUTH_CONNECTION_SOURCE_HEADER]: source,
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
      data: applyAuthContinuation(
        data
          ? { ...data, handoffId: data.handoffId ?? plan.handoffId ?? null }
          : data,
        response,
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
  credentialsMode = 'include',
} = {}) {
  const resolvedEndpoint = resolveAuthEndpoint(endpoint, { apiBaseUrl })

  try {
    const { response, data, meta } = await requestAuthJson(resolvedEndpoint, {
      method: 'GET',
      credentials: credentialsMode,
    }, { fetchImpl })

    return {
      ok: response.ok,
      status: response.status,
      data: applyAuthContinuation(data, response),
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

export async function signOutAuthSession({
  endpoint = '/api/auth/logout',
  fetchImpl = fetch,
  apiBaseUrl,
  credentialsMode = 'include',
} = {}) {
  const resolvedEndpoint = resolveAuthEndpoint(endpoint, { apiBaseUrl })

  try {
    const { response, data, meta } = await requestAuthJson(resolvedEndpoint, {
      method: 'POST',
      credentials: credentialsMode,
    }, { fetchImpl })

    return {
      ok: response.ok,
      status: response.status,
      data: applyAuthContinuation(data, response),
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
