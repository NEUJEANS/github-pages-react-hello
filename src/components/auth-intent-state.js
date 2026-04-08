function resolveNextActionScreen(nextAction) {
  switch (nextAction) {
    case 'save-layout-draft':
    case 'resume-layout-checkout':
    case 'resume-guest-draft':
    case 'resume-account-state':
      return 'layout'
    case 'checkout-cart':
      return 'home'
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

export function canResumePostAuthIntent(intent, fallbackScreen = null, continuation = null) {
  return Boolean(readReturnScreen(intent) || resolveNextActionScreen(readContinuationNextAction(continuation)) || fallbackScreen)
}

export function resolvePostAuthScreen(intent, fallbackScreen = null, continuation = null) {
  const returnScreen = readReturnScreen(intent)
  const continuationScreen = resolveNextActionScreen(readContinuationNextAction(continuation))

  return returnScreen || continuationScreen || fallbackScreen || null
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

  if (status === 'action-required') return false
  if (nextAction === 'complete-profile' || nextAction === 'verify-email') return false
  if (canResumePostAuthIntent(intent, null, continuation)) return false

  return true
}
