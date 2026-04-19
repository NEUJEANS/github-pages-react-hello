import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import Database from 'better-sqlite3'
import { parseCookie, stringifySetCookie } from 'cookie'

const sessionCookieName = 'havenly_auth_session'
const handoffCookieName = 'havenly_auth_handoff'
const authSessionMaxAgeSeconds = 60 * 60 * 24 * 30
const authHandoffMaxAgeSeconds = 60 * 60 * 24 * 7

let database = null
let databasePath = null

function resolveStoreSource(source = null) {
  return source ?? process.env
}

export function readAuthStorePaths(source = process.env) {
  const explicitDataDir = typeof source?.dataDir === 'string' && source.dataDir.trim()
    ? source.dataDir.trim()
    : ''
  const envDataDir = typeof source?.HAVENLY_AUTH_DATA_DIR === 'string' && source.HAVENLY_AUTH_DATA_DIR.trim()
    ? source.HAVENLY_AUTH_DATA_DIR.trim()
    : ''
  const configuredDataDir = explicitDataDir || envDataDir || '.data'
  const dataDir = path.resolve(configuredDataDir)

  const explicitSqlitePath = typeof source?.sqlitePath === 'string' && source.sqlitePath.trim()
    ? source.sqlitePath.trim()
    : (typeof source?.storeFile === 'string' && source.storeFile.trim()
      ? source.storeFile.trim()
      : '')
  const envSqlitePath = typeof source?.HAVENLY_AUTH_SQLITE_PATH === 'string' && source.HAVENLY_AUTH_SQLITE_PATH.trim()
    ? source.HAVENLY_AUTH_SQLITE_PATH.trim()
    : ''
  const sqlitePath = explicitSqlitePath
    ? path.resolve(explicitSqlitePath)
    : envSqlitePath
      ? path.resolve(envSqlitePath)
      : path.join(dataDir, 'havenly-auth-store.sqlite')
  const legacyJsonPath = path.join(dataDir, 'havenly-auth-store.json')

  return {
    dataDir,
    sqlitePath,
    legacyJsonPath,
  }
}

function ensureDataDir(source = null) {
  const { dataDir, sqlitePath } = readAuthStorePaths(resolveStoreSource(source))
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const sqliteDir = path.dirname(sqlitePath)
  if (!fs.existsSync(sqliteDir)) fs.mkdirSync(sqliteDir, { recursive: true })
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

function serializeJson(value) {
  return JSON.stringify(value ?? null)
}

function parseJson(value, fallback = null) {
  if (typeof value !== 'string' || !value.trim()) return clone(fallback)

  try {
    return JSON.parse(value)
  } catch {
    return clone(fallback)
  }
}

function addSecondsToTimestamp(timestamp = new Date().toISOString(), seconds = 0) {
  const parsedAt = Date.parse(timestamp)
  const baseTime = Number.isNaN(parsedAt) ? Date.now() : parsedAt
  return new Date(baseTime + (seconds * 1000)).toISOString()
}

function isExpiredTimestamp(timestamp = null) {
  if (typeof timestamp !== 'string' || !timestamp.trim()) return false
  const parsedAt = Date.parse(timestamp)
  return !Number.isNaN(parsedAt) && parsedAt <= Date.now()
}

function ensureDatabaseColumn(db, tableName, columnName, columnDefinition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all()
  const hasColumn = columns.some((column) => column.name === columnName)
  if (!hasColumn) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`)
  }
}

function hashPassword(password = '') {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${derivedKey}`
}

function isPasswordHash(password = '') {
  return typeof password === 'string' && password.startsWith('scrypt$')
}

function ensureStoredPassword(password = '') {
  return isPasswordHash(password) ? password : hashPassword(password)
}

function verifyPassword(password = '', storedPassword = '') {
  if (!storedPassword) return false

  if (!isPasswordHash(storedPassword)) {
    return password === storedPassword
  }

  const [, salt, expectedKey] = storedPassword.split('$')
  if (!salt || !expectedKey) return false

  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  const expectedBuffer = Buffer.from(expectedKey, 'hex')
  const derivedBuffer = Buffer.from(derivedKey, 'hex')

  return expectedBuffer.length === derivedBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, derivedBuffer)
}

