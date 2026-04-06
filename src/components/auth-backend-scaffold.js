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

  if (password === 'merge-conflict' && mergeResolution !== 'keep-guest') {
    return {
      status: 409,
      data: {
        message: 'Guest draft merge confirmation required',
        allowedMergeResolution: 'keep-guest',
        ...(handoffId ? { handoffId } : {}),
        mergedGuestDraft: buildMergedGuestDraft(guestDraftSnapshot),
      },
    }
  }

  const safeSessionId = email.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'guest'

  return {
    status: 200,
    data: {
      ok: true,
      sessionId: `demo-${safeSessionId}`,
      ...(handoffId ? { handoffId } : {}),
      user: {
        email,
        name: email,
      },
      mergedGuestDraft: buildMergedGuestDraft(guestDraftSnapshot, {
        mode: mergeResolution === 'keep-guest' ? 'merge-confirmed' : 'merged',
        resolution: mergeResolution,
      }),
    },
  }
}
