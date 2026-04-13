import { resolveAuthEndpoint } from './auth-submit.js'

export async function trackLayoutComponentEvent({ authConfig, eventType, item = null, fetchImpl = fetch }) {
  const endpoint = resolveAuthEndpoint('/api/auth/layout/track', authConfig)

  try {
    await fetchImpl(endpoint, {
      method: 'POST',
      credentials: authConfig.credentialsMode ?? 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        eventType,
        item: item ? {
          id: item.id ?? null,
          sourceId: item.sourceId ?? item.id ?? null,
          name: item.name ?? null,
        } : null,
      }),
    })
  } catch {
    // best-effort analytics only
  }
}
