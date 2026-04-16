function trimTrailingSlash(value = '') {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function readString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function readEndpoint(value, fallback = '/api/auth/login') {
  const normalized = readString(value)
  if (!normalized) return fallback
  if (/^https?:\/\//.test(normalized)) return normalized
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

function resolveAppBasePath(env = {}) {
  const envBasePath = readString(env?.BASE_URL)
  return readEndpoint(trimTrailingSlash(envBasePath) || '/', '/')
}

export function shouldProbeLocalPagesAuthConfig() {
  return false
}

export async function detectLocalPagesAuthConfig() {
  return null
}

export function resolveAuthConfig({
  env = {},
} = {}) {
  return {
    appBasePath: resolveAppBasePath(env),
    loginEndpoint: '/api/auth/login',
    signupEndpoint: '/api/auth/signup',
    sessionEndpoint: '/api/auth/session',
    pendingEndpoint: '/api/auth/pending',
    continueEndpoint: '/api/auth/continue',
    logoutEndpoint: '/api/auth/logout',
    credentialsMode: 'include',
    source: 'frontend-scaffold',
    isConfigured: true,
  }
}
