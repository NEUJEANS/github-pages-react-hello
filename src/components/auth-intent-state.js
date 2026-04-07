function resolveNextActionScreen(nextAction) {
  switch (nextAction) {
    case 'save-layout-draft':
    case 'resume-layout-checkout':
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

export function shouldCloseLoginModalAfterAuth(result) {
  return Boolean(result?.ok)
}
