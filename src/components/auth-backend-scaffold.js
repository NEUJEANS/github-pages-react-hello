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

function buildScaffoldContinuation({ intent = null, mergeResolution = null, handoffId = null } = {}) {
  const normalizedAction = typeof intent?.action === 'string' ? intent.action.trim() : ''
  const fallbackAction = mergeResolution === 'replace-with-account'
    ? 'resume-account-state'
    : mergeResolution === 'keep-guest'
      ? 'resume-guest-draft'
      : 'resume-authenticated-flow'

  return {
    resumeToken: handoffId ? `${handoffId}:resume` : null,
    nextAction: normalizedAction || fallbackAction,
  }
}

function buildSessionData({ email, handoffId = null, guestDraftSnapshot = null, mergeResolution = null, intent = null } = {}) {
  const safeSessionId = email.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'guest'
  const continuation = buildScaffoldContinuation({ intent, mergeResolution, handoffId })

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
    ...continuation,
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

