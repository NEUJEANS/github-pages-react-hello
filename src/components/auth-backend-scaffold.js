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

function buildSessionData({ email, handoffId = null, guestDraftSnapshot = null, mergeResolution = null, intent = null } = {}) {
  const safeSessionId = email.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'guest'

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
  }
}

export function buildAuthScaffoldSessionResponse(session = null) {
  if (!session) {
    return {
      status: 401,
      data: {
        message: 'No scaffold auth session',
      },
    }
  }

  return {
    status: 200,
    data: session,
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
    }),
  }
}

