import { resolveAuthEndpoint } from './auth-submit.js'

export function resolveVerificationEndpoints(authConfig = {}) {
  return {
    startEndpoint: resolveAuthEndpoint('/api/auth/verification/start', authConfig),
    statusEndpoint: resolveAuthEndpoint('/api/auth/verification/status', authConfig),
  }
}

export function resolveVerificationCallbackUrl(callbackUrl, authConfig = {}) {
  if (!callbackUrl) return null
  if (/^https?:\/\//.test(callbackUrl)) return callbackUrl

  try {
    const parsed = new URL(callbackUrl, 'http://localhost')
    const normalizedCallbackPath = `${parsed.pathname}${parsed.search}${parsed.hash}`
    return parsed.pathname.startsWith('/api/auth/')
      ? resolveAuthEndpoint(normalizedCallbackPath, authConfig)
      : normalizedCallbackPath
  } catch {
    return callbackUrl
  }
}

export async function startIdentityVerification({ authConfig, continuation, intent, fetchImpl = fetch }) {
  const { startEndpoint } = resolveVerificationEndpoints(authConfig)
  const response = await fetchImpl(startEndpoint, {
    method: 'POST',
    credentials: authConfig.credentialsMode ?? 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ continuation, intent }),
  })
  const data = await response.json().catch(() => null)
  return { ok: response.ok, status: response.status, data }
}

export async function readIdentityVerificationStatus({ authConfig, verificationId, fetchImpl = fetch }) {
  const { statusEndpoint } = resolveVerificationEndpoints(authConfig)
  const response = await fetchImpl(statusEndpoint, {
    method: 'POST',
    credentials: authConfig.credentialsMode ?? 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ verificationId }),
  })
  const data = await response.json().catch(() => null)
  return { ok: response.ok, status: response.status, data }
}

export function openIdentityVerificationWindow(callbackUrl, authConfig = {}) {
  const resolvedCallbackUrl = resolveVerificationCallbackUrl(callbackUrl, authConfig)
  if (!resolvedCallbackUrl) return null
  return globalThis.window?.open(resolvedCallbackUrl, 'havenly-identity-verification', 'popup=yes,width=460,height=720') ?? null
}
