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

export function resolvePostAuthScreen(intent, fallbackScreen = null, continuation = null) {
  const returnScreen = typeof intent?.returnScreen === 'string' ? intent.returnScreen.trim() : ''
  const continuationScreen = resolveNextActionScreen(
    typeof continuation?.nextAction === 'string' ? continuation.nextAction.trim() : '',
  )

  return returnScreen || continuationScreen || fallbackScreen || null
}

function readContinuationAction(result) {
  return typeof result?.data?.nextAction === 'string' ? result.data.nextAction.trim() : ''
}

function readContinuationStatus(result) {
  return typeof result?.data?.status === 'string' ? result.data.status.trim() : ''
}

export function shouldCloseLoginModalAfterAuth(result) {
  if (!result?.ok) return false

  const nextAction = readContinuationAction(result)
  const status = readContinuationStatus(result)

  if (status === 'action-required') return false
  if (nextAction === 'complete-profile' || nextAction === 'verify-email') return false

  return true
}
