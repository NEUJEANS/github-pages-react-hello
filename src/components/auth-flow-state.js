function sanitizeEmail(email = '') {
  return email.trim().toLowerCase()
}

function sanitizeAuthHandoffId(handoffId = '') {
  return typeof handoffId === 'string' ? handoffId.trim() : ''
}

function buildFallbackSummary(summary = {}) {
  return {
    handoffId: summary.handoffId ?? null,
    wishlistCount: summary.wishlistCount ?? 0,
    cartCount: summary.cartCount ?? 0,
    layoutItemCount: summary.layoutItemCount ?? 0,
    hasRecommendationDraft: Boolean(summary.hasRecommendationDraft),
  }
}

function readAllowedMergeResolutions(data = {}) {
  const values = Array.isArray(data.allowedMergeResolutions)
    ? data.allowedMergeResolutions
    : [data.allowedMergeResolution]

  return values
    .filter((value) => value === 'keep-guest' || value === 'replace-with-account')
    .filter((value, index, array) => array.indexOf(value) === index)
}

export function buildGuestDraftSnapshot({
  engagement,
  aiForm,
  spaceProfile,
  selectedApartment,
  selectedSpaceSummary,
  wishlistedIds = [],
  cartItems = [],
  editorItems = [],
}) {
  return {
    engagement: {
      aiRequests: engagement?.aiRequests ?? 0,
      furniturePlacements: engagement?.furniturePlacements ?? 0,
      draftBoards: engagement?.draftBoards ?? 0,
    },
    recommendationDraft: aiForm ? {
      room: aiForm.room ?? null,
      style: aiForm.style ?? null,
      priority: aiForm.priority ?? null,
      lifestyle: [...(aiForm.lifestyle ?? [])],
      extraRequest: aiForm.extraRequest ?? '',
    } : null,
    spaceProfile: spaceProfile ? {
      query: spaceProfile.query ?? '',
      apartmentType: spaceProfile.apartmentType ?? null,
      apartmentSelectionId: spaceProfile.apartmentSelectionId ?? null,
      spaces: [...(spaceProfile.spaces ?? [])],
    } : null,
    continuity: {
      apartmentLabel: selectedApartment
        ? [selectedApartment.brand, selectedApartment.complex, selectedApartment.unitLabel].filter(Boolean).join(' ')
        : null,
      selectedRooms: [...(selectedSpaceSummary?.availableRooms ?? [])],
      wishlistIds: [...wishlistedIds],
      cartItems: cartItems.map((item) => ({
        id: item.id,
        qty: item.qty,
      })),
      layoutItems: editorItems.map((item) => ({
        id: item.id,
        sourceId: item.sourceId,
        x: item.x,
        y: item.y,
        rotation: item.rotation,
        colorIndex: item.colorIndex,
      })),
    },
  }
}

function normalizeContinuationNextAction(nextAction = '') {
  switch (nextAction) {
    case 'login':
      return 'resume-authenticated-flow'
    case 'checkout':
      return 'checkout-cart'
    default:
      return nextAction
  }
}

function buildSerializableContinuation(continuation = null) {
  if (!continuation || typeof continuation !== 'object') return null

  const resumeToken = typeof continuation.resumeToken === 'string' ? continuation.resumeToken.trim() : ''
  const nextAction = normalizeContinuationNextAction(
    typeof continuation.nextAction === 'string' ? continuation.nextAction.trim() : '',
  )
  const status = typeof continuation.status === 'string' ? continuation.status.trim() : ''
  const statusLabel = typeof continuation.statusLabel === 'string' ? continuation.statusLabel.trim() : ''

  if (!resumeToken && !nextAction && !status && !statusLabel) return null

  return {
    resumeToken: resumeToken || null,
    nextAction: nextAction || null,
    status: status || null,
    statusLabel: statusLabel || null,
  }
}

function buildSerializableContinuationFields(fields = null) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return null

  const entries = Object.entries(fields)
    .map(([key, value]) => [typeof key === 'string' ? key.trim() : '', typeof value === 'string' ? value.trim() : value])
    .filter(([key, value]) => key && value !== undefined)

  if (!entries.length) return null

  return Object.fromEntries(entries)
}

