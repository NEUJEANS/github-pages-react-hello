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

export function resolveAuthConfig({
  env = {},
  runtimeConfig = globalThis?.__HAVENLY_AUTH_CONFIG__,
  locationSearch = globalThis?.location?.search ?? '',
} = {}) {
  const params = new URLSearchParams(locationSearch)
  const queryApiBaseUrl = readString(params.get('authApiBaseUrl'))
  const runtimeApiBaseUrl = readString(runtimeConfig?.apiBaseUrl)
  const explicitEnvApiBaseUrl = readString(env?.VITE_AUTH_API_BASE_URL)
  const fallbackEnvApiBaseUrl = readString(env?.VITE_API_BASE_URL)
  const queryLoginEndpoint = readString(params.get('authLoginEndpoint'))
  const runtimeLoginEndpoint = readString(runtimeConfig?.loginEndpoint)
  const envLoginEndpoint = readString(env?.VITE_AUTH_LOGIN_ENDPOINT)
  const queryCredentialMode = readCredentialMode(params.get('authCredentials'))
  const runtimeCredentialMode = readCredentialMode(runtimeConfig?.credentialsMode)
  const envCredentialMode = readCredentialMode(env?.VITE_AUTH_CREDENTIALS)

  const apiBaseUrl = trimTrailingSlash(
    runtimeApiBaseUrl
      || queryApiBaseUrl
      || explicitEnvApiBaseUrl
      || fallbackEnvApiBaseUrl,
  )

  return {
    apiBaseUrl,
    loginEndpoint: readEndpoint(
      runtimeLoginEndpoint
        || queryLoginEndpoint
        || envLoginEndpoint,
    ),
    credentialsMode: runtimeCredentialMode
      || queryCredentialMode
      || envCredentialMode
      || 'include',
    source: runtimeApiBaseUrl
      ? 'runtime'
      : queryApiBaseUrl
        ? 'query'
        : explicitEnvApiBaseUrl
          ? 'env:VITE_AUTH_API_BASE_URL'
          : fallbackEnvApiBaseUrl
            ? 'env:VITE_API_BASE_URL'
            : 'default',
    isConfigured: Boolean(apiBaseUrl),
  }
}
