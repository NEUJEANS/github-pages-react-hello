import { resolveAuthEndpoint } from './auth-submit.js'

export const AUTH_HANDOFF_STORAGE_KEY = 'havenly.auth.handoff'
export const AUTH_SESSION_STORAGE_KEY = 'havenly.auth.session'

function safeHostLabel(url) {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

export function buildAuthConnectionSummary(plan, { apiBaseUrl } = {}) {
  const resolvedUrl = resolveAuthEndpoint(plan.endpoint, { apiBaseUrl })
  const hostLabel = safeHostLabel(resolvedUrl)

  return {
    method: plan.method,
    endpoint: plan.endpoint,
    resolvedUrl,
    targetLabel: hostLabel ?? 'same-origin /api auth scaffold',
    isExternal: Boolean(hostLabel),
  }
}

export function buildPersistedAuthHandoff(plan, guestDraftSnapshot, { submittedAt = new Date().toISOString() } = {}) {
  return {
    submittedAt,
    endpoint: plan.endpoint,
    method: plan.method,
    email: plan.summary.email,
    summary: { ...plan.summary },
    guestDraftSnapshot,
  }
}

export function buildPersistedAuthSession(resultSummary, { savedAt = new Date().toISOString() } = {}) {
  return {
    savedAt,
    sessionId: resultSummary?.sessionId ?? null,
    accountLabel: resultSummary?.accountLabel ?? null,
    mergedDraftCount: resultSummary?.mergedDraftCount ?? 0,
    wishlistCount: resultSummary?.wishlistCount ?? 0,
    cartCount: resultSummary?.cartCount ?? 0,
    layoutItemCount: resultSummary?.layoutItemCount ?? 0,
    hasRecommendationDraft: Boolean(resultSummary?.hasRecommendationDraft),
  }
}

function safeSetItem(storage, key, value) {
  if (!storage?.setItem) return false

  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function safeGetItem(storage, key) {
  if (!storage?.getItem) return null

  try {
    const value = storage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export function persistAuthHandoff(storage, handoff) {
  return safeSetItem(storage, AUTH_HANDOFF_STORAGE_KEY, handoff)
}

export function readPersistedAuthHandoff(storage) {
  return safeGetItem(storage, AUTH_HANDOFF_STORAGE_KEY)
}

export function persistAuthSession(storage, session) {
  return safeSetItem(storage, AUTH_SESSION_STORAGE_KEY, session)
}

export function readPersistedAuthSession(storage) {
  return safeGetItem(storage, AUTH_SESSION_STORAGE_KEY)
}
