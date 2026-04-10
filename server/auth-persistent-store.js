import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const dataDir = path.resolve('.data')
const dataPath = path.join(dataDir, 'havenly-auth-store.json')
const sessionCookieName = 'havenly_auth_session'
const handoffCookieName = 'havenly_auth_handoff'

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(dataPath)) {
    const initial = {
      users: seedUsers(),
      sessions: {},
      pending: {},
    }
    fs.writeFileSync(dataPath, JSON.stringify(initial, null, 2))
    return initial
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
    return {
      users: parsed?.users && typeof parsed.users === 'object' ? parsed.users : seedUsers(),
      sessions: parsed?.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {},
      pending: parsed?.pending && typeof parsed.pending === 'object' ? parsed.pending : {},
    }
  } catch {
    const fallback = {
      users: seedUsers(),
      sessions: {},
      pending: {},
    }
    fs.writeFileSync(dataPath, JSON.stringify(fallback, null, 2))
    return fallback
  }
}

function saveStore(store) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(dataPath, JSON.stringify(store, null, 2))
}

function seedUsers() {
  return {
    'user@example.com': buildUser({ email: 'user@example.com', password: 'password123', name: 'user@example.com' }),
    'merge@example.com': buildUser({ email: 'merge@example.com', password: 'merge-conflict', name: 'merge@example.com' }),
    'board@example.com': buildUser({ email: 'board@example.com', password: 'password123', name: 'board@example.com' }),
    'profile@example.com': buildUser({ email: 'profile@example.com', password: 'password123', name: 'profile@example.com' }),
    'verify@example.com': buildUser({ email: 'verify@example.com', password: 'password123', name: 'verify@example.com' }),
  }
}

function buildUser({ email, password, name }) {
  return {
    email,
    password,
    name,
    createdAt: new Date().toISOString(),
    profile: null,
    verifiedAt: null,
    accountState: {
      wishlistIds: [],
      cartItems: [],
      layoutItems: [],
      recommendationDraft: null,
    },
  }
}

