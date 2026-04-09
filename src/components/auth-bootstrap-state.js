export function shouldPreservePersistedAuthSessionOnBootstrapFailure(result = null, persistedSession = null) {
  if (!persistedSession || typeof persistedSession !== 'object') return false

  const targetLabel = typeof persistedSession.connection?.targetLabel === 'string'
    ? persistedSession.connection.targetLabel.trim()
    : ''
  const authMode = typeof persistedSession.authMode === 'string' ? persistedSession.authMode.trim() : ''
  const isScaffoldSession = authMode === 'scaffold' || targetLabel === 'same-origin /api auth scaffold'

  if (!isScaffoldSession) return false

  const resultAuthMode = typeof result?.meta?.authMode === 'string' ? result.meta.authMode.trim() : ''
  const status = Number.isFinite(result?.status) ? result.status : 0

  return resultAuthMode === 'scaffold' || status === 0 || status === 401 || status >= 500
}
