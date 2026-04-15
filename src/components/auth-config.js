function trimTrailingSlash(value = '') {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function readString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function readCredentialMode(value) {
  return value === 'include' || value === 'same-origin' || value === 'omit'
    ? value
    : ''
}

function readEndpoint(value, fallback = '/api/auth/login') {
  const normalized = readString(value)
  if (!normalized) return fallback
  if (/^https?:\/\//.test(normalized)) return normalized
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

function resolveAuthConfigSource({
  runtimeApiBaseUrl,
  queryApiBaseUrl,
  explicitEnvApiBaseUrl,
  fallbackEnvApiBaseUrl,
  runtimeOverrides = [],
  queryOverrides = [],
  envOverrides = [],
} = {}) {
  if (runtimeApiBaseUrl || runtimeOverrides.some(Boolean)) return 'runtime'
  if (queryApiBaseUrl || queryOverrides.some(Boolean)) return 'query'
  if (explicitEnvApiBaseUrl) return 'env:VITE_AUTH_API_BASE_URL'
  if (fallbackEnvApiBaseUrl) return 'env:VITE_API_BASE_URL'
  if (envOverrides.some(Boolean)) return 'env:auth-endpoint'
  return 'default'
}

function resolveAuthConfigConfigured(source = 'default') {
  return source !== 'default'
}

function readLoopbackProbeBlockedReason(value) {
  const normalized = readString(value)
  return normalized || ''
}

function resolveCurrentOrigin(locationOrigin = globalThis?.location?.origin ?? '') {
  return readString(locationOrigin)
}

function isLoopbackOrigin(currentOrigin = '') {
  try {
    const origin = new URL(currentOrigin)
    return ['127.0.0.1', 'localhost'].includes(origin.hostname)
  } catch {
    return false
  }
}

export function shouldProbeLocalPagesAuthConfig({
  currentOrigin = '',
  appBasePath = '/',
  source = 'default',
} = {}) {
  if (source !== 'default') return false
  if (!appBasePath || appBasePath === '/') return false

  try {
    const origin = new URL(currentOrigin)
    return origin.host === 'neujeans.github.io' || origin.host.endsWith('.github.io')
  } catch {
    return false
  }
}

export async function detectLocalPagesAuthConfig({
  currentOrigin = globalThis?.location?.origin ?? '',
  appBasePath = '/',
  source = 'default',
  allowLoopbackProbe = false,
  fetchImpl = globalThis?.fetch,
  candidates = [
    'http://127.0.0.1:4175',
    'http://localhost:4175',
  ],
} = {}) {
  if (!shouldProbeLocalPagesAuthConfig({ currentOrigin, appBasePath, source })) return null
  if (typeof fetchImpl !== 'function') return null

  for (const candidate of candidates) {
    const apiBaseUrl = trimTrailingSlash(candidate)
    if (!apiBaseUrl) continue

    try {
      const response = await fetchImpl(`${apiBaseUrl}/api/auth/health`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          accept: 'application/json',
        },
      })
      if (!response.ok) continue

      const payload = await response.json().catch(() => null)
      if (!payload?.ok || payload?.storage !== 'sqlite') continue

      return {
        apiBaseUrl,
        appBasePath,
        loginEndpoint: '/api/auth/login',
        signupEndpoint: '/api/auth/signup',
        sessionEndpoint: '/api/auth/session',
        pendingEndpoint: '/api/auth/pending',
        continueEndpoint: '/api/auth/continue',
        logoutEndpoint: '/api/auth/logout',
        credentialsMode: 'include',
        currentOrigin: resolveCurrentOrigin(currentOrigin),
        source: 'runtime',
        isConfigured: true,
      }
    } catch {
      // try the next loopback candidate
    }
  }

  return null
}

export function resolveAuthConfig({
  env = {},
  runtimeConfig = globalThis?.__HAVENLY_AUTH_CONFIG__,
  locationSearch = globalThis?.location?.search ?? '',
  locationOrigin = globalThis?.location?.origin ?? '',
} = {}) {
  const currentOrigin = resolveCurrentOrigin(locationOrigin)
  const params = new URLSearchParams(locationSearch)
  const queryApiBaseUrl = readString(params.get('authApiBaseUrl'))
  const runtimeApiBaseUrl = readString(runtimeConfig?.apiBaseUrl)
  const explicitEnvApiBaseUrl = readString(env?.VITE_AUTH_API_BASE_URL)
  const fallbackEnvApiBaseUrl = readString(env?.VITE_API_BASE_URL)
  const queryLoginEndpoint = readString(params.get('authLoginEndpoint'))
  const runtimeLoginEndpoint = readString(runtimeConfig?.loginEndpoint)
  const envLoginEndpoint = readString(env?.VITE_AUTH_LOGIN_ENDPOINT)
  const querySignupEndpoint = readString(params.get('authSignupEndpoint'))
  const runtimeSignupEndpoint = readString(runtimeConfig?.signupEndpoint)
  const envSignupEndpoint = readString(env?.VITE_AUTH_SIGNUP_ENDPOINT)
  const querySessionEndpoint = readString(params.get('authSessionEndpoint'))
  const runtimeSessionEndpoint = readString(runtimeConfig?.sessionEndpoint)
  const envSessionEndpoint = readString(env?.VITE_AUTH_SESSION_ENDPOINT)
  const queryPendingEndpoint = readString(params.get('authPendingEndpoint'))
  const runtimePendingEndpoint = readString(runtimeConfig?.pendingEndpoint)
  const envPendingEndpoint = readString(env?.VITE_AUTH_PENDING_ENDPOINT)
  const queryContinueEndpoint = readString(params.get('authContinueEndpoint'))
  const runtimeContinueEndpoint = readString(runtimeConfig?.continueEndpoint)
  const envContinueEndpoint = readString(env?.VITE_AUTH_CONTINUE_ENDPOINT)
  const queryLogoutEndpoint = readString(params.get('authLogoutEndpoint'))
  const runtimeLogoutEndpoint = readString(runtimeConfig?.logoutEndpoint)
  const envLogoutEndpoint = readString(env?.VITE_AUTH_LOGOUT_ENDPOINT)
  const queryCredentialMode = readCredentialMode(params.get('authCredentials'))
  const runtimeCredentialMode = readCredentialMode(runtimeConfig?.credentialsMode)
  const envCredentialMode = readCredentialMode(env?.VITE_AUTH_CREDENTIALS)
  const runtimeAppBasePath = readString(runtimeConfig?.appBasePath)
  const envAppBasePath = readString(env?.BASE_URL)
  const allowLoopbackProbe = runtimeConfig?.allowLoopbackProbe === true || params.get('authLoopbackProbe') === '1'
  const loopbackProbeBlockedReason = readLoopbackProbeBlockedReason(runtimeConfig?.loopbackProbeBlockedReason)
  const ignoreRuntimeApiBaseUrlForLoopback = !queryApiBaseUrl
    && isLoopbackOrigin(currentOrigin)
    && /^https?:\/\//.test(runtimeApiBaseUrl)
    && !isLoopbackOrigin(runtimeApiBaseUrl)
  const effectiveRuntimeApiBaseUrl = ignoreRuntimeApiBaseUrlForLoopback ? '' : runtimeApiBaseUrl

  const apiBaseUrl = trimTrailingSlash(
    effectiveRuntimeApiBaseUrl
      || queryApiBaseUrl
      || explicitEnvApiBaseUrl
      || fallbackEnvApiBaseUrl,
  )
  const source = resolveAuthConfigSource({
    runtimeApiBaseUrl: effectiveRuntimeApiBaseUrl,
    queryApiBaseUrl,
    explicitEnvApiBaseUrl,
    fallbackEnvApiBaseUrl,
    runtimeOverrides: [
      runtimeLoginEndpoint,
      runtimeSignupEndpoint,
      runtimeSessionEndpoint,
      runtimePendingEndpoint,
      runtimeContinueEndpoint,
      runtimeLogoutEndpoint,
      runtimeCredentialMode,
    ],
    queryOverrides: [
      queryLoginEndpoint,
      querySignupEndpoint,
      querySessionEndpoint,
      queryPendingEndpoint,
      queryContinueEndpoint,
      queryLogoutEndpoint,
      queryCredentialMode,
    ],
    envOverrides: [
      envLoginEndpoint,
      envSignupEndpoint,
      envSessionEndpoint,
      envPendingEndpoint,
      envContinueEndpoint,
      envLogoutEndpoint,
      envCredentialMode,
    ],
  })

  return {
    apiBaseUrl,
    currentOrigin,
    appBasePath: readEndpoint(runtimeAppBasePath || envAppBasePath || '/', '/'),
    loginEndpoint: readEndpoint(
      runtimeLoginEndpoint
        || queryLoginEndpoint
        || envLoginEndpoint,
    ),
    signupEndpoint: readEndpoint(
      runtimeSignupEndpoint
        || querySignupEndpoint
        || envSignupEndpoint,
      '/api/auth/signup',
    ),
    sessionEndpoint: readEndpoint(
      runtimeSessionEndpoint
        || querySessionEndpoint
        || envSessionEndpoint,
      '/api/auth/session',
    ),
    pendingEndpoint: readEndpoint(
      runtimePendingEndpoint
        || queryPendingEndpoint
        || envPendingEndpoint,
      '/api/auth/pending',
    ),
    continueEndpoint: readEndpoint(
      runtimeContinueEndpoint
        || queryContinueEndpoint
        || envContinueEndpoint,
      '/api/auth/continue',
    ),
    logoutEndpoint: readEndpoint(
      runtimeLogoutEndpoint
        || queryLogoutEndpoint
        || envLogoutEndpoint,
      '/api/auth/logout',
    ),
    credentialsMode: runtimeCredentialMode
      || queryCredentialMode
      || envCredentialMode
      || 'include',
    allowLoopbackProbe,
    loopbackProbeBlockedReason,
    source,
    isConfigured: resolveAuthConfigConfigured(source, { allowLoopbackProbe }),
  }
}