function normalizeEmail(email = '') {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

function readCookies(req) {
  const cookieHeader = req.headers.cookie ?? ''
  return Object.fromEntries(cookieHeader.split(';').map((entry) => entry.trim()).filter(Boolean).map((entry) => {
    const index = entry.indexOf('=')
    if (index === -1) return [entry, '']
    return [entry.slice(0, index), decodeURIComponent(entry.slice(index + 1))]
  }))
}

function serializeCookie(name, value, { maxAge = null } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax']
  if (maxAge != null) parts.push(`Max-Age=${maxAge}`)
  return parts.join('; ')
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`
}

function buildMergedGuestDraft(guestDraftSnapshot = null, { mode = 'merged', resolution = null } = {}) {
  const continuity = guestDraftSnapshot?.continuity ?? {}
  const layoutItems = Array.isArray(continuity.layoutItems) ? continuity.layoutItems : []
  const wishlistIds = Array.isArray(continuity.wishlistIds) ? continuity.wishlistIds : []
  const cartItems = Array.isArray(continuity.cartItems) ? continuity.cartItems : []

  return {
    mode,
    resolution,
    count: layoutItems.length,
    wishlistCount: wishlistIds.length,
    cartCount: cartItems.length,
    layoutItemCount: layoutItems.length,
    recommendationDraftRestored: Boolean(guestDraftSnapshot?.recommendationDraft),
  }
}

function buildGuestDraftSummary(guestDraftSnapshot = null) {
  if (!guestDraftSnapshot) return null
  const continuity = guestDraftSnapshot.continuity ?? {}
  const selectedRooms = Array.isArray(continuity.selectedRooms) ? [...continuity.selectedRooms] : []

  return {
    apartmentLabel: continuity.apartmentLabel ?? null,
    selectedRoomCount: selectedRooms.length,
    selectedRooms,
    selectedSpaceIds: Array.isArray(guestDraftSnapshot.spaceProfile?.spaces) ? [...guestDraftSnapshot.spaceProfile.spaces] : [],
    recommendationRoom: guestDraftSnapshot.recommendationDraft?.room ?? null,
    wishlistCount: Array.isArray(continuity.wishlistIds) ? continuity.wishlistIds.length : 0,
    cartCount: Array.isArray(continuity.cartItems) ? continuity.cartItems.length : 0,
    layoutItemCount: Array.isArray(continuity.layoutItems) ? continuity.layoutItems.length : 0,
  }
}

function buildDraftSaveState(request = {}, guestDraftSnapshot = null) {
  const requestDraftSave = request?.draftSave && typeof request.draftSave === 'object' && !Array.isArray(request.draftSave)
    ? request.draftSave
    : null
  const continuity = guestDraftSnapshot?.continuity ?? {}
  const layoutItems = Array.isArray(requestDraftSave?.layoutItems)
    ? requestDraftSave.layoutItems.map((item) => ({ ...item }))
    : (Array.isArray(continuity.layoutItems) ? continuity.layoutItems.map((item) => ({ ...item })) : [])
  const selectedSpaceIds = Array.isArray(requestDraftSave?.selectedSpaceIds)
    ? [...requestDraftSave.selectedSpaceIds]
    : (Array.isArray(guestDraftSnapshot?.spaceProfile?.spaces) ? [...guestDraftSnapshot.spaceProfile.spaces] : [])

  if (!requestDraftSave && !layoutItems.length && !selectedSpaceIds.length && !continuity.apartmentLabel && !guestDraftSnapshot?.recommendationDraft?.room) {
    return null
  }

  return {
    draftLabel: requestDraftSave?.draftLabel ?? continuity.apartmentLabel ?? null,
    apartmentLabel: requestDraftSave?.apartmentLabel ?? continuity.apartmentLabel ?? null,
    recommendationRoom: requestDraftSave?.recommendationRoom ?? guestDraftSnapshot?.recommendationDraft?.room ?? null,
    selectedSpaceIds,
    layoutItems,
    layoutItemCount: layoutItems.length,
  }
}

function resolveDemoAuthBlocker(email = '') {
  switch (normalizeEmail(email)) {
    case 'profile@example.com':
      return 'complete-profile'
    case 'verify@example.com':
      return 'verify-email'
    default:
      return ''
  }
}

function normalizeIntentAction(action = '') {
  switch (action) {
    case 'login':
      return 'resume-authenticated-flow'
    case 'checkout':
      return 'checkout-cart'
    case 'checkout-cart':
    case 'save-layout-draft':
    case 'resume-layout-checkout':
    case 'resume-guest-draft':
    case 'resume-account-state':
    case 'resume-authenticated-flow':
    case 'complete-profile':
    case 'verify-email':
      return action
    default:
      return ''
  }
}

function continuationStatus(nextAction) {
  switch (nextAction) {
    case 'complete-profile':
      return { status: 'action-required', statusLabel: '프로필 보완 필요' }
    case 'verify-email':
      return { status: 'action-required', statusLabel: '이메일 인증 필요' }
    case 'confirm-merge-resolution':
      return { status: 'action-required', statusLabel: '초안 병합 방향 확인 필요' }
    default:
      return { status: 'ready', statusLabel: '인증 준비 완료' }
  }
}

function buildSessionPayload({ user, handoffId = null, guestDraftSnapshot = null, mergeResolution = null, intent = null, continuation = null, draftSave = null, connection = null, actionConnection = null }) {
  const normalizedIntentAction = normalizeIntentAction(typeof intent?.action === 'string' ? intent.action.trim() : '')
  const blocker = continuation?.nextAction || normalizedIntentAction || resolveDemoAuthBlocker(user.email) || (mergeResolution === 'replace-with-account' ? 'resume-account-state' : 'resume-authenticated-flow')
  const derivedContinuation = blocker === 'resume-authenticated-flow' || blocker === 'resume-account-state' || blocker === 'checkout-cart' || blocker === 'save-layout-draft'
    ? { nextAction: blocker, status: 'ready', statusLabel: '인증 준비 완료' }
    : { nextAction: blocker, ...continuationStatus(blocker) }

  return {
    ok: true,
    sessionId: `session_${normalizeEmail(user.email).replace(/[^a-z0-9]+/g, '-')}`,
    handoffId,
    user: {
      email: user.email,
      name: user.name,
    },
    mergedGuestDraft: buildMergedGuestDraft(guestDraftSnapshot, {
      mode: mergeResolution === 'keep-guest' ? 'merge-confirmed' : mergeResolution === 'replace-with-account' ? 'replaced' : 'merged',
      resolution: mergeResolution,
    }),
    guestDraftSummary: buildGuestDraftSummary(guestDraftSnapshot),
    draftSave: buildDraftSaveState({ draftSave }, guestDraftSnapshot),
    intent: intent ? clone(intent) : null,
    accountState: clone(user.accountState),
    resumeToken: continuation?.resumeToken ?? (handoffId ? `${handoffId}:resume` : null),
    nextAction: derivedContinuation.nextAction,
    status: derivedContinuation.status,
    statusLabel: derivedContinuation.statusLabel,
    connection,
    actionConnection,
    profile: clone(user.profile),
    verifiedAt: user.verifiedAt,
  }
}

function mergeGuestDraftIntoAccount(user, guestDraftSnapshot = null, mergeResolution = null) {
  if (!guestDraftSnapshot || mergeResolution === 'replace-with-account') return
  const continuity = guestDraftSnapshot.continuity ?? {}
  user.accountState = {
    wishlistIds: Array.isArray(continuity.wishlistIds) ? [...continuity.wishlistIds] : [],
    cartItems: Array.isArray(continuity.cartItems) ? clone(continuity.cartItems) : [],
    layoutItems: Array.isArray(continuity.layoutItems) ? clone(continuity.layoutItems) : [],
    recommendationDraft: guestDraftSnapshot.recommendationDraft ? clone(guestDraftSnapshot.recommendationDraft) : null,
  }
}

export function handleAuthRequest(req, { connection = null, actionConnection = null, body = {}, pathName = '', handoffHeader = null, resumeTokenHeader = null } = {}) {
  const store = ensureStore()
  const cookies = readCookies(req)
  const sessionId = cookies[sessionCookieName] || ''
  const handoffCookie = cookies[handoffCookieName] || ''
  const handoffId = body.handoffId ?? handoffHeader ?? handoffCookie ?? null
  const sessionRecord = sessionId ? store.sessions[sessionId] ?? null : null

  const cookieHeaders = []

  if (pathName === '/api/auth/session') {
    if (!sessionRecord) return { status: 401, data: { message: 'No auth session', nextAction: 'login-required' }, cookies: cookieHeaders }
    return { status: 200, data: clone(sessionRecord.payload), cookies: cookieHeaders }
  }

  if (pathName === '/api/auth/pending') {
    const pending = handoffId ? store.pending[handoffId] ?? null : null
    if (!pending) return { status: 404, data: { message: 'No scaffold auth handoff', nextAction: 'login-required' }, cookies: cookieHeaders }
    return { status: 200, data: clone(pending), cookies: cookieHeaders }
  }

  if (pathName === '/api/auth/logout') {
    if (sessionId) delete store.sessions[sessionId]
    if (handoffCookie) delete store.pending[handoffCookie]
    saveStore(store)
    cookieHeaders.push(serializeCookie(sessionCookieName, '', { maxAge: 0 }))
    cookieHeaders.push(serializeCookie(handoffCookieName, '', { maxAge: 0 }))
    return { status: 200, data: { ok: true, nextAction: 'login-required', connection, actionConnection }, cookies: cookieHeaders }
  }

  if (pathName === '/api/auth/signup') {
    const email = normalizeEmail(body.email)
    if (!email || !email.includes('@') || typeof body.password !== 'string' || body.password.trim().length < 8) {
      return { status: 422, data: { message: 'Invalid signup payload', handoffId, nextAction: 'retry-signup', resumeToken: handoffId ? `${handoffId}:retry` : null, connection, actionConnection }, cookies: cookieHeaders }
    }
    if (store.users[email]) {
      return { status: 409, data: { message: 'Account already exists', handoffId, nextAction: 'retry-login', resumeToken: handoffId ? `${handoffId}:login` : null, connection, actionConnection }, cookies: cookieHeaders }
    }
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
    if (displayName.length < 2) {
      return { status: 422, data: { message: 'Display name required', handoffId, nextAction: 'retry-signup', resumeToken: handoffId ? `${handoffId}:retry` : null, connection, actionConnection }, cookies: cookieHeaders }
    }

    store.users[email] = buildUser({ email, password: body.password, name: displayName })
    saveStore(store)
  }

  if (pathName === '/api/auth/login' || pathName === '/api/auth/signup') {
    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''
    const user = store.users[email] ?? null

    if (!user || user.password !== password) {
      return { status: 401, data: { message: 'Invalid credentials', handoffId, nextAction: 'retry-login', resumeToken: handoffId ? `${handoffId}:retry` : null, connection, actionConnection }, cookies: cookieHeaders }
    }

    if (password === 'merge-conflict' && !['keep-guest', 'replace-with-account'].includes(body.mergeResolution)) {
      const pending = {
        submittedAt: new Date().toISOString(),
        handoffId,
        email,
        request: clone(body),
        summary: {
          email,
          handoffId,
          wishlistCount: body.guestDraftSnapshot?.continuity?.wishlistIds?.length ?? 0,
          cartCount: body.guestDraftSnapshot?.continuity?.cartItems?.length ?? 0,
          layoutItemCount: body.guestDraftSnapshot?.continuity?.layoutItems?.length ?? 0,
          hasRecommendationDraft: Boolean(body.guestDraftSnapshot?.recommendationDraft),
          mergeResolution: null,
          intent: clone(body.intent ?? null),
        },
        connection,
        actionConnection,
        continuation: {
          resumeToken: handoffId ? `${handoffId}:merge` : randomId('resume'),
          nextAction: 'confirm-merge-resolution',
          status: 'action-required',
          statusLabel: '초안 병합 방향 확인 필요',
        },
        continuationFields: null,
        draftSave: buildDraftSaveState(body, body.guestDraftSnapshot ?? null),
        guestDraftSnapshot: clone(body.guestDraftSnapshot ?? null),
        guestDraftSummary: buildGuestDraftSummary(body.guestDraftSnapshot ?? null),
        allowedMergeResolutions: ['keep-guest', 'replace-with-account'],
        error: 'Guest draft merge confirmation required',
        status: 409,
      }
      if (handoffId) store.pending[handoffId] = pending
      saveStore(store)
      if (handoffId) cookieHeaders.push(serializeCookie(handoffCookieName, handoffId, { maxAge: 60 * 60 * 24 * 7 }))
      return {
        status: 409,
        data: {
          message: 'Guest draft merge confirmation required',
          handoffId,
          resumeToken: pending.continuation.resumeToken,
          nextAction: 'confirm-merge-resolution',
          status: 'action-required',
          statusLabel: '초안 병합 방향 확인 필요',
          allowedMergeResolutions: ['keep-guest', 'replace-with-account'],
          mergedGuestDraft: buildMergedGuestDraft(body.guestDraftSnapshot ?? null),
          connection,
          actionConnection,
        },
        cookies: cookieHeaders,
      }
    }

    mergeGuestDraftIntoAccount(user, body.guestDraftSnapshot ?? null, body.mergeResolution ?? null)
    const payload = buildSessionPayload({
      user,
      handoffId,
      guestDraftSnapshot: body.guestDraftSnapshot ?? null,
      mergeResolution: body.mergeResolution ?? null,
      intent: body.intent ?? null,
      continuation: {
        resumeToken: handoffId ? `${handoffId}:resume` : randomId('resume'),
        nextAction: resolveDemoAuthBlocker(user.email) || normalizeIntentAction(typeof body.intent?.action === 'string' ? body.intent.action : '') || 'resume-authenticated-flow',
      },
      draftSave: body.draftSave ?? null,
      connection,
      actionConnection,
    })
    const newSessionId = randomId('session')
    store.sessions[newSessionId] = {
      userEmail: email,
      payload,
      savedAt: new Date().toISOString(),
    }
    if (handoffId) delete store.pending[handoffId]
    saveStore(store)
    cookieHeaders.push(serializeCookie(sessionCookieName, newSessionId, { maxAge: 60 * 60 * 24 * 30 }))
    cookieHeaders.push(serializeCookie(handoffCookieName, handoffId ?? '', { maxAge: handoffId ? 60 * 60 * 24 * 7 : 0 }))
    return { status: 200, data: payload, cookies: cookieHeaders }
  }

  if (pathName === '/api/auth/continue') {
    const effectiveHandoffId = handoffId ?? handoffCookie ?? null
    const pending = effectiveHandoffId ? store.pending[effectiveHandoffId] ?? null : null
    const continuation = body.continuation ?? {}
    const nextAction = typeof continuation.nextAction === 'string' && continuation.nextAction.trim()
      ? continuation.nextAction.trim()
      : (pending?.continuation?.nextAction ?? sessionRecord?.payload?.nextAction ?? '')
    const fields = body.fields && typeof body.fields === 'object' && !Array.isArray(body.fields) ? body.fields : {}

    if (nextAction === 'confirm-merge-resolution') {
      const mergeResolution = typeof fields.mergeResolution === 'string' ? fields.mergeResolution.trim() : ''
      if (!pending) return { status: 401, data: { message: 'No auth handoff to continue', nextAction: 'login-required', connection, actionConnection }, cookies: cookieHeaders }
      if (!['keep-guest', 'replace-with-account'].includes(mergeResolution)) {
        return { status: 422, data: { message: 'Merge resolution required', handoffId: effectiveHandoffId, resumeToken: pending.continuation?.resumeToken ?? resumeTokenHeader ?? null, nextAction: 'confirm-merge-resolution', allowedMergeResolutions: ['keep-guest', 'replace-with-account'], connection, actionConnection }, cookies: cookieHeaders }
      }
      const user = store.users[pending.email]
      if (!user) return { status: 404, data: { message: 'User not found', nextAction: 'login-required', connection, actionConnection }, cookies: cookieHeaders }
      mergeGuestDraftIntoAccount(user, pending.guestDraftSnapshot ?? null, mergeResolution)
      const payload = buildSessionPayload({
        user,
        handoffId: effectiveHandoffId,
        guestDraftSnapshot: pending.guestDraftSnapshot ?? null,
        mergeResolution,
        intent: body.intent ?? pending.summary?.intent ?? null,
        continuation: { resumeToken: pending.continuation?.resumeToken ?? resumeTokenHeader ?? null, nextAction: normalizeIntentAction(typeof (body.intent ?? pending.summary?.intent)?.action === 'string' ? (body.intent ?? pending.summary?.intent).action : '') || 'resume-authenticated-flow' },
        draftSave: body.draftSave ?? pending.draftSave ?? null,
        connection: pending.connection ?? connection,
        actionConnection: pending.actionConnection ?? actionConnection,
      })
      const newSessionId = randomId('session')
      store.sessions[newSessionId] = { userEmail: user.email, payload, savedAt: new Date().toISOString() }
      delete store.pending[effectiveHandoffId]
      saveStore(store)
      cookieHeaders.push(serializeCookie(sessionCookieName, newSessionId, { maxAge: 60 * 60 * 24 * 30 }))
      cookieHeaders.push(serializeCookie(handoffCookieName, effectiveHandoffId, { maxAge: 60 * 60 * 24 * 7 }))
      return { status: 200, data: payload, cookies: cookieHeaders }
    }

    if (!sessionRecord) {
      return { status: 401, data: { message: 'No auth session', nextAction: 'login-required', connection, actionConnection }, cookies: cookieHeaders }
    }

    const payload = clone(sessionRecord.payload)
    if (nextAction === 'complete-profile') {
      const displayName = typeof fields.displayName === 'string' ? fields.displayName.trim() : ''
      const phone = typeof fields.phone === 'string' ? fields.phone.trim() : ''
      if (!displayName || !phone) {
        return { status: 422, data: { ...payload, message: 'Profile completion fields required', nextAction: 'complete-profile', status: 'action-required', statusLabel: '프로필 보완 필요', connection: payload.connection ?? connection, actionConnection: payload.actionConnection ?? actionConnection }, cookies: cookieHeaders }
      }
      const user = store.users[sessionRecord.userEmail]
      if (user) {
        user.profile = { displayName, phone }
        user.name = displayName
      }
      payload.user.name = displayName
      payload.profile = { displayName, phone }
      payload.nextAction = normalizeIntentAction(typeof (body.intent ?? payload.intent)?.action === 'string' ? (body.intent ?? payload.intent).action : '') || 'resume-authenticated-flow'
      payload.status = 'ready'
      payload.statusLabel = '프로필 준비 완료'
    } else if (nextAction === 'verify-email') {
      const verificationCode = typeof fields.verificationCode === 'string' ? fields.verificationCode.trim() : ''
      if (!verificationCode) {
        return { status: 202, data: { ...payload, nextAction: 'verify-email', status: 'action-required', statusLabel: '이메일 인증 필요', connection: payload.connection ?? connection, actionConnection: payload.actionConnection ?? actionConnection }, cookies: cookieHeaders }
      }
      const user = store.users[sessionRecord.userEmail]
      if (user) user.verifiedAt = new Date().toISOString()
      payload.verifiedAt = store.users[sessionRecord.userEmail]?.verifiedAt ?? new Date().toISOString()
      payload.nextAction = normalizeIntentAction(typeof (body.intent ?? payload.intent)?.action === 'string' ? (body.intent ?? payload.intent).action : '') || 'resume-authenticated-flow'
      payload.status = 'ready'
      payload.statusLabel = '이메일 인증 완료'
    } else {
      payload.nextAction = nextAction || payload.nextAction || 'resume-authenticated-flow'
      payload.status = 'ready'
      payload.statusLabel = '인증 준비 완료'
    }

    if (body.intent) payload.intent = clone(body.intent)
    if (body.draftSave) payload.draftSave = clone(body.draftSave)
    sessionRecord.payload = payload
    saveStore(store)
    return { status: 200, data: payload, cookies: cookieHeaders }
  }

  return { status: 404, data: { message: 'Not found' }, cookies: cookieHeaders }
}
