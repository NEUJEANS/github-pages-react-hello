function resolveNextActionScreen(nextAction, fallbackScreen = null) {
  switch (nextAction) {
    case 'save-layout-draft':
    case 'resume-layout-checkout':
    case 'resume-guest-draft':
    case 'resume-account-state':
      return 'layout'
    case 'checkout-cart':
      return 'home'
    case 'resume-authenticated-flow':
    case 'complete-profile':
    case 'verify-email':
    case 'confirm-merge-resolution':
      return fallbackScreen || null
    default:
      return null
  }
}

function readContinuationNextAction(continuation = null) {
  return typeof continuation?.nextAction === 'string' ? continuation.nextAction.trim() : ''
}

function readReturnScreen(intent = null) {
  return typeof intent?.returnScreen === 'string' ? intent.returnScreen.trim() : ''
}

function readIntentAction(intent = null) {
  return typeof intent?.action === 'string' ? intent.action.trim() : ''
}

export function shouldAttachDraftSaveToAuthContinuation(intent = null, continuation = null) {
  const intentAction = readIntentAction(intent)

  if ([
    'save-layout-draft',
    'resume-layout-checkout',
    'resume-guest-draft',
    'resume-account-state',
  ].includes(intentAction)) {
    return true
  }

  return shouldSubmitContinuationBeforeResume(continuation)
}

export function canResumePostAuthIntent(intent, fallbackScreen = null, continuation = null) {
  return Boolean(readReturnScreen(intent) || resolveNextActionScreen(readContinuationNextAction(continuation), fallbackScreen))
}

export function resolvePostAuthScreen(intent, fallbackScreen = null, continuation = null) {
  const returnScreen = readReturnScreen(intent)
  const continuationScreen = resolveNextActionScreen(readContinuationNextAction(continuation), fallbackScreen)

  return returnScreen || continuationScreen || fallbackScreen || null
}

export function shouldSubmitContinuationBeforeResume(continuation = null) {
  const nextAction = readContinuationNextAction(continuation)

  return [
    'save-layout-draft',
    'resume-layout-checkout',
    'resume-guest-draft',
    'resume-account-state',
    'checkout-cart',
  ].includes(nextAction)
}

export function shouldOpenCartAfterAuthResume(intent = null, continuation = null) {
  return readIntentAction(intent) === 'checkout-cart' || readContinuationNextAction(continuation) === 'checkout-cart'
}

export function shouldAutoResumeReadyAuthModal(intent = null, continuation = null) {
  const intentAction = readIntentAction(intent)
  const nextAction = readContinuationNextAction(continuation)
  const status = typeof continuation?.status === 'string' ? continuation.status.trim() : ''

  if (status !== 'ready') return false
  if (!['save-layout-draft', 'resume-layout-checkout', 'resume-guest-draft', 'resume-account-state'].includes(nextAction)) return false

  return [
    'save-layout-draft',
    'resume-layout-checkout',
    'resume-guest-draft',
    'resume-account-state',
  ].includes(intentAction) || !intentAction
}

function readContinuationAction(result) {
  return typeof result?.data?.nextAction === 'string' ? result.data.nextAction.trim() : ''
}

function readContinuationStatus(result) {
  return typeof result?.data?.status === 'string' ? result.data.status.trim() : ''
}

export function shouldCloseLoginModalAfterAuth(result, intent = null, continuationOverride = null) {
  if (!result?.ok) return false

  const nextAction = readContinuationAction(result)
  const status = readContinuationStatus(result)
  const continuation = continuationOverride ?? result?.data ?? null
  const intentAction = readIntentAction(intent)
  const isPassiveLoginIntent = intentAction === 'login'
  const hasFollowThroughTarget = canResumePostAuthIntent(intent, null, continuation)

  if (status === 'action-required') return false
  if (nextAction === 'complete-profile' || nextAction === 'verify-email' || nextAction === 'confirm-merge-resolution') return false
  if (hasFollowThroughTarget && !isPassiveLoginIntent) return false

  return true
}
