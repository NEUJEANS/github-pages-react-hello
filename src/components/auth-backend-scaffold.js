function normalizeEmail(email = '') {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function countItems(items) {
  return Array.isArray(items) ? items.length : 0
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

function buildAccountState({ mergeResolution } = {}) {
  if (mergeResolution !== 'replace-with-account') return null

  return {
    wishlistIds: [],
    cartItems: [],
    layoutItems: [],
    recommendationDraft: null,
  }
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
    default:
      return {
        status: null,
        statusLabel: null,
      }
  }
}

function buildScaffoldContinuation({ intent = null, mergeResolution = null, handoffId = null, continuation = null } = {}) {
  const normalizedAction = typeof intent?.action === 'string' ? intent.action.trim() : ''
  const continuationAction = typeof continuation?.nextAction === 'string' ? continuation.nextAction.trim() : ''
  const continuationToken = typeof continuation?.resumeToken === 'string' ? continuation.resumeToken.trim() : ''
  const fallbackAction = mergeResolution === 'replace-with-account'
    ? 'resume-account-state'
    : mergeResolution === 'keep-guest'
      ? 'resume-guest-draft'
      : 'resume-authenticated-flow'
  const nextAction = normalizedAction || continuationAction || fallbackAction

  return {
    resumeToken: continuationToken || (handoffId ? `${handoffId}:resume` : null),
    nextAction,
    ...buildContinuationStatus(nextAction, continuation),
  }
}

function buildSessionData({ email, handoffId = null, guestDraftSnapshot = null, mergeResolution = null, intent = null, continuation = null } = {}) {
  const safeSessionId = email.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'guest'
  const continuationState = buildScaffoldContinuation({
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
      name: email,
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
    intent: intent && typeof intent === 'object' ? { ...intent } : null,
    accountState: buildAccountState({ mergeResolution }),
    ...continuationState,
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

export function buildAuthScaffoldPendingHandoff({ request = {}, response = {}, connection = null, submittedAt = new Date().toISOString() } = {}) {
  const guestDraftSnapshot = request.guestDraftSnapshot ?? null
  const summary = buildGuestDraftSessionSummary(guestDraftSnapshot)
  const continuation = {
    resumeToken: response.data?.resumeToken ?? request.continuation?.resumeToken ?? null,
    nextAction: response.data?.nextAction ?? request.continuation?.nextAction ?? null,
    status: response.data?.status ?? request.continuation?.status ?? null,
    statusLabel: response.data?.statusLabel ?? request.continuation?.statusLabel ?? null,
  }

  return {
    submittedAt,
    handoffId: request.handoffId ?? null,
    endpoint: connection?.endpoint ?? '/api/auth/login',
    method: connection?.method ?? 'POST',
    email: request.email ?? null,
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
    continuation,
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

  if (!email || !email.includes('@') || password.trim().length < 8) {
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
        mergedGuestDraft: buildMergedGuestDraft(guestDraftSnapshot),
      },
    }
  }

  return {
    status: 200,
    data: buildSessionData({
      email,
      handoffId,
      guestDraftSnapshot,
      mergeResolution,
      intent: request.intent ?? null,
      continuation: request.continuation ?? null,
    }),
  }
}

