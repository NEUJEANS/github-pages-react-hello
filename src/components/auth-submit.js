import { buildAuthScaffoldResponse } from './auth-backend-scaffold.js'

export const AUTH_SCAFFOLD_HEADER = 'x-havenly-auth-scaffold'
export const AUTH_HANDOFF_HEADER = 'x-havenly-auth-handoff-id'

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

export async function submitAuthLoginPlan(plan, { fetchImpl = fetch, apiBaseUrl, credentialsMode = 'include' } = {}) {
  const endpoint = resolveAuthEndpoint(plan.endpoint, { apiBaseUrl })
  const requestInit = {
    method: plan.method,
    credentials: credentialsMode,
    headers: {
      'content-type': 'application/json',
      ...(plan.handoffId ? { [AUTH_HANDOFF_HEADER]: plan.handoffId } : {}),
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
      data: data
        ? { ...data, handoffId: data.handoffId ?? plan.handoffId ?? null }
        : data,
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
      data,
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
