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
export const AUTH_ACTION_CONNECTION_METHOD_HEADER = 'x-havenly-auth-action-connection-method'
export const AUTH_ACTION_CONNECTION_ENDPOINT_HEADER = 'x-havenly-auth-action-connection-endpoint'
export const AUTH_ACTION_CONNECTION_TARGET_HEADER = 'x-havenly-auth-action-connection-target'
export const AUTH_ACTION_CONNECTION_CREDENTIALS_HEADER = 'x-havenly-auth-action-connection-credentials'
export const AUTH_ACTION_CONNECTION_SOURCE_HEADER = 'x-havenly-auth-action-connection-source'

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

function normalizeSource() {
  return 'frontend-scaffold'
}

export function resolveAuthEndpoint(endpoint, { appBasePath } = {}) {
  if (/^https?:\/\//.test(endpoint)) return endpoint

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const normalizedAppBasePath = normalizeAppBasePath(appBasePath)

  if (normalizedAppBasePath && normalizedEndpoint.startsWith('/api/auth/')) {
    return `${normalizedAppBasePath}${normalizedEndpoint}`
  }

  return normalizedEndpoint
}

function buildAuthConnection({ method, endpoint, appBasePath, credentialsMode = 'include' } = {}) {
  return {
    method,
    endpoint,
    resolvedUrl: resolveAuthEndpoint(endpoint, { appBasePath }),
    targetLabel: 'same-origin /api auth scaffold',
    isExternal: false,
    isSameOriginScaffold: true,
    credentialsMode,
    source: normalizeSource(),
  }
}

function buildAuthActionConnection(options = {}) {
  return buildAuthConnection({
    method: 'POST',
    endpoint: '/api/auth/continue',
    ...options,
  })
}

function attachAuthConnections(data, { connection = null, actionConnection = null } = {}) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data

  return {
    ...data,
    ...(!data.connection && connection ? { connection } : {}),
    ...(!data.actionConnection && actionConnection ? { actionConnection } : {}),
  }
}

function buildScaffoldResult(data, { status = 200, connection = null, actionConnection = null } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    data: attachAuthConnections(data, { connection, actionConnection }),
    meta: {
      authMode: 'scaffold',
      authTransport: 'frontend-scaffold',
    },
  }
}

export async function submitAuthLoginPlan(plan, options = {}) {
  const connection = buildAuthConnection({
    method: plan?.method ?? 'POST',
    endpoint: plan?.endpoint ?? '/api/auth/login',
    appBasePath: options?.appBasePath,
    credentialsMode: options?.credentialsMode,
  })
  const actionConnection = buildAuthActionConnection(options)
  const response = submitAuthScaffoldRequest({
    request: plan?.request,
    connection,
    actionConnection,
  })

  return buildScaffoldResult(response.data, {
    status: response.status,
    connection,
    actionConnection,
  })
}

export async function submitAuthSignupPlan(plan, options = {}) {
  const connection = buildAuthConnection({
    method: plan?.method ?? 'POST',
    endpoint: plan?.endpoint ?? '/api/auth/signup',
    appBasePath: options?.appBasePath,
    credentialsMode: options?.credentialsMode,
  })
  const actionConnection = buildAuthActionConnection(options)
  const response = submitAuthScaffoldRequest({
    request: plan?.request,
    connection,
    actionConnection,
  })

  return buildScaffoldResult(response.data, {
    status: response.status,
    connection,
    actionConnection,
  })
}

export async function submitAuthContinuationPlan(plan, options = {}) {
  const connection = buildAuthConnection({
    method: plan?.method ?? 'POST',
    endpoint: plan?.endpoint ?? '/api/auth/continue',
    appBasePath: options?.appBasePath,
    credentialsMode: options?.credentialsMode,
  })
  const actionConnection = buildAuthActionConnection(options)
  const response = submitAuthScaffoldContinuation({
    request: plan?.request,
    connection,
    actionConnection,
  })

  return buildScaffoldResult(response.data, {
    status: response.status,
    connection,
    actionConnection,
  })
}

export async function readAuthSession({
  endpoint = '/api/auth/session',
  appBasePath,
  credentialsMode = 'include',
  connectionFallbackOverride = null,
} = {}) {
  const fallbackConnection = connectionFallbackOverride ?? buildAuthConnection({
    method: 'GET',
    endpoint,
    appBasePath,
    credentialsMode,
  })
  const fallbackActionConnection = buildAuthActionConnection({ appBasePath, credentialsMode })
  const response = readAuthScaffoldSession()

  return buildScaffoldResult(response.data, {
    status: response.status,
    connection: fallbackConnection,
    actionConnection: fallbackActionConnection,
  })
}

export async function readAuthPending({
  endpoint = '/api/auth/pending',
  appBasePath,
  credentialsMode = 'include',
  connectionFallbackOverride = null,
} = {}) {
  const fallbackConnection = connectionFallbackOverride ?? buildAuthConnection({
    method: 'GET',
    endpoint,
    appBasePath,
    credentialsMode,
  })
  const fallbackActionConnection = buildAuthActionConnection({ appBasePath, credentialsMode })
  const response = readAuthScaffoldPending()

  return buildScaffoldResult(response.data, {
    status: response.status,
    connection: fallbackConnection,
    actionConnection: fallbackActionConnection,
  })
}

export async function signOutAuthSession({
  endpoint = '/api/auth/logout',
  appBasePath,
  credentialsMode = 'include',
} = {}) {
  const connection = buildAuthConnection({
    method: 'POST',
    endpoint,
    appBasePath,
    credentialsMode,
  })
  const actionConnection = buildAuthActionConnection({ appBasePath, credentialsMode })
  const response = signOutAuthScaffoldSession()

  return buildScaffoldResult(response.data, {
    status: response.status,
    connection,
    actionConnection,
  })
}