function buildSerializableDraftSaveHandoff(draftSave = null) {
  if (!draftSave || typeof draftSave !== 'object' || Array.isArray(draftSave)) return null

  const layoutItems = Array.isArray(draftSave.layoutItems)
    ? draftSave.layoutItems.map((item) => ({
        id: item?.id ?? null,
        sourceId: item?.sourceId ?? null,
        x: item?.x ?? null,
        y: item?.y ?? null,
        rotation: item?.rotation ?? 0,
        colorIndex: item?.colorIndex ?? 0,
      }))
    : []

  const selectedSpaceIds = Array.isArray(draftSave.selectedSpaceIds)
    ? draftSave.selectedSpaceIds.filter((value, index, array) => typeof value === 'string' && value.trim() && array.indexOf(value) === index)
    : []

  const payload = {
    draftLabel: typeof draftSave.draftLabel === 'string' ? draftSave.draftLabel.trim() : '',
    apartmentLabel: typeof draftSave.apartmentLabel === 'string' ? draftSave.apartmentLabel.trim() : '',
    recommendationRoom: typeof draftSave.recommendationRoom === 'string' ? draftSave.recommendationRoom.trim() : '',
    selectedSpaceIds,
    layoutItems,
    layoutItemCount: layoutItems.length,
  }

  if (!payload.draftLabel && !payload.apartmentLabel && !payload.recommendationRoom && !payload.selectedSpaceIds.length && !payload.layoutItems.length) {
    return null
  }

  return {
    draftLabel: payload.draftLabel || null,
    apartmentLabel: payload.apartmentLabel || null,
    recommendationRoom: payload.recommendationRoom || null,
    selectedSpaceIds: payload.selectedSpaceIds,
    layoutItems: payload.layoutItems,
    layoutItemCount: payload.layoutItemCount,
  }
}

function readContinuationRequiredFields(nextAction = null) {
  switch (nextAction) {
    case 'complete-profile':
      return ['displayName', 'phone']
    case 'verify-email':
      return ['verificationCode']
    case 'confirm-merge-resolution':
      return ['mergeResolution']
    default:
      return []
  }
}

export function buildAuthContinuationPlan({
  endpoint = '/api/auth/continue',
  continuation = null,
  fields = null,
  handoffId = null,
  intent = null,
  draftSave = null,
} = {}) {
  const serializableContinuation = buildSerializableContinuation(continuation)
  const serializableFields = buildSerializableContinuationFields(fields)
  const serializableDraftSave = buildSerializableDraftSaveHandoff(draftSave)
  const normalizedHandoffId = sanitizeAuthHandoffId(handoffId)
  const requiredFields = readContinuationRequiredFields(serializableContinuation?.nextAction)
  const missingFields = requiredFields.filter((field) => {
    const value = serializableFields?.[field]
    return typeof value !== 'string' || !value.trim()
  })
  const hasContinuationContract = Boolean(serializableContinuation?.resumeToken || serializableContinuation?.nextAction)

  return {
    canSubmit: hasContinuationContract && missingFields.length === 0,
    endpoint,
    method: 'POST',
    handoffId: normalizedHandoffId || null,
    request: {
      continuation: serializableContinuation,
      fields: serializableFields,
      handoffId: normalizedHandoffId || null,
      intent,
      draftSave: serializableDraftSave,
    },
    summary: {
      handoffId: normalizedHandoffId || null,
      continuation: serializableContinuation,
      intent,
      fieldCount: serializableFields ? Object.keys(serializableFields).length : 0,
      requiredFields,
      missingFields,
      draftSave: serializableDraftSave,
      hasDraftSave: Boolean(serializableDraftSave),
    },
  }
}

export function buildAuthSubmitPlan({
  email,
  password,
  guestDraftSnapshot,
  mergeResolution = null,
  handoffId = null,
  endpoint = '/api/auth/login',
  intent = null,
  continuation = null,
  draftSave = null,
} = {}) {
  const normalizedEmail = sanitizeEmail(email)
  const normalizedHandoffId = sanitizeAuthHandoffId(handoffId)
  const hasPassword = password.trim().length >= 8
  const hasGuestDraft = Boolean(guestDraftSnapshot)
  const serializableContinuation = buildSerializableContinuation(continuation)
  const serializableDraftSave = buildSerializableDraftSaveHandoff(draftSave)

  return {
    canSubmit: normalizedEmail.includes('@') && hasPassword,
    endpoint,
    method: 'POST',
    handoffId: normalizedHandoffId || null,
    request: {
      email: normalizedEmail,
      password,
      guestDraftSnapshot: hasGuestDraft ? guestDraftSnapshot : null,
      mergeResolution,
      handoffId: normalizedHandoffId || null,
      intent,
      continuation: serializableContinuation,
      draftSave: serializableDraftSave,
    },
    summary: {
      email: normalizedEmail,
      handoffId: normalizedHandoffId || null,
      wishlistCount: guestDraftSnapshot?.continuity?.wishlistIds?.length ?? 0,
      cartCount: guestDraftSnapshot?.continuity?.cartItems?.length ?? 0,
      layoutItemCount: guestDraftSnapshot?.continuity?.layoutItems?.length ?? 0,
      hasRecommendationDraft: Boolean(guestDraftSnapshot?.recommendationDraft),
      mergeResolution,
      intent,
      continuation: serializableContinuation,
      draftSave: serializableDraftSave,
      hasDraftSave: Boolean(serializableDraftSave),
    },
  }
}

