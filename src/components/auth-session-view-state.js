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

function resolveReadyPrimaryAction(nextAction, intentLabel, returnScreen) {
  switch (nextAction) {
    case 'save-layout-draft':
      return {
        primaryActionLabel: '보드 저장 이어가기',
        primaryActionHint: '로그인 후 저장하려던 배치 초안을 그대로 이어갈 수 있어요.',
      }
    case 'resume-layout-checkout':
      return {
        primaryActionLabel: '레이아웃 점검 이어가기',
        primaryActionHint: '백엔드가 요구한 다음 단계에 맞춰 레이아웃 화면으로 복귀할 수 있어요.',
      }
    case 'resume-guest-draft':
      return {
        primaryActionLabel: '게스트 초안 이어가기',
        primaryActionHint: '병합된 게스트 초안을 레이아웃 흐름에서 바로 이어 확인할 수 있어요.',
      }
    case 'resume-account-state':
      return {
        primaryActionLabel: '계정 상태로 이어가기',
        primaryActionHint: '계정 기준으로 복원된 보드와 저장 상태를 레이아웃 화면에서 확인할 수 있어요.',
      }
    case 'checkout-cart':
      return {
        primaryActionLabel: '주문 흐름 이어가기',
        primaryActionHint: '계정 장바구니 기준으로 다음 주문 단계를 이어갈 수 있어요.',
      }
    case 'complete-profile':
      return {
        primaryActionLabel: '프로필 준비 상태 확인',
        primaryActionHint: '백엔드 인증은 연결됐지만, 프로필 보완 단계가 아직 남아 있어요.',
      }
    default:
      return {
        primaryActionLabel: returnScreen ? `${intentLabel} 이어가기` : '계정 상태 확인',
        primaryActionHint: returnScreen
          ? '저장된 복귀 화면으로 돌아가 다음 작업을 이어갈 수 있어요.'
          : '현재 인증 연결 상태와 복원된 작업 정보를 확인할 수 있어요.',
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

  const { primaryActionLabel, primaryActionHint } = resolveReadyPrimaryAction(nextAction, intentLabel, returnScreen)

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
    connectionLabel: session.connection?.targetLabel ?? null,
    connectionEndpoint: session.connection?.endpoint ?? null,
    primaryActionLabel,
    primaryActionHint,
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
