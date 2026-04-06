function trimTrailingSlash(value = '') {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function readString(value) {
  return typeof value === 'string' ? value.trim() : ''
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

  const apiBaseUrl = trimTrailingSlash(
    runtimeApiBaseUrl
      || queryApiBaseUrl
      || explicitEnvApiBaseUrl
      || fallbackEnvApiBaseUrl,
  )

  return {
    apiBaseUrl,
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