function readMergeCount(value, fallback = 0) {
  return typeof value === 'number' ? value : fallback
}

function readMergeDraft(data = {}) {
  return data.mergedGuestDraft ?? data.guestDraftMerged ?? data.handoff ?? null
}

export function buildAuthResultSummary(result, fallbackSummary = {}) {
  const data = result?.data ?? {}
  const meta = result?.meta ?? {}
  const mergedDraft = readMergeDraft(data)
  const fallbackLayoutCount = fallbackSummary.layoutItemCount ?? 0
  const fallbackWishlistCount = fallbackSummary.wishlistCount ?? 0
  const fallbackCartCount = fallbackSummary.cartCount ?? 0
  const fallbackContinuation = fallbackSummary.continuation ?? null

  return {
    sessionId: data.sessionId ?? data.session?.id ?? fallbackSummary.sessionId ?? null,
    handoffId: data.handoffId ?? data.authHandoffId ?? fallbackSummary.handoffId ?? null,
    accountLabel: data.user?.name ?? data.user?.email ?? data.account?.email ?? fallbackSummary.accountLabel ?? null,
    mergeMode: mergedDraft?.mode ?? mergedDraft?.status ?? data.mergeMode ?? null,
    mergedDraftCount: readMergeCount(mergedDraft?.count, fallbackLayoutCount),
    restoredWishlistCount: readMergeCount(mergedDraft?.wishlistCount, fallbackWishlistCount),
    restoredCartCount: readMergeCount(mergedDraft?.cartCount, fallbackCartCount),
    restoredLayoutItemCount: readMergeCount(mergedDraft?.layoutItemCount, fallbackLayoutCount),
    restoredRecommendationDraft: typeof mergedDraft?.recommendationDraftRestored === 'boolean'
      ? mergedDraft.recommendationDraftRestored
      : (fallbackSummary.hasRecommendationDraft ?? false),
    wishlistCount: fallbackWishlistCount,
    cartCount: fallbackCartCount,
    layoutItemCount: fallbackLayoutCount,
    hasRecommendationDraft: fallbackSummary.hasRecommendationDraft ?? false,
    guestDraftSummary: data.guestDraftSummary ?? fallbackSummary.guestDraftSummary ?? null,
    intent: data.intent ?? fallbackSummary.intent ?? null,
    connection: data.connection ?? data.authConnection ?? fallbackSummary.connection ?? null,
    draftSave: data.draftSave ?? fallbackSummary.draftSave ?? null,
    resumeToken: data.resumeToken ?? fallbackContinuation?.resumeToken ?? null,
    nextAction: normalizeContinuationNextAction(data.nextAction ?? fallbackContinuation?.nextAction ?? null),
    continuationStatus: data.status ?? fallbackContinuation?.status ?? null,
    continuationStatusLabel: data.statusLabel ?? fallbackContinuation?.statusLabel ?? null,
    authMode: meta.authMode ?? fallbackSummary.authMode ?? 'remote',
    authTransport: meta.authTransport ?? fallbackSummary.authTransport ?? 'network',
  }
}

export function buildAuthErrorSummary(result, fallbackSummary = {}) {
  if (!result || result.ok) return null

  const data = result.data ?? {}
  const message = data.error ?? data.message ?? data.detail ?? null
  const status = result.status ?? 0

  if (status === 401) {
    return {
      tone: 'credentials',
      message: message ?? '이메일 또는 비밀번호를 다시 확인해주세요.',
      summary: buildFallbackSummary(fallbackSummary),
      resumeToken: data.resumeToken ?? null,
      nextAction: normalizeContinuationNextAction(data.nextAction ?? null),
    }
  }

  if (status === 409) {
    return {
      tone: 'merge',
      message: message ?? '게스트 초안 병합 확인이 필요해요. 현재 초안은 그대로 보관되어 있어요.',
      summary: buildFallbackSummary(fallbackSummary),
      allowedMergeResolutions: readAllowedMergeResolutions(data),
      resumeToken: data.resumeToken ?? null,
      nextAction: normalizeContinuationNextAction(data.nextAction ?? null),
    }
  }

  if (status >= 500 || status === 0) {
    return {
      tone: 'service',
      message: message ?? '인증 서비스 연결을 아직 준비 중이에요. 잠시 후 다시 시도해주세요.',
      summary: buildFallbackSummary(fallbackSummary),
      resumeToken: data.resumeToken ?? null,
      nextAction: normalizeContinuationNextAction(data.nextAction ?? null),
    }
  }

  return {
    tone: 'unknown',
    message: message ?? '로그인 연결을 완료하지 못했어요. 입력값과 인증 설정을 다시 확인해주세요.',
    summary: buildFallbackSummary(fallbackSummary),
  }
}

