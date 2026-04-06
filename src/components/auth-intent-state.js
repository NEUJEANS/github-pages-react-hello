export function resolvePostAuthScreen(intent, fallbackScreen = null) {
  const returnScreen = typeof intent?.returnScreen === 'string' ? intent.returnScreen.trim() : ''
  return returnScreen || fallbackScreen || null
}

export function shouldCloseLoginModalAfterAuth(result) {
  return Boolean(result?.ok)
}
