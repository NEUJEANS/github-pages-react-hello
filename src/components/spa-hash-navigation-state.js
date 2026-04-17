export const screenMeta = {
  layout: { column: 1, step: 0 },
  beds: { column: 2, step: 0 },
  home: { column: 2, step: 1 },
}

export function parseHashState(hashValue) {
  const hash = hashValue.replace(/^#/, '')
  if (!hash) return { screen: 'home', overlay: null }
  if (hash === 'address') return { screen: 'layout', overlay: null }
  if (hash === 'space' || hash === 'ai') return { screen: 'home', overlay: null }
  if (screenMeta[hash]) return { screen: hash, overlay: null }
  return { screen: 'home', overlay: null }
}

export function getScreenMeta(screen) {
  return screenMeta[screen] ?? screenMeta.home
}

export function getDirectionalTransition(fromScreen, toScreen) {
  if (fromScreen === toScreen) return 0

  const from = getScreenMeta(fromScreen)
  const to = getScreenMeta(toScreen)

  if (to.column === 0) return -1
  if (to.column === 2) return 1
  if (from.column !== to.column) return to.column > from.column ? 1 : -1
  if (from.step !== to.step) return to.step > from.step ? 1 : -1
  return 0
}

export function buildNavigationHash(nextScreen, nextOverlay) {
  return nextOverlay === 'address' ? 'layout' : nextScreen
}
