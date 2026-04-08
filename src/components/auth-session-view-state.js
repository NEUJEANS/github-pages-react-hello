function buildDraftContextBits(summary = null) {
  if (!summary) return []

  const bits = []
  if (summary.apartmentLabel) bits.push(summary.apartmentLabel)
  if (summary.selectedRoomCount > 0) bits.push(`공간 ${summary.selectedRoomCount}개`)
  if (summary.recommendationRoom) bits.push(`${summary.recommendationRoom} 추천`)
  return bits
}

function buildIntentCopy(intent) {
  if (!intent?.label && !intent?.draftLabel) return ''

  const label = intent.label ?? '로그인 이후 작업'
  const draftCopy = intent.draftLabel ? ` (${intent.draftLabel})` : ''
  return ` ${label}${draftCopy} 단계까지 이어서 진행할 수 있어요.`
}

function buildActionChecklist(nextAction, { resumeToken = null, connectionLabel = null, connectionEndpoint = null } = {}) {
  switch (nextAction) {
    case 'complete-profile':
      return {
        title: '프로필 보완 연결 준비',
        description: '백엔드가 추가 프로필 입력을 요구하는 상태예요. 아직 별도 화면은 없지만, 프론트가 어떤 계약으로 다음 단계를 이어야 하는지 바로 확인할 수 있어요.',
        items: [
          resumeToken ? `resume token ${resumeToken} 값을 유지한 채 다음 프로필 저장 요청으로 이어가기` : '다음 프로필 저장 요청에 resume token 이어붙이기',
          connectionLabel ? `현재 인증 연결 대상 ${connectionLabel}${connectionEndpoint ? ` (${connectionEndpoint})` : ''}를 그대로 사용하기` : '현재 인증 연결 대상을 그대로 유지하기',
          '닉네임 · 연락처 같은 프로필 필드를 직렬화 가능한 payload로 최소 구성하기',
        ],
      }
    case 'verify-email':
      return {
        title: '이메일 인증 연결 준비',
        description: '백엔드가 이메일 인증 단계를 기다리고 있어요. 실제 인증 화면이 붙기 전까지 필요한 handoff 계약을 먼저 노출합니다.',
        items: [
          resumeToken ? `resume token ${resumeToken} 으로 인증 확인 조회를 재개하기` : '이메일 인증 확인 조회에 resume token 전달하기',
          connectionLabel ? `현재 인증 연결 대상 ${connectionLabel}${connectionEndpoint ? ` (${connectionEndpoint})` : ''} 기준으로 폴링/재개 흐름 붙이기` : '현재 인증 연결 대상 기준으로 폴링/재개 흐름 붙이기',
          '인증 완료 전에는 로그인 모달을 닫지 않고 상태만 갱신하기',
        ],
      }
    default:
      return null
  }
}

function resolveReadyPrimaryAction(nextAction, intentLabel, returnScreen) {
  switch (nextAction) {
    case 'save-layout-draft':
      return {
        primaryActionLabel: '보드 저장 이어가기',
        primaryActionHint: '로그인 후 저장하려던 배치 초안을 그대로 이어갈 수 있어요.',
        primaryActionDisabled: false,
      }
    case 'resume-layout-checkout':
      return {
        primaryActionLabel: '레이아웃 점검 이어가기',
        primaryActionHint: '백엔드가 요구한 다음 단계에 맞춰 레이아웃 화면으로 복귀할 수 있어요.',
        primaryActionDisabled: false,
      }
    case 'resume-guest-draft':
      return {
        primaryActionLabel: '게스트 초안 이어가기',
        primaryActionHint: '병합된 게스트 초안을 레이아웃 흐름에서 바로 이어 확인할 수 있어요.',
        primaryActionDisabled: false,
      }
    case 'resume-account-state':
      return {
        primaryActionLabel: '계정 상태로 이어가기',
        primaryActionHint: '계정 기준으로 복원된 보드와 저장 상태를 레이아웃 화면에서 확인할 수 있어요.',
        primaryActionDisabled: false,
      }
    case 'checkout-cart':
      return {
        primaryActionLabel: '주문 흐름 이어가기',
        primaryActionHint: '계정 장바구니 기준으로 다음 주문 단계를 이어갈 수 있어요.',
        primaryActionDisabled: false,
      }
    case 'complete-profile':
      return {
        primaryActionLabel: '프로필 보완 계약 보기',
        primaryActionHint: '백엔드 인증은 연결됐고, 다음 checkpoint에서 프로필 입력 화면을 붙일 수 있도록 재개 계약을 먼저 노출해요.',
        primaryActionDisabled: true,
      }
    case 'verify-email':
      return {
        primaryActionLabel: '이메일 인증 계약 보기',
        primaryActionHint: '이메일 인증 화면 연결 전에도 어떤 token과 상태를 이어야 하는지 바로 확인할 수 있어요.',
        primaryActionDisabled: true,
      }
    default:
      return {
        primaryActionLabel: returnScreen ? `${intentLabel} 이어가기` : '계정 상태 확인',
        primaryActionHint: returnScreen
          ? '저장된 복귀 화면으로 돌아가 다음 작업을 이어갈 수 있어요.'
          : '현재 인증 연결 상태와 복원된 작업 정보를 확인할 수 있어요.',
        primaryActionDisabled: false,
      }
  }
}

