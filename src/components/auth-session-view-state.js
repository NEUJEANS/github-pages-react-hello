function buildDraftContextBits(summary = null) {
  if (!summary) return []

  const bits = []
  if (summary.apartmentLabel) bits.push(summary.apartmentLabel)
  if (summary.selectedRoomCount > 0) bits.push(`공간 ${summary.selectedRoomCount}개`)
  if (summary.recommendationRoom) bits.push(`${summary.recommendationRoom} 추천`)
  return bits
}

function buildDraftSaveBits(draftSave = null) {
  if (!draftSave) return []

  const bits = []
  if (draftSave.draftLabel) bits.push(`초안 ${draftSave.draftLabel}`)
  if (draftSave.apartmentLabel && draftSave.apartmentLabel !== draftSave.draftLabel) bits.push(draftSave.apartmentLabel)
  if (draftSave.recommendationRoom) bits.push(`${draftSave.recommendationRoom} 추천`)
  if (Array.isArray(draftSave.selectedSpaceIds) && draftSave.selectedSpaceIds.length > 0) {
    bits.push(`선택 공간 ${draftSave.selectedSpaceIds.length}개`)
  }
  if ((draftSave.layoutItemCount ?? 0) > 0) bits.push(`저장 배치 ${draftSave.layoutItemCount}개`)
  return bits
}

function buildIntentCopy(intent) {
  if (!intent?.label && !intent?.draftLabel) return ''

  const label = intent.label ?? '로그인 이후 작업'
  const draftCopy = intent.draftLabel ? ` (${intent.draftLabel})` : ''
  return ` ${label}${draftCopy} 단계까지 이어서 진행할 수 있어요.`
}

function buildSubmitPayloadPreview(authSummary = null, connection = null) {
  if (!authSummary && !connection) return null

  const payloadKeys = ['email', 'password', 'handoffId']
  const expectedResponseKeys = ['handoffId', 'sessionId', 'user', 'connection']

  if ((authSummary?.wishlistCount ?? 0) > 0 || (authSummary?.cartCount ?? 0) > 0 || (authSummary?.layoutItemCount ?? 0) > 0 || authSummary?.hasRecommendationDraft) {
    payloadKeys.push('guestDraftSnapshot')
    expectedResponseKeys.push('guestDraftSummary', 'mergedGuestDraft')
  }
  if (authSummary?.mergeResolution) payloadKeys.push('mergeResolution')
  if (authSummary?.intent) {
    payloadKeys.push('intent')
    expectedResponseKeys.push('intent')
  }
  if (authSummary?.continuation) payloadKeys.push('continuation')
  if (authSummary?.draftSave) {
    payloadKeys.push('draftSave')
    expectedResponseKeys.push('draftSave')
  }
  if (connection) payloadKeys.push('connection')

  expectedResponseKeys.push('resumeToken', 'nextAction')

  return {
    endpoint: connection?.endpoint ?? '/api/auth/login',
    targetLabel: connection?.targetLabel ?? null,
    payloadKeys,
    expectedResponseKeys,
    handoffId: authSummary?.handoffId ?? null,
    draftSaveLayoutItemCount: authSummary?.draftSave?.layoutItemCount ?? 0,
    draftSaveSelectedSpaceCount: Array.isArray(authSummary?.draftSave?.selectedSpaceIds) ? authSummary.draftSave.selectedSpaceIds.length : 0,
    wishlistCount: authSummary?.wishlistCount ?? 0,
    cartCount: authSummary?.cartCount ?? 0,
    layoutItemCount: authSummary?.layoutItemCount ?? 0,
  }
}

