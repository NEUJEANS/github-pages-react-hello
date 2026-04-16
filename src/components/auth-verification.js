import { completeAuthScaffoldVerification } from './auth-backend-scaffold.js'
import { resolveAuthEndpoint } from './auth-submit.js'

const AUTH_VERIFICATION_STORE_KEY = 'havenly.auth.verification.mock'
const AUTO_COMPLETE_DELAY_MS = 900

function cloneValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

function readVerificationStorage() {
  return globalThis.sessionStorage ?? globalThis.localStorage ?? null
}

function readVerificationDb() {
  const storage = readVerificationStorage()
  if (!storage?.getItem) return {}

  try {
    const raw = storage.getItem(AUTH_VERIFICATION_STORE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeVerificationDb(db = {}) {
  const storage = readVerificationStorage()
  if (!storage?.setItem) return

  try {
    storage.setItem(AUTH_VERIFICATION_STORE_KEY, JSON.stringify(db))
  } catch {}
}

function persistVerificationRecord(verificationId, record = null) {
  if (!verificationId) return null
  const db = readVerificationDb()

  if (!record) {
    delete db[verificationId]
    writeVerificationDb(db)
    return null
  }

  db[verificationId] = cloneValue(record)
  writeVerificationDb(db)
  return cloneValue(db[verificationId])
}

function readVerificationRecord(verificationId) {
  if (!verificationId) return null
  const db = readVerificationDb()
  return db[verificationId] ? cloneValue(db[verificationId]) : null
}

function announceVerificationComplete(verificationId) {
  try {
    globalThis.window?.dispatchEvent?.(new MessageEvent('message', {
      data: {
        type: 'havenly-verification-complete',
        verificationId,
      },
    }))
  } catch {
    // no-op: polling is still the primary completion path
  }
}

function scheduleFrontendVerificationCompletion(verificationId) {
  globalThis.setTimeout?.(() => {
    const current = readVerificationRecord(verificationId)
    if (!current || current.status === 'verified') return

    completeAuthScaffoldVerification()
    persistVerificationRecord(verificationId, {
      ...current,
      status: 'verified',
      verifiedAt: new Date().toISOString(),
    })
    announceVerificationComplete(verificationId)
  }, AUTO_COMPLETE_DELAY_MS)
}

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

export async function startIdentityVerification({ authConfig, continuation, intent } = {}) {
  const verificationId = `verify_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  const callbackUrl = resolveVerificationCallbackUrl('/verification/mock', authConfig)

  persistVerificationRecord(verificationId, {
    verificationId,
    status: 'pending',
    startedAt: new Date().toISOString(),
    continuation: cloneValue(continuation ?? null),
    intent: cloneValue(intent ?? null),
    callbackUrl,
  })
  scheduleFrontendVerificationCompletion(verificationId)

  return {
    ok: true,
    status: 200,
    data: {
      verificationId,
      callbackUrl,
    },
  }
}

export async function readIdentityVerificationStatus({ verificationId } = {}) {
  const record = readVerificationRecord(verificationId)
  if (!record) {
    return {
      ok: false,
      status: 404,
      data: { message: 'Verification not found' },
    }
  }

  return {
    ok: true,
    status: 200,
    data: {
      verificationId,
      status: record.status ?? 'pending',
      verifiedAt: record.verifiedAt ?? null,
    },
  }
}

export function openIdentityVerificationWindow(callbackUrl, authConfig = {}) {
  return {
    closed: false,
    mock: true,
    url: resolveVerificationCallbackUrl(callbackUrl, authConfig),
  }
}
