import { resolveAuthEndpoint } from './auth-submit.js'

function buildWiringTarget(endpoint, config = {}) {
  if (typeof endpoint !== 'string' || !endpoint.trim()) return null

  const resolvedUrl = resolveAuthEndpoint(endpoint, config)
  const isAbsolute = /^https?:\/\//.test(resolvedUrl)

  return {
    endpoint,
    resolvedUrl,
    mode: isAbsolute ? 'remote' : 'same-origin',
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
    .map(([id, endpoint]) => [id, buildWiringTarget(endpoint, config)])
    .filter(([, value]) => value)

  if (!targets.length) return null

  return {
    source: config.source ?? 'default',
    credentialsMode: config.credentialsMode ?? 'include',
    apiBaseUrl: config.apiBaseUrl || null,
    appBasePath: config.appBasePath || '/',
    isConfigured: Boolean(config.isConfigured),
    targets: Object.fromEntries(targets),
  }
}