function buildActionPayloadPreview(nextAction, { resumeToken = null, handoffId = null, connectionLabel = null, connectionEndpoint = null, continuationEndpoint = null, draftSave = null } = {}) {
  const payloadKeys = ['continuation', 'handoffId']
  const fieldKeys = []
  const expectedResponseKeys = ['handoffId', 'sessionId', 'user', 'connection', 'resumeToken', 'nextAction', 'status', 'statusLabel']

  if (resumeToken) payloadKeys.push('resumeToken')
  if (draftSave) {
    payloadKeys.push('draftSave')
    expectedResponseKeys.push('draftSave')
  }

  switch (nextAction) {
    case 'complete-profile':
      fieldKeys.push('displayName', 'phone')
      break
    case 'verify-email':
      fieldKeys.push('verificationCode')
      break
    case 'confirm-merge-resolution':
      fieldKeys.push('mergeResolution')
      break
    default:
      break
  }

  const normalizedContinuationEndpoint = continuationEndpoint ?? '/api/auth/continue'

  if (!handoffId && !resumeToken && !fieldKeys.length && !draftSave && !connectionEndpoint && !connectionLabel && !normalizedContinuationEndpoint) return null

  return {
    continuationEndpoint: normalizedContinuationEndpoint,
    connectionEndpoint: connectionEndpoint ?? null,
    targetLabel: connectionLabel ?? null,
    handoffId: handoffId ?? null,
    resumeToken: resumeToken ?? null,
    payloadKeys,
    fieldKeys,
    expectedResponseKeys,
    draftSaveLayoutItemCount: draftSave?.layoutItemCount ?? 0,
    draftSaveSelectedSpaceCount: Array.isArray(draftSave?.selectedSpaceIds) ? draftSave.selectedSpaceIds.length : 0,
  }
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
    case 'confirm-merge-resolution':
      return {
        title: '초안 병합 방향 확정 준비',
        description: '백엔드가 게스트 초안과 계정 상태 중 어떤 기준으로 이어갈지 다시 확인하고 있어요. 새로 로그인하지 않고 같은 handoff 계약으로 병합 방향만 확정할 수 있어요.',
        items: [
          resumeToken ? `resume token ${resumeToken} 과 함께 선택한 mergeResolution 값을 그대로 재개 요청에 실어 보내기` : '선택한 mergeResolution 값을 재개 요청에 포함하기',
          connectionLabel ? `현재 인증 연결 대상 ${connectionLabel}${connectionEndpoint ? ` (${connectionEndpoint})` : ''} 기준으로 같은 handoff를 이어가기` : '현재 인증 연결 대상 기준으로 같은 handoff를 이어가기',
          '확정 전에는 게스트 초안과 계정 상태를 모두 유지한 채 병합 방향만 선택하기',
        ],
      }
    default:
      return null
  }
}

function buildContinuationSubtitle(nextAction = null, mergeMode = null) {
  switch (nextAction) {
    case 'complete-profile':
      return '로그인은 연결됐지만 프로필 보완이 남아 있어요.'
    case 'verify-email':
      return '로그인은 연결됐지만 이메일 인증 확인이 남아 있어요.'
    case 'confirm-merge-resolution':
      return '로그인은 연결됐지만 초안 병합 방향 확인이 남아 있어요.'
    default:
      return mergeMode === 'merged'
        ? '게스트 초안을 계정에 이어붙인 상태예요.'
        : mergeMode === 'replaced'
          ? '계정 상태로 전환된 상태예요.'
          : '현재 로그인 연결이 유지되고 있어요.'
  }
}

function buildContinuationNoticeCopy(nextAction = null, statusLabel = null) {
  const explicitLabel = typeof statusLabel === 'string' ? statusLabel.trim() : ''

  if (explicitLabel) return ` 현재 단계: ${explicitLabel}.`

  switch (nextAction) {
    case 'complete-profile':
      return ' 현재 단계: 프로필 보완 필요.'
    case 'verify-email':
      return ' 현재 단계: 이메일 인증 필요.'
    case 'confirm-merge-resolution':
      return ' 현재 단계: 초안 병합 방향 확인 필요.'
    default:
      return ''
  }
}

