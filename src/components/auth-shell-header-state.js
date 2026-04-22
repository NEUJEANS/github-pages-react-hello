export function buildShellHeaderSearchState(screen = 'home') {
  switch (screen) {
    case 'layout':
      return {
        label: '보드 가구 검색',
        helper: '레이아웃 보드에서 바로 배치할 가구를 찾아보세요.',
        targetScreen: 'layout',
      }
    case 'beds':
      return {
        label: '카탈로그 검색',
        helper: '가구 카테고리와 상품을 빠르게 찾을 수 있어요.',
        targetScreen: 'beds',
      }
    case 'home':
    default:
      return {
        label: '가구 탐색 시작',
        helper: '추천 가구와 카탈로그를 바로 둘러보세요.',
        targetScreen: 'beds',
      }
  }
}

export function buildShellAccountIdentity(authSession = null) {
  const rawLabel = authSession?.accountState?.profile?.displayName
    ?? authSession?.accountLabel
    ?? authSession?.accountState?.profile?.name
    ?? authSession?.accountState?.profile?.email
    ?? authSession?.accountState?.email
    ?? '회원'
  const label = typeof rawLabel === 'string' && rawLabel.trim() ? rawLabel.trim() : '회원'
  const initialSource = Array.from(label)[0] ?? '회'

  return {
    label,
    initial: initialSource.toUpperCase(),
    subtitle: authSession?.savedAt ? '로그인됨' : '계정 메뉴',
  }
}

export function buildShellAccountMenuActions({
  authSession = null,
  hasRestorableLayout = false,
} = {}) {
  if (!authSession) return []

  const actions = [
    {
      id: 'account',
      label: '계정 상태 보기',
      description: '현재 로그인 상태와 이어질 작업을 확인합니다.',
    },
  ]

  if (hasRestorableLayout) {
    actions.push({
      id: 'restore-layout',
      label: '저장 보드 불러오기',
      description: '계정에 저장된 레이아웃 보드를 다시 적용합니다.',
    })
  }

  actions.push({
    id: 'logout',
    label: '로그아웃',
    description: '현재 계정 연결을 해제합니다.',
    tone: 'danger',
  })

  return actions
}

export function shouldReloadAfterLoginSuccess(result, mode = 'login') {
  return mode === 'login'
    && Boolean(result?.ok)
    && Boolean(result?.data?.sessionId)
}