export function buildAuthReadyPanelState(session = null) {
  if (!session?.accountLabel) return null

  const restoredBits = []
  if ((session.restoredWishlistCount ?? 0) > 0) restoredBits.push(`찜 ${session.restoredWishlistCount}개`)
  if ((session.restoredCartCount ?? 0) > 0) restoredBits.push(`장바구니 ${session.restoredCartCount}개`)
  if ((session.restoredLayoutItemCount ?? 0) > 0) restoredBits.push(`배치 ${session.restoredLayoutItemCount}개`)
  if (session.restoredRecommendationDraft) restoredBits.push('추천 초안')

  const draftContextBits = buildDraftContextBits(session.guestDraftSummary)
  const intentLabel = session.intent?.label ?? '저장한 작업'
  const intentDraftLabel = session.intent?.draftLabel ?? null
  const nextAction = session.continuation?.nextAction ?? null
  const resumeToken = session.continuation?.resumeToken ?? null
  const continuationStatus = session.continuation?.status ?? null
  const continuationStatusLabel = session.continuation?.statusLabel ?? null
  const returnScreen = session.intent?.returnScreen ?? null

  const title = `${session.accountLabel} 계정 연결됨`
  const subtitle = session.mergeMode === 'merged'
    ? '게스트 초안을 계정에 이어붙인 상태예요.'
    : session.mergeMode === 'replaced'
      ? '계정 상태로 전환된 상태예요.'
      : '현재 로그인 연결이 유지되고 있어요.'

  const connectionLabel = session.connection?.targetLabel ?? null
  const connectionEndpoint = session.connection?.endpoint ?? null
  const { primaryActionLabel, primaryActionHint, primaryActionDisabled } = resolveReadyPrimaryAction(nextAction, intentLabel, returnScreen)
  const actionChecklist = buildActionChecklist(nextAction, {
    resumeToken,
    connectionLabel,
    connectionEndpoint,
  })

  return {
    title,
    subtitle,
    restoredBits,
    draftContextBits,
    accountLabel: session.accountLabel,
    handoffId: session.handoffId ?? null,
    sessionId: session.sessionId ?? null,
    mergeMode: session.mergeMode ?? null,
    intentLabel,
    intentDraftLabel,
    nextAction,
    resumeToken,
    continuationStatus,
    continuationStatusLabel,
    returnScreen,
    connectionLabel,
    connectionEndpoint,
    primaryActionLabel,
    primaryActionHint,
    primaryActionDisabled,
    actionChecklist,
  }
}

export function buildAuthSessionNotice(session) {
  if (!session?.accountLabel) return null

  const restoredBits = []
  if ((session.restoredWishlistCount ?? 0) > 0) restoredBits.push(`찜 ${session.restoredWishlistCount}개`)
  if ((session.restoredCartCount ?? 0) > 0) restoredBits.push(`장바구니 ${session.restoredCartCount}개`)
  if ((session.restoredLayoutItemCount ?? 0) > 0) restoredBits.push(`배치 ${session.restoredLayoutItemCount}개`)
  if (session.restoredRecommendationDraft) restoredBits.push('추천 초안')

  const draftContextBits = buildDraftContextBits(session.guestDraftSummary)

  const mergeLabel = session.mergeMode === 'merged'
    ? '게스트 초안을 계정에 이어붙였어요.'
    : session.mergeMode === 'replaced'
      ? '계정 상태로 전환했어요.'
      : session.mergeMode
        ? `병합 상태 ${session.mergeMode}로 연결했어요.`
        : '계정 연결이 준비됐어요.'

  const draftContextCopy = draftContextBits.length
    ? ` ${draftContextBits.join(' · ')} 기준으로 이어졌어요.`
    : ''
  const handoffCopy = session.handoffId ? ` handoff ${session.handoffId} 기준으로 이어졌어요.` : ''
  const transportCopy = session.authMode === 'scaffold'
    ? ` ${session.authTransport === 'same-origin-middleware' ? '현재는 same-origin scaffold 응답으로 연결 상태를 확인 중이에요.' : '현재는 local scaffold로 연결 흐름을 유지하고 있어요.'}`
    : ''
  const connectionCopy = session.connection?.targetLabel
    ? ` 로그인 요청 대상은 ${session.connection.targetLabel}${session.connection.endpoint ? ` (${session.connection.endpoint})` : ''}로 기록해뒀어요.`
    : ''
  const intentCopy = buildIntentCopy(session.intent)

  return {
    title: `${session.accountLabel} 계정 연결됨`,
    body: restoredBits.length
      ? `${mergeLabel}${draftContextCopy}${handoffCopy}${transportCopy}${connectionCopy}${intentCopy} ${restoredBits.join(' · ')} 복원 내용을 이번 세션에 반영했어요.`.trim()
      : `${mergeLabel}${draftContextCopy}${handoffCopy}${transportCopy}${connectionCopy}${intentCopy}`.trim(),
    restoredBits,
    draftContextBits,
  }
}