function resolveReadyPrimaryAction(nextAction, intentLabel, returnScreen, mergeResolution = null) {
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
        primaryActionLabel: '프로필 보완 제출',
        primaryActionHint: '백엔드가 요구한 최소 프로필 payload를 바로 제출하고, blocker가 풀리면 원래 로그인 목적 흐름으로 이어갈 수 있어요.',
        primaryActionDisabled: false,
      }
    case 'verify-email':
      return {
        primaryActionLabel: '이메일 인증 확인',
        primaryActionHint: '인증 코드를 바로 제출하고, backend가 준비 완료를 돌려주면 원래 이어가려던 흐름으로 복귀할 수 있어요.',
        primaryActionDisabled: false,
      }
    case 'confirm-merge-resolution':
      return {
        primaryActionLabel: mergeResolution === 'keep-guest'
          ? '현재 초안으로 계속'
          : mergeResolution === 'replace-with-account'
            ? '계정 상태로 계속'
            : '병합 방향 확정',
        primaryActionHint: mergeResolution === 'keep-guest'
          ? '현재 게스트 초안을 유지한 채 `/api/auth/continue` 재개 요청을 보내면, backend가 같은 handoff를 이어서 다음 상태를 돌려줄 수 있어요.'
          : mergeResolution === 'replace-with-account'
            ? '계정에 저장된 상태를 기준으로 `/api/auth/continue` 재개 요청을 보내면, backend가 같은 handoff를 이어서 다음 상태를 돌려줄 수 있어요.'
            : '선택한 병합 기준으로 `/api/auth/continue` 재개 요청을 보내면, backend가 같은 handoff를 이어서 다음 상태를 돌려줄 수 있어요.',
        primaryActionDisabled: false,
      }
    case 'resume-authenticated-flow':
      return {
        primaryActionLabel: returnScreen ? `${intentLabel} 이어가기` : '현재 흐름으로 돌아가기',
        primaryActionHint: returnScreen
          ? '백엔드 scaffold가 현재 인증 handoff를 확인했어요. 저장된 복귀 화면에서 바로 이어갈 수 있어요.'
          : '백엔드 scaffold가 현재 인증 handoff를 확인했어요. 로그인 모달을 닫고 지금 보던 흐름으로 돌아갈 수 있어요.',
        primaryActionDisabled: false,
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

function shouldUseContinuationConnection(nextAction = null) {
  return nextAction === 'complete-profile' || nextAction === 'verify-email' || nextAction === 'confirm-merge-resolution'
}

export function buildAuthLoginPanelState({
  authSummary = null,
  connection = null,
  intent = null,
} = {}) {
  const draftSaveBits = buildDraftSaveBits(authSummary?.draftSave ?? null)

  return {
    handoffId: authSummary?.handoffId ?? null,
    connectionLabel: connection?.targetLabel ?? null,
    connectionEndpoint: connection?.endpoint ?? null,
    connectionSource: connection?.source ?? null,
    connectionCredentialsMode: connection?.credentialsMode ?? null,
    intentLabel: intent?.label ?? null,
    intentDraftLabel: intent?.draftLabel ?? null,
    draftSaveBits,
    submitPayloadPreview: buildSubmitPayloadPreview({
      ...authSummary,
      intent,
    }, connection),
  }
}

export function buildAuthGuardPanelState({
  engagement = null,
  reasons = [],
  guestDraftSnapshot = null,
  authSummary = null,
  connection = null,
  intent = null,
} = {}) {
  const normalizedReasons = Array.isArray(reasons)
    ? reasons.filter((reason) => typeof reason === 'string' && reason.trim())
    : []
  const draftContextBits = buildDraftContextBits(buildGuestDraftSummary(guestDraftSnapshot))
  const draftSaveBits = buildDraftSaveBits(authSummary?.draftSave ?? null)

  return {
    reasonCount: normalizedReasons.length,
    reasons: normalizedReasons,
    aiRequests: engagement?.aiRequests ?? 0,
    furniturePlacements: engagement?.furniturePlacements ?? 0,
    draftBoards: engagement?.draftBoards ?? 0,
    wishlistCount: authSummary?.wishlistCount ?? engagement?.wishlistCount ?? 0,
    cartCount: authSummary?.cartCount ?? engagement?.cartCount ?? 0,
    layoutItemCount: authSummary?.layoutItemCount ?? 0,
    selectedSpaceCount: Array.isArray(guestDraftSnapshot?.spaceProfile?.spaces)
      ? guestDraftSnapshot.spaceProfile.spaces.length
      : 0,
    recommendationRoom: guestDraftSnapshot?.recommendationDraft?.room ?? null,
    handoffId: authSummary?.handoffId ?? null,
    connectionLabel: connection?.targetLabel ?? null,
    connectionEndpoint: connection?.endpoint ?? null,
    connectionSource: connection?.source ?? null,
    connectionCredentialsMode: connection?.credentialsMode ?? null,
    intentLabel: intent?.label ?? null,
    intentDraftLabel: intent?.draftLabel ?? null,
    draftContextBits,
    draftSaveBits,
    submitPayloadPreview: buildSubmitPayloadPreview({
      ...authSummary,
      intent,
    }, connection),
  }
}

function buildGuestDraftSummary(guestDraftSnapshot = null) {
  if (!guestDraftSnapshot) return null

  return {
    apartmentLabel: guestDraftSnapshot?.continuity?.apartmentLabel ?? null,
    selectedRoomCount: Array.isArray(guestDraftSnapshot?.continuity?.selectedRooms)
      ? guestDraftSnapshot.continuity.selectedRooms.length
      : 0,
    recommendationRoom: guestDraftSnapshot?.recommendationDraft?.room ?? null,
  }
}

function buildAuthContinuationPanelState({
  accountLabel = null,
  handoffId = null,
  sessionId = null,
  mergeMode = null,
  restoredWishlistCount = 0,
  restoredCartCount = 0,
  restoredLayoutItemCount = 0,
  restoredRecommendationDraft = false,
  intent = null,
  continuation = null,
  continuationFields = null,
  connection = null,
  guestDraftSummary = null,
  draftSave = null,
} = {}, { actionConnection = null } = {}) {
  if (!accountLabel) return null

  const restoredBits = []
  if ((restoredWishlistCount ?? 0) > 0) restoredBits.push(`찜 ${restoredWishlistCount}개`)
  if ((restoredCartCount ?? 0) > 0) restoredBits.push(`장바구니 ${restoredCartCount}개`)
  if ((restoredLayoutItemCount ?? 0) > 0) restoredBits.push(`배치 ${restoredLayoutItemCount}개`)
  if (restoredRecommendationDraft) restoredBits.push('추천 초안')

  const draftContextBits = buildDraftContextBits(guestDraftSummary)
  const draftSaveBits = buildDraftSaveBits(draftSave)
  const intentLabel = intent?.label ?? '저장한 작업'
  const intentDraftLabel = intent?.draftLabel ?? null
  const nextAction = continuation?.nextAction ?? null
  const resumeToken = continuation?.resumeToken ?? null
  const continuationStatus = continuation?.status ?? null
  const continuationStatusLabel = continuation?.statusLabel ?? null
  const returnScreen = intent?.returnScreen ?? null
  const mergeResolution = typeof continuationFields?.mergeResolution === 'string'
    ? continuationFields.mergeResolution.trim()
    : null

  const title = `${accountLabel} 계정 연결됨`
  const subtitle = buildContinuationSubtitle(nextAction, mergeMode)

  const preferredConnection = shouldUseContinuationConnection(nextAction) && actionConnection
    ? actionConnection
    : connection
  const connectionLabel = preferredConnection?.targetLabel ?? null
  const connectionEndpoint = preferredConnection?.endpoint ?? null
  const { primaryActionLabel, primaryActionHint, primaryActionDisabled } = resolveReadyPrimaryAction(nextAction, intentLabel, returnScreen, mergeResolution)
  const actionChecklist = buildActionChecklist(nextAction, {
    resumeToken,
    connectionLabel,
    connectionEndpoint,
  })
  const actionPayloadPreview = buildActionPayloadPreview(nextAction, {
    resumeToken,
    handoffId: handoffId ?? null,
    connectionLabel,
    connectionEndpoint,
    continuationEndpoint: shouldUseContinuationConnection(nextAction)
      ? (actionConnection?.endpoint ?? null)
      : null,
    draftSave: draftSave ?? null,
  })

  return {
    title,
    subtitle,
    restoredBits,
    draftContextBits,
    draftSaveBits,
    accountLabel,
    handoffId: handoffId ?? null,
    sessionId: sessionId ?? null,
    mergeMode: mergeMode ?? null,
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
    actionPayloadPreview,
  }
}

export function buildAuthReadyPanelState(session = null, { actionConnection = null } = {}) {
  if (!session?.accountLabel) return null

  return buildAuthContinuationPanelState({
    accountLabel: session.accountLabel,
    handoffId: session.handoffId ?? null,
    sessionId: session.sessionId ?? null,
    mergeMode: session.mergeMode ?? null,
    restoredWishlistCount: session.restoredWishlistCount ?? 0,
    restoredCartCount: session.restoredCartCount ?? 0,
    restoredLayoutItemCount: session.restoredLayoutItemCount ?? 0,
    restoredRecommendationDraft: session.restoredRecommendationDraft ?? false,
    intent: session.intent ?? null,
    continuation: session.continuation ?? null,
    continuationFields: session.continuationFields ?? null,
    connection: session.connection ?? null,
    guestDraftSummary: session.guestDraftSummary ?? null,
    draftSave: session.draftSave ?? null,
  }, { actionConnection: actionConnection ?? session.actionConnection ?? null })
}

export function buildAuthResumePanelState(handoff = null, { session = null, actionConnection = null } = {}) {
  const continuation = handoff?.continuation ?? session?.continuation ?? null
  const nextAction = continuation?.nextAction ?? null
  const isActionRequired = nextAction === 'complete-profile' || nextAction === 'verify-email' || nextAction === 'confirm-merge-resolution'

  if (!handoff || !isActionRequired) return null

  return buildAuthContinuationPanelState({
    accountLabel: handoff.email ?? session?.accountLabel ?? '로그인 재개',
    handoffId: handoff.handoffId ?? handoff.summary?.handoffId ?? session?.handoffId ?? null,
    sessionId: session?.sessionId ?? null,
    mergeMode: session?.mergeMode ?? null,
    restoredWishlistCount: session?.restoredWishlistCount ?? 0,
    restoredCartCount: session?.restoredCartCount ?? 0,
    restoredLayoutItemCount: session?.restoredLayoutItemCount ?? 0,
    restoredRecommendationDraft: session?.restoredRecommendationDraft ?? false,
    intent: handoff.summary?.intent ?? session?.intent ?? null,
    continuation,
    continuationFields: handoff.continuationFields ?? session?.continuationFields ?? null,
    connection: handoff.connection ?? session?.connection ?? null,
    guestDraftSummary: handoff.guestDraftSummary ?? handoff.summary ?? session?.guestDraftSummary ?? null,
    draftSave: handoff.draftSave ?? session?.draftSave ?? null,
  }, { actionConnection: actionConnection ?? handoff?.actionConnection ?? session?.actionConnection ?? null })
}

export function shouldAutoOpenAuthReadyPanel(session = null, modalState = 'closed') {
  if (modalState !== 'closed') return false
  if (!session?.accountLabel) return false

  const nextAction = session.continuation?.nextAction ?? null
  const status = session.continuation?.status ?? null
  const statusLabel = typeof session.continuation?.statusLabel === 'string' ? session.continuation.statusLabel.trim() : ''

  return status === 'action-required'
    || nextAction === 'complete-profile'
    || nextAction === 'verify-email'
    || nextAction === 'confirm-merge-resolution'
    || (status === 'ready' && nextAction === 'resume-authenticated-flow' && /인증 완료/.test(statusLabel))
}

export function buildAuthSessionNotice(session) {
  if (!session?.accountLabel) return null

  const restoredBits = []
  if ((session.restoredWishlistCount ?? 0) > 0) restoredBits.push(`찜 ${session.restoredWishlistCount}개`)
  if ((session.restoredCartCount ?? 0) > 0) restoredBits.push(`장바구니 ${session.restoredCartCount}개`)
  if ((session.restoredLayoutItemCount ?? 0) > 0) restoredBits.push(`배치 ${session.restoredLayoutItemCount}개`)
  if (session.restoredRecommendationDraft) restoredBits.push('추천 초안')

  const continuationLabel = typeof session.continuation?.statusLabel === 'string' ? session.continuation.statusLabel.trim() : ''
  const mergeLabel = session.mergeMode === 'merged'
    ? '게스트 초안을 계정에 연결했어요.'
    : session.mergeMode === 'replaced'
      ? '계정에 저장된 상태로 전환했어요.'
      : '로그인이 완료됐어요.'

  return {
    title: `${session.accountLabel} 계정 연결됨`,
    body: [
      mergeLabel,
      restoredBits.length ? `복원됨: ${restoredBits.join(' · ')}.` : '',
      continuationLabel ? `현재 단계: ${continuationLabel}.` : '',
      buildIntentCopy(session.intent),
    ].filter(Boolean).join(' ').replace(/\s{2,}/g, ' ').trim(),
    restoredBits,
    draftContextBits: buildDraftContextBits(session.guestDraftSummary),
    draftSaveBits: buildDraftSaveBits(session.draftSave),
  }
}
