import {
  buildSerializableAuthContinuationFields,
  buildSerializableAuthIntent,
} from './auth-storage.js'

const initialAuthContinuationFields = {
  displayName: '',
  phone: '',
  verificationCode: '',
  mergeResolution: '',
}

export function buildAuthContinuationFieldState(fields = null) {
  return {
    ...initialAuthContinuationFields,
    ...(buildSerializableAuthContinuationFields(fields) ?? {}),
  }
}

export function pickPersistedAuthContinuationFields(continuation = null, fields = null) {
  const nextAction = typeof continuation?.nextAction === 'string' ? continuation.nextAction.trim() : ''
  if (nextAction !== 'complete-profile' && nextAction !== 'verify-email' && nextAction !== 'confirm-merge-resolution') return null
  return buildSerializableAuthContinuationFields(fields)
}

export function buildEmptyLoginForm(intent = null) {
  return {
    mode: 'login',
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
    agreeToTerms: false,
    handoffId: null,
    status: 'idle',
    result: null,
    mergeResolution: null,
    intent: buildSerializableAuthIntent(intent),
    connection: null,
  }
}

export function buildAuthSessionResultSummary(session = null) {
  if (!session) return null

  return {
    accountLabel: session.accountLabel ?? null,
    sessionId: session.sessionId ?? null,
    handoffId: session.handoffId ?? null,
    mergeMode: session.mergeMode ?? null,
    mergedDraftCount: session.mergedDraftCount ?? 0,
    restoredWishlistCount: session.restoredWishlistCount ?? 0,
    restoredCartCount: session.restoredCartCount ?? 0,
    restoredLayoutItemCount: session.restoredLayoutItemCount ?? 0,
    restoredRecommendationDraft: Boolean(session.restoredRecommendationDraft),
    wishlistCount: session.wishlistCount ?? 0,
    cartCount: session.cartCount ?? 0,
    layoutItemCount: session.layoutItemCount ?? 0,
    hasRecommendationDraft: Boolean(session.hasRecommendationDraft),
    guestDraftSummary: session.guestDraftSummary ?? null,
    draftSave: session.draftSave ?? null,
    intent: session.intent ?? null,
    connection: session.connection ?? null,
    resumeToken: session.continuation?.resumeToken ?? null,
    nextAction: session.continuation?.nextAction ?? null,
    continuationStatus: session.continuation?.status ?? null,
    continuationStatusLabel: session.continuation?.statusLabel ?? null,
    authMode: session.authMode ?? 'remote',
    authTransport: session.authTransport ?? 'network',
  }
}