function buildUser({ email, password, name, createdAt = new Date().toISOString(), profile = null, verifiedAt = null, accountState = null }) {
  return {
    email,
    password,
    name,
    createdAt,
    profile,
    verifiedAt,
    accountState: accountState ?? {
      wishlistIds: [],
      cartItems: [],
      layoutItems: [],
      apartmentSelectionId: null,
      layoutBoardSavedAt: null,
      recommendationDraft: null,
    },
  }
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

function ensureDatabase(source = null) {
  const resolvedSource = resolveStoreSource(source)
  const { sqlitePath } = readAuthStorePaths(resolvedSource)

  if (database && databasePath === sqlitePath) return database
  if (database && databasePath !== sqlitePath) {
    database.close()
    database = null
  }

  ensureDataDir(resolvedSource)
  database = new Database(sqlitePath)
  databasePath = sqlitePath
  database.pragma('journal_mode = WAL')
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      profile_json TEXT,
      verified_at TEXT,
      account_state_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      saved_at TEXT NOT NULL,
      expires_at TEXT,
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS pending (
      handoff_id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      saved_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS verification_requests (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      resume_token TEXT,
      status TEXT NOT NULL,
      request_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS layout_metrics (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL
    );
  `)
  ensureDatabaseColumn(database, 'sessions', 'expires_at', 'TEXT')

  const hasUsers = database.prepare('SELECT 1 FROM users LIMIT 1').get()
  if (!hasUsers) {
    const legacyStore = readLegacyJsonStore(resolvedSource)
    const initialUsers = legacyStore?.users && Object.keys(legacyStore.users).length > 0
      ? legacyStore.users
      : seedUsers()

    const insertUser = database.prepare(`
      INSERT OR REPLACE INTO users (email, password, name, created_at, profile_json, verified_at, account_state_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const insertSession = database.prepare(`
      INSERT OR REPLACE INTO sessions (id, user_email, payload_json, saved_at, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    const insertPending = database.prepare(`
      INSERT OR REPLACE INTO pending (handoff_id, payload_json, saved_at)
      VALUES (?, ?, ?)
    `)

    try {
      database.exec('BEGIN')

      Object.values(initialUsers).forEach((user) => {
        const normalized = buildUser(user)
        insertUser.run(
          normalized.email,
          ensureStoredPassword(normalized.password),
          normalized.name,
          normalized.createdAt,
          serializeJson(normalized.profile),
          normalized.verifiedAt,
          serializeJson(normalized.accountState),
        )
      })

      Object.entries(legacyStore?.sessions ?? {}).forEach(([id, session]) => {
        const savedAt = session.savedAt ?? new Date().toISOString()
        insertSession.run(
          id,
          session.userEmail,
          serializeJson(session.payload),
          savedAt,
          session.expiresAt ?? addSecondsToTimestamp(savedAt, authSessionMaxAgeSeconds),
        )
      })

      Object.entries(legacyStore?.pending ?? {}).forEach(([handoffId, pending]) => {
        insertPending.run(
          handoffId,
          serializeJson(pending),
          pending.submittedAt ?? new Date().toISOString(),
        )
      })

      database.exec('COMMIT')
    } catch (error) {
      database.exec('ROLLBACK')
      throw error
    }
  }

  return database
}

function readLegacyJsonStore(source = null) {
  const { legacyJsonPath } = readAuthStorePaths(resolveStoreSource(source))
  if (!fs.existsSync(legacyJsonPath)) return null

  try {
    const parsed = JSON.parse(fs.readFileSync(legacyJsonPath, 'utf8'))
    return {
      users: parsed?.users && typeof parsed.users === 'object' ? parsed.users : seedUsers(),
      sessions: parsed?.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {},
      pending: parsed?.pending && typeof parsed.pending === 'object' ? parsed.pending : {},
    }
  } catch {
    return null
  }
}

function readUser(email, source = null) {
  const db = ensureDatabase(source)
  const row = db.prepare(`
    SELECT email, password, name, created_at, profile_json, verified_at, account_state_json
    FROM users
    WHERE email = ?
  `).get(email)

  if (!row) return null

  return buildUser({
    email: row.email,
    password: row.password,
    name: row.name,
    createdAt: row.created_at,
    profile: parseJson(row.profile_json, null),
    verifiedAt: row.verified_at ?? null,
    accountState: parseJson(row.account_state_json, { wishlistIds: [], cartItems: [], layoutItems: [], layoutTrayItems: [], apartmentSelectionId: null, draftLabel: null, apartmentLabel: null, selectedSpaceIds: [], layoutBoardSavedAt: null, recommendationDraft: null }),
  })
}

function saveUser(user, source = null) {
  const db = ensureDatabase(source)
  db.prepare(`
    INSERT INTO users (email, password, name, created_at, profile_json, verified_at, account_state_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      password = excluded.password,
      name = excluded.name,
      created_at = excluded.created_at,
      profile_json = excluded.profile_json,
      verified_at = excluded.verified_at,
      account_state_json = excluded.account_state_json
  `).run(
    user.email,
    ensureStoredPassword(user.password),
    user.name,
    user.createdAt,
    serializeJson(user.profile),
    user.verifiedAt,
    serializeJson(user.accountState),
  )
}

function readSessionRecord(sessionId, source = null) {
  const db = ensureDatabase(source)
  const row = db.prepare('SELECT id, user_email, payload_json, saved_at, expires_at FROM sessions WHERE id = ?').get(sessionId)
  if (!row) return null

  const expiresAt = row.expires_at ?? addSecondsToTimestamp(row.saved_at, authSessionMaxAgeSeconds)
  if (isExpiredTimestamp(expiresAt)) {
    deleteSessionRecord(sessionId, source)
    return null
  }

  return {
    id: row.id,
    userEmail: row.user_email,
    payload: parseJson(row.payload_json, null),
    savedAt: row.saved_at,
    expiresAt,
  }
}

function saveSessionRecord(sessionId, { userEmail, payload, savedAt = new Date().toISOString(), expiresAt = addSecondsToTimestamp(savedAt, authSessionMaxAgeSeconds) }, source = null) {
  const db = ensureDatabase(source)
  db.prepare(`
    INSERT INTO sessions (id, user_email, payload_json, saved_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      user_email = excluded.user_email,
      payload_json = excluded.payload_json,
      saved_at = excluded.saved_at,
      expires_at = excluded.expires_at
  `).run(sessionId, userEmail, serializeJson(payload), savedAt, expiresAt)
}

function deleteSessionRecord(sessionId, source = null) {
  if (!sessionId) return
  const db = ensureDatabase(source)
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
}

function readPendingRecord(handoffId, source = null) {
  const db = ensureDatabase(source)
  const row = db.prepare('SELECT handoff_id, payload_json, saved_at FROM pending WHERE handoff_id = ?').get(handoffId)
  if (!row) return null

  return parseJson(row.payload_json, null)
}

function savePendingRecord(handoffId, payload, { savedAt = payload?.submittedAt ?? new Date().toISOString() } = {}, source = null) {
  const db = ensureDatabase(source)
  db.prepare(`
    INSERT INTO pending (handoff_id, payload_json, saved_at)
    VALUES (?, ?, ?)
    ON CONFLICT(handoff_id) DO UPDATE SET
      payload_json = excluded.payload_json,
      saved_at = excluded.saved_at
  `).run(handoffId, serializeJson(payload), savedAt)
}

function deletePendingRecord(handoffId, source = null) {
  if (!handoffId) return
  const db = ensureDatabase(source)
  db.prepare('DELETE FROM pending WHERE handoff_id = ?').run(handoffId)
}

function saveVerificationRequest(record, source = null) {
  const db = ensureDatabase(source)
  db.prepare(`
    INSERT INTO verification_requests (id, session_id, user_email, resume_token, status, request_json, created_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      session_id = excluded.session_id,
      user_email = excluded.user_email,
      resume_token = excluded.resume_token,
      status = excluded.status,
      request_json = excluded.request_json,
      created_at = excluded.created_at,
      completed_at = excluded.completed_at
  `).run(
    record.id,
    record.sessionId,
    record.userEmail,
    record.resumeToken ?? null,
    record.status,
    serializeJson(record.request ?? null),
    record.createdAt ?? new Date().toISOString(),
    record.completedAt ?? null,
  )
}

function readVerificationRequest(verificationId, source = null) {
  if (!verificationId) return null
  const db = ensureDatabase(source)
  const row = db.prepare('SELECT * FROM verification_requests WHERE id = ?').get(verificationId)
  if (!row) return null

  return {
    id: row.id,
    sessionId: row.session_id,
    userEmail: row.user_email,
    resumeToken: row.resume_token ?? null,
    status: row.status,
    request: parseJson(row.request_json, null),
    createdAt: row.created_at,
    completedAt: row.completed_at ?? null,
  }
}

function incrementLayoutMetric(metricKey, source = null) {
  const db = ensureDatabase(source)
  db.prepare(`
    INSERT INTO layout_metrics (key, count) VALUES (?, 1)
    ON CONFLICT(key) DO UPDATE SET count = count + 1
  `).run(metricKey)

  const row = db.prepare('SELECT count FROM layout_metrics WHERE key = ?').get(metricKey)
  return row?.count ?? 0
}

function readLayoutMetric(metricKey, source = null) {
  const db = ensureDatabase(source)
  const row = db.prepare('SELECT count FROM layout_metrics WHERE key = ?').get(metricKey)
  return row?.count ?? 0
}

function buildLayoutMetricsSummary(source = null) {
  return {
    selectedComponent: readLayoutMetric('selectedComponent', source),
    abandonedComponent: readLayoutMetric('abandonedComponent', source),
  }
}

function finalizeVerificationRequest(verificationId, { status = 'verified', storeSource = null, completedAt = new Date().toISOString() } = {}) {
  const verification = readVerificationRequest(verificationId, storeSource)
  if (!verification) return null

  verification.status = status
  verification.completedAt = completedAt
  saveVerificationRequest(verification, storeSource)

  if (status !== 'verified') return verification

  const user = readUser(verification.userEmail, storeSource)
  const sessionRecord = readSessionRecord(verification.sessionId, storeSource)

  if (user) {
    user.verifiedAt = completedAt
    saveUser(user, storeSource)
  }

  if (sessionRecord?.payload) {
    const payload = clone(sessionRecord.payload)
    payload.verifiedAt = completedAt
    payload.nextAction = resolvePostBlockerNextAction(payload, 'verify-email')
    payload.status = 'ready'
    payload.statusLabel = '이메일 인증 완료'
    saveSessionRecord(verification.sessionId, {
      userEmail: sessionRecord.userEmail,
      payload,
      savedAt: new Date().toISOString(),
      expiresAt: sessionRecord.expiresAt,
    }, storeSource)
  }

  return verification
}

export function createVerificationCallbackUrl({ verificationId, status = 'verified' } = {}) {
  const params = new URLSearchParams()
  params.set('verificationId', verificationId ?? '')
  params.set('status', status)
  return `/api/auth/verification/callback?${params.toString()}`
}

function normalizeEmail(email = '') {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function readCookies(req) {
  const cookieHeader = typeof req?.headers?.cookie === 'string' ? req.headers.cookie : ''
  return parseCookie(cookieHeader)
}

function readRequestOrigin(req) {
  return typeof req?.headers?.origin === 'string' ? req.headers.origin.trim() : ''
}

function readForwardedProto(req) {
  return typeof req?.headers?.['x-forwarded-proto'] === 'string'
    ? req.headers['x-forwarded-proto'].trim().toLowerCase()
    : ''
}

function readForwardedHost(req) {
  return typeof req?.headers?.['x-forwarded-host'] === 'string'
    ? req.headers['x-forwarded-host'].trim()
    : ''
}

function readRequestHost(req) {
  return readForwardedHost(req)
    || (typeof req?.headers?.host === 'string' ? req.headers.host.trim() : '')
}

function normalizeHostName(host = '') {
  const candidate = String(host ?? '').trim()
  if (!candidate) return ''

  try {
    return new URL(candidate.includes('://') ? candidate : `http://${candidate}`).hostname.toLowerCase()
  } catch {
    return candidate.replace(/:\d+$/, '').toLowerCase()
  }
}

function isLoopbackHost(host = '') {
  const normalizedHost = normalizeHostName(host)
  return normalizedHost === 'localhost'
    || normalizedHost === '::1'
    || /^127(?:\.\d{1,3}){3}$/i.test(normalizedHost)
}

function readRequestProtocol(req) {
  const forwardedProto = readForwardedProto(req)
  if (forwardedProto === 'https' || forwardedProto === 'http') return forwardedProto
  if (req?.socket?.encrypted) return 'https'

  const origin = readRequestOrigin(req)
  if (/^https:\/\//i.test(origin)) return 'https'
  if (/^http:\/\//i.test(origin)) return 'http'

  return 'http'
}

function isSecureRequest(req) {
  return readRequestProtocol(req) === 'https'
}

function shouldUseCrossSiteCookiePolicy(req) {
  const origin = readRequestOrigin(req)
  if (!origin) return false

  try {
    const originUrl = new URL(origin)
    const requestHost = readRequestHost(req)
    const requestProtocol = readRequestProtocol(req)

    if (!requestHost) return false
    if (isLoopbackHost(originUrl.hostname) && isLoopbackHost(requestHost)) return false

    return originUrl.origin !== `${requestProtocol}://${requestHost}`
  } catch {
    return false
  }
}

function buildCookieOptions(req) {
  const secureRequest = isSecureRequest(req)
  const crossSiteRequest = shouldUseCrossSiteCookiePolicy(req)

  if (crossSiteRequest && secureRequest) {
    return {
      sameSite: 'None',
      secure: true,
    }
  }

  return {
    sameSite: 'Lax',
    secure: secureRequest,
  }
}

function serializeCookie(name, value, { maxAge = null, sameSite = 'Lax', secure = false } = {}) {
  return stringifySetCookie({
    name,
    value,
    path: '/',
    httpOnly: true,
    sameSite,
    secure,
    ...(maxAge != null ? { maxAge } : {}),
  })
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`
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
    apartmentSelectionId: guestDraftSnapshot?.spaceProfile?.apartmentSelectionId ?? null,
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
  const layoutTrayItems = Array.isArray(requestDraftSave?.layoutTrayItems)
    ? requestDraftSave.layoutTrayItems.map((item) => ({ ...item }))
    : (Array.isArray(continuity.layoutTrayItems) ? continuity.layoutTrayItems.map((item) => ({ ...item })) : [])
  const selectedSpaceIds = Array.isArray(requestDraftSave?.selectedSpaceIds)
    ? [...requestDraftSave.selectedSpaceIds]
    : (Array.isArray(guestDraftSnapshot?.spaceProfile?.spaces) ? [...guestDraftSnapshot.spaceProfile.spaces] : [])
  const apartmentSelectionId = typeof requestDraftSave?.apartmentSelectionId === 'string' && requestDraftSave.apartmentSelectionId.trim()
    ? requestDraftSave.apartmentSelectionId.trim()
    : (typeof guestDraftSnapshot?.spaceProfile?.apartmentSelectionId === 'string' && guestDraftSnapshot.spaceProfile.apartmentSelectionId.trim()
      ? guestDraftSnapshot.spaceProfile.apartmentSelectionId.trim()
      : null)

  if (!requestDraftSave && !layoutItems.length && !layoutTrayItems.length && !selectedSpaceIds.length && !continuity.apartmentLabel && !apartmentSelectionId && !guestDraftSnapshot?.recommendationDraft?.room) {
    return null
  }

  return {
    draftLabel: requestDraftSave?.draftLabel ?? continuity.apartmentLabel ?? null,
    apartmentLabel: requestDraftSave?.apartmentLabel ?? continuity.apartmentLabel ?? null,
    apartmentSelectionId,
    recommendationRoom: requestDraftSave?.recommendationRoom ?? requestDraftSave?.recommendationDraft?.room ?? guestDraftSnapshot?.recommendationDraft?.room ?? null,
    recommendationDraft: requestDraftSave?.recommendationDraft
      ? normalizeRecommendationDraftInput(requestDraftSave.recommendationDraft, requestDraftSave?.recommendationRoom ?? null)
      : (guestDraftSnapshot?.recommendationDraft ? normalizeRecommendationDraftInput(guestDraftSnapshot.recommendationDraft) : null),
    selectedSpaceIds,
    layoutItems,
    layoutTrayItems,
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

function resolvePostBlockerNextAction(session = null, blockerAction = '') {
  const currentNextAction = typeof session?.nextAction === 'string' ? session.nextAction.trim() : ''
  if (currentNextAction && currentNextAction !== blockerAction) return currentNextAction

  const intentAction = normalizeIntentAction(typeof session?.intent?.action === 'string' ? session.intent.action.trim() : '')
  if (intentAction && intentAction !== blockerAction) return intentAction

  return 'resume-authenticated-flow'
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

function buildSignupSuccessPayload({ email, displayName, handoffId = null, connection = null, actionConnection = null } = {}) {
  return {
    ok: true,
    created: true,
    ...(handoffId ? { handoffId } : {}),
    user: {
      email,
      name: displayName,
    },
    message: '회원가입이 완료됐어요. 이제 로그인해 주세요.',
    nextAction: 'retry-login',
    status: 'signup-complete',
    statusLabel: '회원가입 완료',
    connection,
    actionConnection,
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
    layoutTrayItems: Array.isArray(continuity.layoutTrayItems) ? clone(continuity.layoutTrayItems) : [],
    apartmentSelectionId: guestDraftSnapshot?.spaceProfile?.apartmentSelectionId ?? null,
    layoutBoardSavedAt: typeof user.accountState?.layoutBoardSavedAt === 'string' ? user.accountState.layoutBoardSavedAt : null,
    recommendationDraft: guestDraftSnapshot.recommendationDraft ? clone(guestDraftSnapshot.recommendationDraft) : null,
  }
}

function normalizeRecommendationDraftInput(recommendationDraft = null, recommendationRoom = null) {
  if ((!recommendationDraft || typeof recommendationDraft !== 'object' || Array.isArray(recommendationDraft)) && !(typeof recommendationRoom === 'string' && recommendationRoom.trim())) {
    return null
  }

  const room = typeof recommendationDraft?.room === 'string' && recommendationDraft.room.trim()
    ? recommendationDraft.room.trim()
    : (typeof recommendationRoom === 'string' && recommendationRoom.trim() ? recommendationRoom.trim() : null)
  const style = typeof recommendationDraft?.style === 'string' && recommendationDraft.style.trim() ? recommendationDraft.style.trim() : null
  const priority = typeof recommendationDraft?.priority === 'string' && recommendationDraft.priority.trim() ? recommendationDraft.priority.trim() : null
  const lifestyle = Array.isArray(recommendationDraft?.lifestyle)
    ? recommendationDraft.lifestyle.filter((value, index, array) => typeof value === 'string' && value.trim() && array.indexOf(value) === index)
    : []
  const extraRequest = typeof recommendationDraft?.extraRequest === 'string' ? recommendationDraft.extraRequest.trim() : ''

  if (!room && !style && !priority && !lifestyle.length && !extraRequest) return null

  return { room, style, priority, lifestyle, extraRequest }
}

function applyDraftSaveToAccountState(user, draftSave = null) {
  if (!user || !draftSave || typeof draftSave !== 'object' || Array.isArray(draftSave)) return false

  const nextLayoutItems = Array.isArray(draftSave.layoutItems)
    ? draftSave.layoutItems.map((item) => ({ ...item }))
    : null
  const nextLayoutTrayItems = Array.isArray(draftSave.layoutTrayItems)
    ? draftSave.layoutTrayItems.map((item) => ({ ...item }))
    : null
  const normalizedRecommendationDraft = normalizeRecommendationDraftInput(draftSave.recommendationDraft, draftSave.recommendationRoom)
  const nextRecommendationDraft = normalizedRecommendationDraft
    ? {
        ...(user.accountState?.recommendationDraft ?? {}),
        ...normalizedRecommendationDraft,
      }
    : null

  const nextApartmentSelectionId = typeof draftSave.apartmentSelectionId === 'string' && draftSave.apartmentSelectionId.trim()
    ? draftSave.apartmentSelectionId.trim()
    : (typeof user.accountState?.apartmentSelectionId === 'string' && user.accountState.apartmentSelectionId.trim()
      ? user.accountState.apartmentSelectionId.trim()
      : null)
  const nextDraftLabel = typeof draftSave.draftLabel === 'string' && draftSave.draftLabel.trim()
    ? draftSave.draftLabel.trim()
    : (typeof user.accountState?.draftLabel === 'string' && user.accountState.draftLabel.trim()
      ? user.accountState.draftLabel.trim()
      : null)
  const nextApartmentLabel = typeof draftSave.apartmentLabel === 'string' && draftSave.apartmentLabel.trim()
    ? draftSave.apartmentLabel.trim()
    : (typeof user.accountState?.apartmentLabel === 'string' && user.accountState.apartmentLabel.trim()
      ? user.accountState.apartmentLabel.trim()
      : null)
  const nextSelectedSpaceIds = Array.isArray(draftSave.selectedSpaceIds)
    ? draftSave.selectedSpaceIds.filter((value, index, array) => typeof value === 'string' && value.trim() && array.indexOf(value) === index)
    : (Array.isArray(user.accountState?.selectedSpaceIds) ? [...user.accountState.selectedSpaceIds] : [])

  const nextAccountState = {
    wishlistIds: Array.isArray(user.accountState?.wishlistIds) ? [...user.accountState.wishlistIds] : [],
    cartItems: Array.isArray(user.accountState?.cartItems) ? clone(user.accountState.cartItems) : [],
    layoutItems: nextLayoutItems ?? (Array.isArray(user.accountState?.layoutItems) ? clone(user.accountState.layoutItems) : []),
    layoutTrayItems: nextLayoutTrayItems ?? (Array.isArray(user.accountState?.layoutTrayItems) ? clone(user.accountState.layoutTrayItems) : []),
    apartmentSelectionId: nextApartmentSelectionId,
    draftLabel: nextDraftLabel,
    apartmentLabel: nextApartmentLabel,
    selectedSpaceIds: nextSelectedSpaceIds,
    layoutBoardSavedAt: new Date().toISOString(),
    recommendationDraft: nextRecommendationDraft ?? clone(user.accountState?.recommendationDraft ?? null),
  }

  const unchanged = JSON.stringify(user.accountState ?? null) === JSON.stringify(nextAccountState)
  if (unchanged) return false

  user.accountState = nextAccountState
  return true
}

export function handleAuthRequest(req, { connection = null, actionConnection = null, body = {}, pathName = '', handoffHeader = null, resumeTokenHeader = null, dataDir = null, sqlitePath = null, storeFile = null } = {}) {
  const storeSource = dataDir || sqlitePath || storeFile
    ? {
        ...(dataDir ? { dataDir } : {}),
        ...(sqlitePath ? { sqlitePath } : {}),
        ...(storeFile ? { storeFile } : {}),
      }
    : null

  ensureDatabase(storeSource)
  const cookies = readCookies(req)
  const sessionId = cookies[sessionCookieName] || ''
  const handoffCookie = cookies[handoffCookieName] || ''
  const handoffId = body.handoffId ?? handoffHeader ?? handoffCookie ?? null
  const sessionRecord = sessionId ? readSessionRecord(sessionId, storeSource) : null

  const cookieHeaders = []
  const cookieOptions = buildCookieOptions(req)

  if (pathName === '/api/auth/verification/start') {
    if (!sessionRecord) return { status: 401, data: { message: 'No auth session', nextAction: 'login-required', connection, actionConnection }, cookies: cookieHeaders }

    const verificationId = randomId('verify')
    saveVerificationRequest({
      id: verificationId,
      sessionId,
      userEmail: sessionRecord.userEmail,
      resumeToken: body?.continuation?.resumeToken ?? resumeTokenHeader ?? sessionRecord.payload?.resumeToken ?? null,
      status: 'pending',
      request: clone(body),
      createdAt: new Date().toISOString(),
      completedAt: null,
    }, storeSource)

    return {
      status: 202,
      data: {
        ok: true,
        verificationId,
        status: 'pending',
        statusLabel: '본인 인증 진행 중',
        callbackUrl: createVerificationCallbackUrl({ verificationId }),
        connection,
        actionConnection,
      },
      cookies: cookieHeaders,
    }
  }

  if (pathName === '/api/auth/verification/status') {
    const verificationId = body.verificationId ?? null
    const verification = readVerificationRequest(verificationId, storeSource)
    if (!verification) {
      return { status: 404, data: { message: 'Verification not found', nextAction: 'verify-email', connection, actionConnection }, cookies: cookieHeaders }
    }

    const sessionPayload = verification.sessionId
      ? (readSessionRecord(verification.sessionId, storeSource)?.payload ?? null)
      : null

    return {
      status: 200,
      data: {
        ok: true,
        verificationId: verification.id,
        status: verification.status,
        completedAt: verification.completedAt ?? null,
        verifiedAt: sessionPayload?.verifiedAt ?? null,
        nextAction: sessionPayload?.nextAction ?? 'verify-email',
        statusLabel: verification.status === 'verified' ? '이메일 인증 완료' : '본인 인증 진행 중',
        connection: sessionPayload?.connection ?? connection,
        actionConnection: sessionPayload?.actionConnection ?? actionConnection,
      },
      cookies: cookieHeaders,
    }
  }

  if (pathName === '/api/auth/layout/track') {
    const metricKey = body?.eventType === 'selectedComponent'
      ? 'selectedComponent'
      : body?.eventType === 'abandonedComponent'
        ? 'abandonedComponent'
        : ''

    if (!metricKey) {
      return { status: 422, data: { message: 'Unknown layout metric event', connection }, cookies: cookieHeaders }
    }

    incrementLayoutMetric(metricKey, storeSource)
    return {
      status: 202,
      data: {
        ok: true,
        eventType: metricKey,
        counters: buildLayoutMetricsSummary(storeSource),
      },
      cookies: cookieHeaders,
    }
  }

  if (pathName === '/api/auth/session') {
    if (!sessionRecord) return { status: 401, data: { message: 'No auth session', nextAction: 'login-required' }, cookies: cookieHeaders }

    const payload = clone(sessionRecord.payload)
    if (payload?.verifiedAt && payload.nextAction === 'verify-email') {
      payload.nextAction = resolvePostBlockerNextAction(payload, 'verify-email')
      payload.status = 'ready'
      payload.statusLabel = '이메일 인증 완료'
      saveSessionRecord(sessionId, {
        userEmail: sessionRecord.userEmail,
        payload,
        savedAt: new Date().toISOString(),
        expiresAt: sessionRecord.expiresAt,
      }, storeSource)
    }

    return { status: 200, data: payload, cookies: cookieHeaders }
  }

  if (pathName === '/api/auth/pending') {
    const pending = handoffId ? readPendingRecord(handoffId, storeSource) : null
    if (!pending) return { status: 404, data: { message: 'No scaffold auth handoff', nextAction: 'login-required' }, cookies: cookieHeaders }
    return { status: 200, data: clone(pending), cookies: cookieHeaders }
  }

  if (pathName === '/api/auth/verification/callback') {
    const verificationId = body.verificationId ?? null
    const status = body.status ?? 'verified'
    const verification = finalizeVerificationRequest(verificationId, { status, storeSource })

    if (!verification) {
      return { status: 404, data: { message: 'Verification not found', nextAction: 'verify-email', connection, actionConnection }, cookies: cookieHeaders }
    }

    return {
      status: 200,
      data: {
        ok: true,
        verificationId: verification.id,
        status: verification.status,
        completedAt: verification.completedAt ?? null,
      },
      cookies: cookieHeaders,
    }
  }

  if (pathName === '/api/auth/logout') {
    if (sessionId) deleteSessionRecord(sessionId, storeSource)
    if (handoffCookie) deletePendingRecord(handoffCookie, storeSource)
    cookieHeaders.push(serializeCookie(sessionCookieName, '', { ...cookieOptions, maxAge: 0 }))
    cookieHeaders.push(serializeCookie(handoffCookieName, '', { ...cookieOptions, maxAge: 0 }))
    return { status: 200, data: { ok: true, nextAction: 'login-required', connection, actionConnection }, cookies: cookieHeaders }
  }

  if (pathName === '/api/auth/signup') {
    const email = normalizeEmail(body.email)
    if (!email || !email.includes('@') || typeof body.password !== 'string' || body.password.trim().length < 8) {
      return { status: 422, data: { message: 'Invalid signup payload', handoffId, nextAction: 'retry-signup', resumeToken: handoffId ? `${handoffId}:retry` : null, connection, actionConnection }, cookies: cookieHeaders }
    }
    if (readUser(email, storeSource)) {
      return { status: 409, data: { message: 'Account already exists', handoffId, nextAction: 'retry-login', resumeToken: handoffId ? `${handoffId}:login` : null, connection, actionConnection }, cookies: cookieHeaders }
    }
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
    if (displayName.length < 2) {
      return { status: 422, data: { message: 'Display name required', handoffId, nextAction: 'retry-signup', resumeToken: handoffId ? `${handoffId}:retry` : null, connection, actionConnection }, cookies: cookieHeaders }
    }

    saveUser(buildUser({ email, password: body.password, name: displayName }), storeSource)
    if (handoffId) deletePendingRecord(handoffId, storeSource)

    return {
      status: 200,
      data: buildSignupSuccessPayload({
        email,
        displayName,
        handoffId,
        connection,
        actionConnection,
      }),
      cookies: cookieHeaders,
    }
  }

  if (pathName === '/api/auth/login') {
    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''
    const user = readUser(email, storeSource)

    if (!user || !verifyPassword(password, user.password)) {
      return { status: 401, data: { message: 'Invalid credentials', handoffId, nextAction: 'retry-login', resumeToken: handoffId ? `${handoffId}:retry` : null, connection, actionConnection }, cookies: cookieHeaders }
    }

    if (!isPasswordHash(user.password)) {
      user.password = ensureStoredPassword(password)
      saveUser(user, storeSource)
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
      if (handoffId) savePendingRecord(handoffId, pending, {}, storeSource)
      if (handoffId) cookieHeaders.push(serializeCookie(handoffCookieName, handoffId, { ...cookieOptions, maxAge: authHandoffMaxAgeSeconds }))
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
    saveUser(user, storeSource)
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
    saveSessionRecord(newSessionId, {
      userEmail: email,
      payload,
      savedAt: new Date().toISOString(),
      expiresAt: addSecondsToTimestamp(new Date().toISOString(), authSessionMaxAgeSeconds),
    }, storeSource)
    if (handoffId) deletePendingRecord(handoffId, storeSource)
    cookieHeaders.push(serializeCookie(sessionCookieName, newSessionId, { ...cookieOptions, maxAge: authSessionMaxAgeSeconds }))
    cookieHeaders.push(serializeCookie(handoffCookieName, handoffId ?? '', { ...cookieOptions, maxAge: handoffId ? authHandoffMaxAgeSeconds : 0 }))
    return { status: 200, data: payload, cookies: cookieHeaders }
  }

  if (pathName === '/api/auth/continue') {
    const effectiveHandoffId = handoffId ?? handoffCookie ?? null
    const pending = effectiveHandoffId ? readPendingRecord(effectiveHandoffId, storeSource) : null
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
      const user = readUser(pending.email, storeSource)
      if (!user) return { status: 404, data: { message: 'User not found', nextAction: 'login-required', connection, actionConnection }, cookies: cookieHeaders }
      mergeGuestDraftIntoAccount(user, pending.guestDraftSnapshot ?? null, mergeResolution)
      saveUser(user, storeSource)
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
      saveSessionRecord(newSessionId, {
        userEmail: user.email,
        payload,
        savedAt: new Date().toISOString(),
        expiresAt: addSecondsToTimestamp(new Date().toISOString(), authSessionMaxAgeSeconds),
      }, storeSource)
      deletePendingRecord(effectiveHandoffId, storeSource)
      cookieHeaders.push(serializeCookie(sessionCookieName, newSessionId, { ...cookieOptions, maxAge: authSessionMaxAgeSeconds }))
      cookieHeaders.push(serializeCookie(handoffCookieName, effectiveHandoffId, { ...cookieOptions, maxAge: authHandoffMaxAgeSeconds }))
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
      const user = readUser(sessionRecord.userEmail, storeSource)
      if (user) {
        user.profile = { displayName, phone }
        user.name = displayName
        saveUser(user, storeSource)
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
      const user = readUser(sessionRecord.userEmail, storeSource)
      const verifiedAt = new Date().toISOString()
      if (user) {
        user.verifiedAt = verifiedAt
        saveUser(user, storeSource)
      }
      payload.verifiedAt = user?.verifiedAt ?? verifiedAt
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

    const shouldPersistDraftSave = Boolean(body.draftSave)
      && ['save-layout-draft', 'resume-layout-checkout', 'resume-authenticated-flow'].includes(payload.nextAction)

    if (shouldPersistDraftSave) {
      const user = readUser(sessionRecord.userEmail, storeSource)
      if (user && applyDraftSaveToAccountState(user, body.draftSave)) {
        saveUser(user, storeSource)
        payload.accountState = clone(user.accountState)
      } else if (user) {
        payload.accountState = clone(user.accountState)
      }
    }

    saveSessionRecord(sessionId, {
      userEmail: sessionRecord.userEmail,
      payload,
      savedAt: new Date().toISOString(),
      expiresAt: sessionRecord.expiresAt,
    }, storeSource)
    return { status: 200, data: payload, cookies: cookieHeaders }
  }

  return { status: 404, data: { message: 'Not found' }, cookies: cookieHeaders }
}
