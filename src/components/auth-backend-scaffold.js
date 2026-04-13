function normalizeEmail(email = '') {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function countItems(items) {
  return Array.isArray(items) ? items.length : 0
}

const AUTH_SCAFFOLD_ACCOUNT_DB_KEY = 'havenly.auth.scaffold.accounts'

function cloneValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

function readAccountDb() {
  const storage = globalThis?.localStorage
  if (!storage?.getItem) return {}

  try {
    const raw = storage.getItem(AUTH_SCAFFOLD_ACCOUNT_DB_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAccountDb(db = {}) {
  const storage = globalThis?.localStorage
  if (!storage?.setItem) return

  try {
    storage.setItem(AUTH_SCAFFOLD_ACCOUNT_DB_KEY, JSON.stringify(db))
  } catch {}
}

function readAccountRecord(email = '') {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return null

  const db = readAccountDb()
  return db[normalizedEmail] ? cloneValue(db[normalizedEmail]) : null
}

function persistAccountRecord(email, account = null) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !account || typeof account !== 'object') return null

  const db = readAccountDb()
  db[normalizedEmail] = cloneValue(account)
  writeAccountDb(db)
  return cloneValue(db[normalizedEmail])
}

function buildMergedGuestAccountState(guestDraftSnapshot = null, persistedAccountState = null, { mergeResolution } = {}) {
  const continuity = guestDraftSnapshot?.continuity ?? {}
  const baseState = persistedAccountState && typeof persistedAccountState === 'object'
    ? cloneValue(persistedAccountState)
    : {
        wishlistIds: [],
        cartItems: [],
        layoutItems: [],
        recommendationDraft: null,
      }

  if (mergeResolution === 'replace-with-account') return baseState

  return {
    wishlistIds: Array.isArray(continuity.wishlistIds) && continuity.wishlistIds.length > 0
      ? [...continuity.wishlistIds]
      : [...(baseState.wishlistIds ?? [])],
    cartItems: Array.isArray(continuity.cartItems) && continuity.cartItems.length > 0
      ? continuity.cartItems.map((item) => ({ ...item }))
      : (baseState.cartItems ?? []).map((item) => ({ ...item })),
    layoutItems: Array.isArray(continuity.layoutItems) && continuity.layoutItems.length > 0
      ? continuity.layoutItems.map((item) => ({ ...item }))
      : (baseState.layoutItems ?? []).map((item) => ({ ...item })),
    recommendationDraft: guestDraftSnapshot?.recommendationDraft
      ? { ...guestDraftSnapshot.recommendationDraft }
      : (baseState.recommendationDraft ? { ...baseState.recommendationDraft } : null),
  }
}

function buildMergedGuestDraft(guestDraftSnapshot = null, { mode = 'merged', resolution = null } = {}) {
  const continuity = guestDraftSnapshot?.continuity ?? {}

  return {
    mode,
    resolution,
    count: countItems(continuity.layoutItems),
    wishlistCount: countItems(continuity.wishlistIds),
    cartCount: countItems(continuity.cartItems),
    layoutItemCount: countItems(continuity.layoutItems),
    recommendationDraftRestored: Boolean(guestDraftSnapshot?.recommendationDraft),
  }
}

function buildAccountState({ mergeResolution, guestDraftSnapshot = null, persistedAccountState = null } = {}) {
  return buildMergedGuestAccountState(guestDraftSnapshot, persistedAccountState, { mergeResolution })
}

function readMergeResolution(value = null) {
  return value === 'keep-guest' || value === 'replace-with-account'
    ? value
    : null
}

function buildGuestDraftSessionSummary(guestDraftSnapshot = null) {
  if (!guestDraftSnapshot) return null

  const continuity = guestDraftSnapshot.continuity ?? {}
  const selectedRooms = Array.isArray(continuity.selectedRooms)
    ? [...continuity.selectedRooms]
    : []

  return {
    apartmentLabel: continuity.apartmentLabel ?? null,
    selectedRoomCount: selectedRooms.length,
    selectedRooms,
    selectedSpaceIds: Array.isArray(guestDraftSnapshot.spaceProfile?.spaces)
      ? [...guestDraftSnapshot.spaceProfile.spaces]
      : [],
    recommendationRoom: guestDraftSnapshot.recommendationDraft?.room ?? null,
    wishlistCount: countItems(continuity.wishlistIds),
    cartCount: countItems(continuity.cartItems),
    layoutItemCount: countItems(continuity.layoutItems),
  }
}

function buildContinuationStatus(nextAction, continuation = null) {
  const explicitStatus = typeof continuation?.status === 'string' ? continuation.status.trim() : ''
  const explicitStatusLabel = typeof continuation?.statusLabel === 'string' ? continuation.statusLabel.trim() : ''

  if (explicitStatus || explicitStatusLabel) {
    return {
      status: explicitStatus || null,
      statusLabel: explicitStatusLabel || null,
    }
  }

  switch (nextAction) {
    case 'complete-profile':
      return {
        status: 'action-required',
        statusLabel: '프로필 보완 필요',
      }
    case 'verify-email':
      return {
        status: 'action-required',
        statusLabel: '이메일 인증 필요',
      }
    case 'confirm-merge-resolution':
      return {
        status: 'action-required',
        statusLabel: '초안 병합 방향 확인 필요',
      }
    default:
      return {
        status: null,
        statusLabel: null,
      }
  }
}

function resolvePostBlockerNextAction(session = null, blockerAction = '', requestIntent = null) {
  const currentNextAction = typeof session?.nextAction === 'string' ? session.nextAction.trim() : ''
  if (currentNextAction && currentNextAction !== blockerAction) return currentNextAction

  const requestIntentAction = normalizeIntentAction(typeof requestIntent?.action === 'string' ? requestIntent.action.trim() : '')
  if (requestIntentAction && requestIntentAction !== blockerAction) return requestIntentAction

  const intentAction = normalizeIntentAction(typeof session?.intent?.action === 'string' ? session.intent.action.trim() : '')
  if (intentAction && intentAction !== blockerAction) return intentAction

  return 'resume-authenticated-flow'
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

function buildScaffoldContinuation({ email = '', intent = null, mergeResolution = null, handoffId = null, continuation = null } = {}) {
  const normalizedAction = normalizeIntentAction(typeof intent?.action === 'string' ? intent.action.trim() : '')
  const continuationAction = typeof continuation?.nextAction === 'string' ? continuation.nextAction.trim() : ''
  const continuationToken = typeof continuation?.resumeToken === 'string' ? continuation.resumeToken.trim() : ''
  const fallbackAction = mergeResolution === 'replace-with-account'
    ? 'resume-account-state'
    : mergeResolution === 'keep-guest'
      ? 'resume-guest-draft'
      : 'resume-authenticated-flow'
  const demoBlockerAction = resolveDemoAuthBlocker(email)
  const nextAction = normalizedAction || continuationAction || demoBlockerAction || fallbackAction

  return {
    resumeToken: continuationToken || (handoffId ? `${handoffId}:resume` : null),
    nextAction,
    ...buildContinuationStatus(nextAction, continuation),
  }
}

function buildScaffoldActionConnection(connection = null) {
  const credentialsMode = typeof connection?.credentialsMode === 'string' && connection.credentialsMode.trim()
    ? connection.credentialsMode.trim()
    : 'include'
  const source = typeof connection?.source === 'string' && connection.source.trim()
    ? connection.source.trim()
    : 'default'

  return {
    method: 'POST',
    endpoint: '/api/auth/continue',
    resolvedUrl: '/api/auth/continue',
    targetLabel: 'same-origin /api auth scaffold',
    isExternal: false,
    isSameOriginScaffold: true,
    credentialsMode,
    source,
  }
}

function buildDraftSaveState(request = {}, guestDraftSnapshot = null) {
  const requestDraftSave = request?.draftSave && typeof request.draftSave === 'object' && !Array.isArray(request.draftSave)
    ? request.draftSave
    : null
  const continuity = guestDraftSnapshot?.continuity ?? {}
  const layoutItems = Array.isArray(requestDraftSave?.layoutItems)
    ? requestDraftSave.layoutItems.map((item) => ({ ...item }))
    : (Array.isArray(continuity.layoutItems)
      ? continuity.layoutItems.map((item) => ({ ...item }))
      : [])
  const selectedSpaceIds = Array.isArray(requestDraftSave?.selectedSpaceIds)
    ? [...requestDraftSave.selectedSpaceIds]
    : (Array.isArray(guestDraftSnapshot?.spaceProfile?.spaces)
      ? [...guestDraftSnapshot.spaceProfile.spaces]
      : [])

  if (!requestDraftSave && !layoutItems.length && !selectedSpaceIds.length && !continuity.apartmentLabel && !guestDraftSnapshot?.recommendationDraft?.room) {
    return null
  }

  return {
    draftLabel: requestDraftSave?.draftLabel ?? continuity.apartmentLabel ?? null,
    apartmentLabel: requestDraftSave?.apartmentLabel ?? continuity.apartmentLabel ?? null,
    recommendationRoom: requestDraftSave?.recommendationRoom ?? guestDraftSnapshot?.recommendationDraft?.room ?? null,
    selectedSpaceIds,
    layoutItems,
    layoutItemCount: Array.isArray(layoutItems) ? layoutItems.length : 0,
  }
}

function buildSessionData({ email, handoffId = null, guestDraftSnapshot = null, mergeResolution = null, intent = null, continuation = null, draftSave = null, name = null } = {}) {
  const safeSessionId = email.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'guest'
  const persistedAccount = readAccountRecord(email)
  const continuationState = buildScaffoldContinuation({
    email,
    intent,
    mergeResolution,
    handoffId,
    continuation,
  })

  return {
    ok: true,
    sessionId: `demo-${safeSessionId}`,
    ...(handoffId ? { handoffId } : {}),
    user: {
      email,
      name: typeof name === 'string' && name.trim() ? name.trim() : (persistedAccount?.user?.name ?? email),
    },
    mergedGuestDraft: buildMergedGuestDraft(guestDraftSnapshot, {
      mode: mergeResolution === 'keep-guest'
        ? 'merge-confirmed'
        : mergeResolution === 'replace-with-account'
          ? 'replaced'
          : 'merged',
      resolution: mergeResolution,
    }),
    guestDraftSummary: buildGuestDraftSessionSummary(guestDraftSnapshot),
    draftSave: buildDraftSaveState({ draftSave }, guestDraftSnapshot),
    intent: intent && typeof intent === 'object' ? { ...intent } : null,
    profile: cloneValue(persistedAccount?.profile ?? null),
    verifiedAt: persistedAccount?.verifiedAt ?? null,
    accountState: buildAccountState({
      mergeResolution,
      guestDraftSnapshot,
      persistedAccountState: persistedAccount?.accountState ?? null,
    }),
    ...continuationState,
  }
}

const scaffoldState = {
  session: null,
  pending: null,
}

function mergeRequestContinuation(request = {}, response = {}) {
  return {
    ...(request.continuation ?? {}),
    resumeToken: response.data?.resumeToken ?? request.continuation?.resumeToken ?? null,
    nextAction: response.data?.nextAction ?? request.continuation?.nextAction ?? null,
    status: response.data?.status ?? request.continuation?.status ?? null,
    statusLabel: response.data?.statusLabel ?? request.continuation?.statusLabel ?? null,
  }
}

export function resetAuthScaffoldState() {
  scaffoldState.session = null
  scaffoldState.pending = null
}

export function submitAuthScaffoldRequest({ request = {}, connection = null, actionConnection = null, submittedAt = new Date().toISOString() } = {}) {
  const requestConnection = request?.connection && typeof request.connection === 'object' && !Array.isArray(request.connection)
    ? cloneValue(request.connection)
    : null
  const response = buildAuthScaffoldResponse(request)
  const resolvedConnection = cloneValue(connection ?? requestConnection)
  const resolvedActionConnection = cloneValue(actionConnection ?? buildScaffoldActionConnection(resolvedConnection))

  if (response.status >= 200 && response.status < 300) {
    const persistedAccount = persistAccountRecord(response.data?.user?.email ?? request.email, {
      user: cloneValue(response.data?.user ?? null),
      profile: cloneValue(response.data?.profile ?? null),
      verifiedAt: response.data?.verifiedAt ?? null,
      accountState: cloneValue(response.data?.accountState ?? null),
    })

    scaffoldState.session = {
      ...cloneValue(response.data),
      ...(persistedAccount ? {
        profile: cloneValue(persistedAccount.profile ?? null),
        verifiedAt: persistedAccount.verifiedAt ?? null,
        accountState: cloneValue(persistedAccount.accountState ?? response.data?.accountState ?? null),
      } : {}),
      connection: resolvedConnection,
      actionConnection: resolvedActionConnection,
    }
    scaffoldState.pending = null

    return {
      status: response.status,
      data: cloneValue(scaffoldState.session),
    }
  }

  if (request.handoffId || request.email) {
    scaffoldState.pending = buildAuthScaffoldPendingHandoff({
      submittedAt,
      request: {
        ...cloneValue(request),
        continuation: mergeRequestContinuation(request, response),
      },
      response,
      connection: resolvedConnection,
      actionConnection: resolvedActionConnection,
    })
  }

  return {
    status: response.status,
    data: cloneValue(response.data),
  }
}

export function readAuthScaffoldSession() {
  return buildAuthScaffoldSessionResponse(cloneValue(scaffoldState.session))
}

export function readAuthScaffoldPending() {
  return buildAuthScaffoldPendingResponse(cloneValue(scaffoldState.pending))
}

export function submitAuthScaffoldContinuation({ request = {}, connection = null, actionConnection = null } = {}) {
  const continuation = request.continuation ?? {}
  const nextAction = typeof continuation.nextAction === 'string' ? continuation.nextAction.trim() : ''
  const resumeToken = typeof continuation.resumeToken === 'string' ? continuation.resumeToken.trim() : ''
  const fields = request.fields && typeof request.fields === 'object' && !Array.isArray(request.fields)
    ? request.fields
    : null
  const requestIntent = request.intent && typeof request.intent === 'object' && !Array.isArray(request.intent)
    ? cloneValue(request.intent)
    : null
  const pendingSession = cloneValue(scaffoldState.pending)
  const currentSession = cloneValue(scaffoldState.session)
  const mergeResolution = readMergeResolution(fields?.mergeResolution)
  const resolvedActionConnection = cloneValue(actionConnection ?? currentSession?.actionConnection ?? pendingSession?.actionConnection ?? buildScaffoldActionConnection(connection ?? currentSession?.connection ?? pendingSession?.connection ?? null))

  if (!currentSession) {
    if (nextAction === 'confirm-merge-resolution' && pendingSession) {
      if (!mergeResolution) {
        return {
          status: 422,
          data: {
            message: 'Merge resolution required',
            handoffId: request.handoffId ?? pendingSession.handoffId ?? null,
            resumeToken: resumeToken || pendingSession.continuation?.resumeToken || null,
            nextAction: 'confirm-merge-resolution',
            allowedMergeResolutions: ['keep-guest', 'replace-with-account'],
            ...(connection ?? pendingSession.connection ? { connection: cloneValue(connection ?? pendingSession.connection) } : {}),
            ...(resolvedActionConnection ? { actionConnection: cloneValue(resolvedActionConnection) } : {}),
          },
        }
      }

      const resumedIntent = requestIntent ?? cloneValue(pendingSession.summary?.intent ?? pendingSession.request?.intent ?? null)
      const resumedRequest = {
        ...(cloneValue(pendingSession.request) ?? {}),
        handoffId: request.handoffId ?? pendingSession.handoffId ?? null,
        mergeResolution,
        intent: resumedIntent,
        ...(request.draftSave ? { draftSave: cloneValue(request.draftSave) } : {}),
        continuation: {
          ...(cloneValue(pendingSession.continuation) ?? {}),
          ...cloneValue(continuation),
          nextAction: normalizeIntentAction(
            typeof resumedIntent?.action === 'string' ? resumedIntent.action.trim() : '',
          ) || nextAction || 'resume-authenticated-flow',
          status: 'ready',
          statusLabel: mergeResolution === 'replace-with-account' ? '계정 상태로 전환 준비 완료' : '게스트 초안 병합 준비 완료',
        },
      }
      const resumedResponse = buildAuthScaffoldResponse(resumedRequest)

      if (resumedResponse.status >= 200 && resumedResponse.status < 300) {
        scaffoldState.session = {
          ...cloneValue(resumedResponse.data),
          connection: cloneValue(connection ?? pendingSession.connection ?? null),
          actionConnection: cloneValue(resolvedActionConnection),
        }
        scaffoldState.pending = null

        return {
          status: resumedResponse.status,
          data: cloneValue(scaffoldState.session),
        }
      }

      scaffoldState.pending = buildAuthScaffoldPendingHandoff({
        request: resumedRequest,
        response: resumedResponse,
        connection: cloneValue(connection ?? pendingSession.connection ?? null),
        actionConnection: cloneValue(resolvedActionConnection),
      })

      return {
        status: resumedResponse.status,
        data: cloneValue(resumedResponse.data),
      }
    }

    return {
      status: 401,
      data: {
        message: 'No scaffold auth session',
        nextAction: 'login-required',
        ...(connection ? { connection } : {}),
        ...(resolvedActionConnection ? { actionConnection: resolvedActionConnection } : {}),
      },
    }
  }

  const sessionConnection = cloneValue(currentSession.connection ?? connection ?? null)
  const sessionActionConnection = cloneValue(currentSession.actionConnection ?? resolvedActionConnection)

  if (nextAction === 'complete-profile') {
    const displayName = typeof fields?.displayName === 'string' ? fields.displayName.trim() : ''
    const phone = typeof fields?.phone === 'string' ? fields.phone.trim() : ''

    if (!displayName || !phone) {
      return {
        status: 422,
        data: {
          message: 'Profile completion fields required',
          handoffId: request.handoffId ?? currentSession.handoffId ?? null,
          resumeToken: resumeToken || null,
          nextAction: 'complete-profile',
          status: 'action-required',
          statusLabel: '프로필 보완 필요',
          ...(sessionConnection ? { connection: sessionConnection } : {}),
          ...(sessionActionConnection ? { actionConnection: sessionActionConnection } : {}),
        },
      }
    }

    const nextProfile = {
      displayName,
      phone,
    }
    const persistedAccount = persistAccountRecord(currentSession.user?.email ?? '', {
      user: {
        ...(currentSession.user ?? {}),
        name: displayName || currentSession.user?.name || currentSession.user?.email,
      },
      profile: nextProfile,
      verifiedAt: currentSession.verifiedAt ?? null,
      accountState: cloneValue(currentSession.accountState ?? null),
    })

    const nextSession = {
      ...currentSession,
      ...(requestIntent ? { intent: requestIntent } : {}),
      ...(request.draftSave ? { draftSave: buildDraftSaveState(request) } : {}),
      user: cloneValue(persistedAccount?.user ?? currentSession.user ?? null),
      profile: nextProfile,
      resumeToken: resumeToken || currentSession.resumeToken || null,
      nextAction: resolvePostBlockerNextAction(currentSession, 'complete-profile', requestIntent),
      status: 'ready',
      statusLabel: '프로필 준비 완료',
      connection: sessionConnection,
      actionConnection: sessionActionConnection,
    }
    scaffoldState.session = nextSession
    return {
      status: 200,
      data: cloneValue(nextSession),
    }
  }

  if (nextAction === 'verify-email') {
    const verificationCode = typeof fields?.verificationCode === 'string' ? fields.verificationCode.trim() : ''
    if (!verificationCode) {
      return {
        status: 202,
        data: {
          ...currentSession,
          handoffId: request.handoffId ?? currentSession.handoffId ?? null,
          resumeToken: resumeToken || currentSession.resumeToken || null,
          nextAction: 'verify-email',
          status: 'action-required',
          statusLabel: '이메일 인증 필요',
          ...(sessionConnection ? { connection: sessionConnection } : {}),
          ...(sessionActionConnection ? { actionConnection: sessionActionConnection } : {}),
        },
      }
    }

    const verifiedAt = new Date().toISOString()
    persistAccountRecord(currentSession.user?.email ?? '', {
      user: cloneValue(currentSession.user ?? null),
      profile: cloneValue(currentSession.profile ?? null),
      verifiedAt,
      accountState: cloneValue(currentSession.accountState ?? null),
    })

    const nextSession = {
      ...currentSession,
      ...(requestIntent ? { intent: requestIntent } : {}),
      ...(request.draftSave ? { draftSave: buildDraftSaveState(request) } : {}),
      verifiedAt,
      resumeToken: resumeToken || currentSession.resumeToken || null,
      nextAction: resolvePostBlockerNextAction(currentSession, 'verify-email', requestIntent),
      status: 'ready',
      statusLabel: '이메일 인증 완료',
      connection: sessionConnection,
      actionConnection: sessionActionConnection,
    }
    scaffoldState.session = nextSession
    return {
      status: 200,
      data: cloneValue(nextSession),
    }
  }

  return {
    status: 200,
    data: {
      ...currentSession,
      ...(requestIntent ? { intent: requestIntent } : {}),
      ...(request.draftSave ? { draftSave: buildDraftSaveState(request) } : {}),
      handoffId: request.handoffId ?? currentSession.handoffId ?? null,
      resumeToken: resumeToken || currentSession.resumeToken || null,
      nextAction: nextAction || currentSession.nextAction || normalizeIntentAction(typeof requestIntent?.action === 'string' ? requestIntent.action.trim() : '') || 'resume-authenticated-flow',
      ...(sessionConnection ? { connection: sessionConnection } : {}),
      ...(sessionActionConnection ? { actionConnection: sessionActionConnection } : {}),
    },
  }
}

export function signOutAuthScaffoldSession() {
  const connection = cloneValue(scaffoldState.session?.connection ?? scaffoldState.pending?.connection ?? null)
  const actionConnection = cloneValue(scaffoldState.session?.actionConnection ?? scaffoldState.pending?.actionConnection ?? null)
  resetAuthScaffoldState()

  return {
    status: 200,
    data: {
      ok: true,
      nextAction: 'login-required',
      ...(connection ? { connection } : {}),
      ...(actionConnection ? { actionConnection } : {}),
    },
  }
}

export function buildAuthScaffoldSessionResponse(session = null) {
  if (!session) {
    return {
      status: 401,
      data: {
        message: 'No scaffold auth session',
        nextAction: 'login-required',
      },
    }
  }

  return {
    status: 200,
    data: session,
  }
}

export function buildAuthScaffoldPendingHandoff({ request = {}, response = {}, connection = null, actionConnection = null, submittedAt = new Date().toISOString() } = {}) {
  const guestDraftSnapshot = request.guestDraftSnapshot ?? null
  const summary = buildGuestDraftSessionSummary(guestDraftSnapshot)
  const continuation = {
    resumeToken: response.data?.resumeToken ?? request.continuation?.resumeToken ?? null,
    nextAction: response.data?.nextAction ?? request.continuation?.nextAction ?? null,
    status: response.data?.status ?? request.continuation?.status ?? null,
    statusLabel: response.data?.statusLabel ?? request.continuation?.statusLabel ?? null,
  }
  const continuationFields = request.fields && typeof request.fields === 'object' && !Array.isArray(request.fields)
    ? cloneValue(request.fields)
    : null
  const draftSave = request.draftSave && typeof request.draftSave === 'object' && !Array.isArray(request.draftSave)
    ? buildDraftSaveState(request, guestDraftSnapshot)
    : null

  return {
    submittedAt,
    handoffId: request.handoffId ?? null,
    endpoint: connection?.endpoint ?? '/api/auth/login',
    method: connection?.method ?? 'POST',
    email: request.email ?? null,
    request: cloneValue(request),
    summary: {
      email: request.email ?? null,
      handoffId: request.handoffId ?? null,
      wishlistCount: summary?.wishlistCount ?? 0,
      cartCount: summary?.cartCount ?? 0,
      layoutItemCount: summary?.layoutItemCount ?? 0,
      hasRecommendationDraft: Boolean(guestDraftSnapshot?.recommendationDraft),
      mergeResolution: request.mergeResolution ?? null,
      intent: request.intent ?? null,
    },
    connection,
    actionConnection: actionConnection ?? buildScaffoldActionConnection(connection),
    continuation,
    continuationFields,
    draftSave,
    guestDraftSnapshot,
    guestDraftSummary: summary,
    allowedMergeResolutions: response.data?.allowedMergeResolutions ?? null,
    error: response.data?.message ?? null,
    status: response.status ?? null,
  }
}

export function buildAuthScaffoldPendingResponse(pending = null) {
  if (!pending) {
    return {
      status: 404,
      data: {
        message: 'No scaffold auth handoff',
        nextAction: 'login-required',
      },
    }
  }

  return {
    status: 200,
    data: pending,
  }
}

export function buildAuthScaffoldResponse(request = {}) {
  const email = normalizeEmail(request.email)
  const password = typeof request.password === 'string' ? request.password : ''
  const guestDraftSnapshot = request.guestDraftSnapshot ?? null
  const mergeResolution = typeof request.mergeResolution === 'string' ? request.mergeResolution : null
  const handoffId = typeof request.handoffId === 'string' ? request.handoffId.trim() : null
  const mode = request.mode === 'signup' ? 'signup' : 'login'
  const displayName = typeof request.displayName === 'string' ? request.displayName.trim() : ''
  const persistedAccount = readAccountRecord(email)

  if (!email || !email.includes('@') || password.trim().length < 8) {
    return {
      status: 401,
      data: {
        message: mode === 'signup' ? 'Invalid signup payload' : 'Invalid credentials',
        ...(handoffId ? { handoffId } : {}),
        resumeToken: handoffId ? `${handoffId}:retry` : null,
        nextAction: mode === 'signup' ? 'retry-signup' : 'retry-login',
      },
    }
  }

  if (mode === 'signup') {
    if (displayName.length < 2) {
      return {
        status: 422,
        data: {
          message: 'Display name required',
          ...(handoffId ? { handoffId } : {}),
          resumeToken: handoffId ? `${handoffId}:retry` : null,
          nextAction: 'retry-signup',
        },
      }
    }

    if (persistedAccount || email === 'existing@example.com' || email === 'user@example.com') {
      return {
        status: 409,
        data: {
          message: 'Account already exists',
          ...(handoffId ? { handoffId } : {}),
          resumeToken: handoffId ? `${handoffId}:login` : null,
          nextAction: 'retry-login',
        },
      }
    }
  }

  if (mode === 'login' && persistedAccount?.password && persistedAccount.password !== password && password !== 'merge-conflict') {
    return {
      status: 401,
      data: {
        message: 'Invalid credentials',
        ...(handoffId ? { handoffId } : {}),
        resumeToken: handoffId ? `${handoffId}:retry` : null,
        nextAction: 'retry-login',
      },
    }
  }

  if (password === 'merge-conflict' && !['keep-guest', 'replace-with-account'].includes(mergeResolution)) {
    return {
      status: 409,
      data: {
        message: 'Guest draft merge confirmation required',
        allowedMergeResolution: 'keep-guest',
        allowedMergeResolutions: ['keep-guest', 'replace-with-account'],
        ...(handoffId ? { handoffId } : {}),
        resumeToken: handoffId ? `${handoffId}:merge` : null,
        nextAction: 'confirm-merge-resolution',
        ...buildContinuationStatus('confirm-merge-resolution'),
        mergedGuestDraft: buildMergedGuestDraft(guestDraftSnapshot),
      },
    }
  }

  const userName = mode === 'signup'
    ? displayName
    : (persistedAccount?.user?.name ?? email)
  persistAccountRecord(email, {
    password,
    user: {
      email,
      name: userName,
    },
    profile: cloneValue(persistedAccount?.profile ?? null),
    verifiedAt: persistedAccount?.verifiedAt ?? null,
    accountState: buildMergedGuestAccountState(guestDraftSnapshot, persistedAccount?.accountState ?? null, { mergeResolution }),
  })

  return {
    status: 200,
    data: buildSessionData({
      email,
      handoffId,
      guestDraftSnapshot,
      mergeResolution,
      intent: request.intent ?? null,
      continuation: request.continuation ?? null,
      draftSave: request.draftSave ?? null,
      name: mode === 'signup' ? displayName : null,
    }),
  }
}
