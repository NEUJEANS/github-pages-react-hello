const AUTH_RUNTIME_STORAGE_KEY = 'havenly.auth.runtimeConfig'

function trimTrailingSlash(value = '') {
  return typeof value === 'string' ? value.replace(/\/+$/, '') : ''
}

function readStoredRuntimeConfig(storage = globalThis?.localStorage) {
  const raw = storage?.getItem?.(AUTH_RUNTIME_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : null
  } catch {
    return null
  }
}

function readQueryRuntimeOverrides(locationSearch = globalThis?.location?.search ?? '') {
  const params = new URLSearchParams(locationSearch)
  const queryApiBaseUrl = params.get('authApiBaseUrl')?.trim() ?? ''
  const queryCredentialsMode = params.get('authCredentials')?.trim() ?? ''
  const queryLoopbackProbe = params.get('authLoopbackProbe') === '1'

  return {
    ...(queryApiBaseUrl ? { apiBaseUrl: trimTrailingSlash(queryApiBaseUrl) } : {}),
    ...(queryCredentialsMode ? { credentialsMode: queryCredentialsMode } : {}),
    ...(queryLoopbackProbe ? { allowLoopbackProbe: true } : {}),
  }
}

function buildRuntimeConfigScriptUrl(baseUrl = '/', currentOrigin = globalThis?.location?.origin ?? '', baseUri = globalThis?.document?.baseURI ?? currentOrigin) {
  try {
    return new URL('havenly-auth-config.js', new URL(baseUrl, baseUri)).toString()
  } catch {
    try {
      return new URL('havenly-auth-config.js', currentOrigin || baseUri).toString()
    } catch {
      return 'havenly-auth-config.js'
    }
  }
}

function loadRuntimeConfigScript(src) {
  return new Promise((resolve) => {
    const documentRef = globalThis?.document
    if (!documentRef?.createElement || !documentRef?.head?.appendChild) {
      resolve(false)
      return
    }

    const script = documentRef.createElement('script')
    script.src = src
    script.async = false
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    documentRef.head.appendChild(script)
  })
}

export async function loadAuthRuntimeConfig({
  baseUrl = '/',
  locationSearch = globalThis?.location?.search ?? '',
  storage = globalThis?.localStorage,
} = {}) {
  const existing = globalThis.__HAVENLY_AUTH_CONFIG__
  const runtimeConfigScriptUrl = buildRuntimeConfigScriptUrl(baseUrl)

  await loadRuntimeConfigScript(runtimeConfigScriptUrl)

  const fileConfig = globalThis.__HAVENLY_AUTH_CONFIG__
  const storedConfig = readStoredRuntimeConfig(storage)
  const queryOverrides = readQueryRuntimeOverrides(locationSearch)

  globalThis.__HAVENLY_AUTH_CONFIG__ = {
    ...(fileConfig && typeof fileConfig === 'object' ? fileConfig : {}),
    ...(storedConfig && typeof storedConfig === 'object' ? storedConfig : {}),
    ...(existing && typeof existing === 'object' ? existing : {}),
    ...queryOverrides,
  }

  return globalThis.__HAVENLY_AUTH_CONFIG__
}
