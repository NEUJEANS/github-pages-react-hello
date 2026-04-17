import { resolveAuthEndpoint } from './auth-submit.js'

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

function buildTargetLabel(resolvedUrl, mode, { currentOrigin } = {}) {
  if (mode === 'same-origin') return 'same-origin /api auth scaffold'

  try {
    const resolved = new URL(resolvedUrl)
    const canonicalOrigin = typeof currentOrigin === 'string' ? currentOrigin.trim() : ''

    if (canonicalOrigin && resolved.origin === canonicalOrigin && resolved.pathname.includes('/api/auth/')) {
      return 'same-origin /api auth scaffold'
    }

    return resolved.host
  } catch {
    return resolvedUrl
  }
}

function buildWiringTarget(id, endpoint, config = {}) {
  if (typeof endpoint !== 'string' || !endpoint.trim()) return null

  const resolvedUrl = endpoint.startsWith('/')
    ? resolveCanonicalSameOriginAuthUrl(endpoint, config)
    : resolveAuthEndpoint(endpoint, config)
  const isAbsolute = /^https?:\/\//.test(resolvedUrl)
  const mode = endpoint.startsWith('/') ? 'same-origin' : (isAbsolute ? 'remote' : 'same-origin')
  const method = id === 'session' || id === 'pending' ? 'GET' : 'POST'
  const isContinuation = id === 'continue'
  const targetLabel = buildTargetLabel(resolvedUrl, mode, config)
  const isSameOriginScaffold = targetLabel === 'same-origin /api auth scaffold'

  return {
    endpoint,
    resolvedUrl,
    mode,
    method,
    targetLabel,
    isSameOriginScaffold,
    expectsSerializableHandoff: method === 'POST',
    carriesDraftSave: id === 'login' || id === 'signup' || id === 'continue',
    carriesGuestDraftSnapshot: id === 'login' || id === 'signup',
    carriesContinuation: id === 'login' || id === 'signup' || id === 'continue',
    isContinuation,
  }
}

export function buildAuthWiringState(config = null) {
  if (!config || typeof config !== 'object') return null

  const targets = [
    ['login', config.loginEndpoint],
    ['signup', config.signupEndpoint],
    ['session', config.sessionEndpoint],
    ['pending', config.pendingEndpoint],
    ['continue', config.continueEndpoint],
    ['logout', config.logoutEndpoint],
  ]
    .map(([id, endpoint]) => [id, buildWiringTarget(id, endpoint, config)])
    .filter(([, value]) => value)

  if (!targets.length) return null

  const targetsObject = Object.fromEntries(targets)

  return {
    source: config.source ?? 'default',
    credentialsMode: config.credentialsMode ?? 'include',
    apiBaseUrl: config.apiBaseUrl || null,
    appBasePath: config.appBasePath || '/',
    isConfigured: Boolean(config.isConfigured),
    targets: targetsObject,
    scaffoldStrategy: targetsObject.continue?.isSameOriginScaffold
      ? 'same-origin-continuation-scaffold'
      : targetsObject.login?.isSameOriginScaffold
        ? 'same-origin-login-scaffold'
        : 'remote-auth-service',
  }
}
