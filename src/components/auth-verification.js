import { resolveAuthEndpoint } from './auth-submit.js'

export function resolveVerificationEndpoints(authConfig = {}) {
  return {
    startEndpoint: resolveAuthEndpoint('/api/auth/verification/start', authConfig),
    statusEndpoint: resolveAuthEndpoint('/api/auth/verification/status', authConfig),
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

export function openIdentityVerificationWindow(callbackUrl) {
  if (!callbackUrl) return null
  return globalThis.window?.open(callbackUrl, 'havenly-identity-verification', 'popup=yes,width=460,height=720') ?? null
}