export function buildAuthStatusCopy(status, summary, resultSummary = null, errorSummary = null, connectionSummary = null) {
  if (status === 'resume-ready') {
    const baseCopy = summary.handoffId
      ? `이전 로그인 시도가 남아 있어요. handoff ${summary.handoffId} 기준으로 입력한 이메일과 게스트 초안을 그대로 이어서 다시 연결할 수 있어요.`
      : '이전 로그인 시도가 남아 있어요. 입력한 이메일과 게스트 초안을 그대로 이어서 다시 연결할 수 있어요.'
    const connectionCopy = connectionSummary?.targetLabel
      ? ` 이전 연결 대상은 ${connectionSummary.targetLabel}${connectionSummary.endpoint ? ` (${connectionSummary.endpoint})` : ''}로 기록돼 있어요.`
      : ''
    const continuationCopy = resultSummary?.resumeToken || resultSummary?.nextAction || resultSummary?.continuationStatusLabel
      ? ` 백엔드 재개 계약은${resultSummary?.nextAction ? ` ${resultSummary.nextAction}` : ' 미정'}${resultSummary?.resumeToken ? ` · token ${resultSummary.resumeToken}` : ''}${resultSummary?.continuationStatusLabel ? ` · ${resultSummary.continuationStatusLabel}` : resultSummary?.continuationStatus ? ` · ${resultSummary.continuationStatus}` : ''} 상태예요.`
      : ''
    return `${baseCopy}${connectionCopy}${continuationCopy}`
  }
  if (status === 'submitting') return '계정 연결 준비 중… 게스트 초안을 함께 묶고 있어요.'
  if (status === 'ready') {
    const accountCopy = resultSummary?.accountLabel ? ` · ${resultSummary.accountLabel} 계정과 연결 준비됨` : ''
    const handoffCopy = resultSummary?.handoffId ? ` · handoff ${resultSummary.handoffId}` : ''
    const sessionCopy = resultSummary?.sessionId ? ` · 세션 ${resultSummary.sessionId}` : ''
    const mergeCopy = resultSummary?.mergeMode
      ? ` · ${resultSummary.mergeMode === 'merged' ? '게스트 초안 병합 완료' : resultSummary.mergeMode === 'replaced' ? '계정 상태로 전환됨' : `병합 상태 ${resultSummary.mergeMode}`}`
      : ''
    const modeCopy = resultSummary?.authMode === 'scaffold'
      ? ` · ${resultSummary.authTransport === 'same-origin-middleware' ? 'same-origin scaffold로 응답 확인' : 'local scaffold로 연결 유지'}`
      : ''
    const continuationCopy = resultSummary?.nextAction || resultSummary?.resumeToken || resultSummary?.continuationStatusLabel
      ? ` · backend ${resultSummary?.nextAction ?? 'next-action 없음'}${resultSummary?.resumeToken ? ` (${resultSummary.resumeToken})` : ''}${resultSummary?.continuationStatusLabel ? ` · ${resultSummary.continuationStatusLabel}` : resultSummary?.continuationStatus ? ` · ${resultSummary.continuationStatus}` : ''}`
      : ''
    return `백엔드 연결 준비 완료${accountCopy}${handoffCopy}${sessionCopy}${mergeCopy}${modeCopy}${continuationCopy} · 찜 ${summary.wishlistCount}개 · 장바구니 ${summary.cartCount}개 · 배치 ${summary.layoutItemCount}개를 함께 전달할 수 있어요.`
  }
  if (status === 'error') {
    if (errorSummary?.tone === 'credentials') return `${errorSummary.message} · 게스트 초안은 유지되어 다시 시도할 수 있어요.`
    if (errorSummary?.tone === 'merge') return `${errorSummary.message} · 찜 ${summary.wishlistCount}개 · 장바구니 ${summary.cartCount}개 · 배치 ${summary.layoutItemCount}개 handoff 기록을 유지합니다. 계속 진행하면 같은 초안으로 병합 방향을 확정할 수 있어요.`
    if (errorSummary?.tone === 'service') {
      if (connectionSummary?.isSameOriginScaffold) {
        return `${errorSummary.message} · 현재는 ${connectionSummary.targetLabel} 대상만 준비되어 있어서, auth base URL 또는 백엔드 라우트가 연결되면 같은 초안으로 다시 이어갈 수 있어요.`
      }
      return `${errorSummary.message} · 인증 API가 준비되면 같은 초안으로 다시 연결할 수 있어요.`
    }
    return `${errorSummary?.message ?? '로그인 연결에 실패했어요.'} 잠시 후 다시 시도하거나 백엔드 인증 설정을 확인해주세요.`
  }
  return '로그인하면 게스트 상태의 추천, 보드, 찜, 장바구니를 계정에 이어붙일 준비를 시작합니다.'
}
