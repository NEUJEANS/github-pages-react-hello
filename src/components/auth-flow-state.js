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

function normalizeAuthErrorMessage(message = '', { tone = 'unknown' } = {}) {
  const normalized = typeof message === 'string' ? message.trim() : ''

  if (!normalized) return ''

  if (tone === 'merge') {
    if (normalized === 'Guest draft merge confirmation required' || normalized === 'Merge resolution required') {
      return '현재 게스트 초안과 계정 상태 중 어떤 쪽을 이어갈지 선택해 주세요.'
    }
  }

  if (tone === 'action-required') {
    if (normalized === 'Profile completion fields required') return '프로필 보완에 필요한 항목을 먼저 입력해 주세요.'
    if (normalized === 'Verification code required') return '인증 코드를 먼저 입력해 주세요.'
  }

  return normalized
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
  layoutTrayItems = [],
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
        : (typeof spaceProfile?.apartmentType === 'string' && spaceProfile.apartmentType.trim()
          ? spaceProfile.apartmentType.trim()
          : (typeof spaceProfile?.query === 'string' && spaceProfile.query.trim()
            ? spaceProfile.query.trim()
            : null)),
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
      layoutTrayItems: Array.isArray(layoutTrayItems)
        ? layoutTrayItems.map((item) => ({ ...item }))
        : [],
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

function buildSerializableIntent(intent = null) {
  if (!intent || typeof intent !== 'object' || Array.isArray(intent)) return null

  const source = typeof intent.source === 'string' ? intent.source.trim() : ''
  const action = typeof intent.action === 'string' ? normalizeContinuationNextAction(intent.action.trim()) : ''
  const label = typeof intent.label === 'string' ? intent.label.trim() : ''
  const returnScreen = typeof intent.returnScreen === 'string' ? intent.returnScreen.trim() : ''
  const draftLabel = typeof intent.draftLabel === 'string' ? intent.draftLabel.trim() : ''

  if (!source && !action && !label && !returnScreen && !draftLabel) return null

  return {
    source: source || null,
    action: action || null,
    label: label || null,
    returnScreen: returnScreen || null,
    draftLabel: draftLabel || null,
  }
}

export function resolveContinuationSubmitIntent({
  sessionIntent = null,
  formIntent = null,
  handoffIntent = null,
  blockerAction = null,
} = {}) {
  const normalizedBlockerAction = normalizeContinuationNextAction(
    typeof blockerAction === 'string' ? blockerAction.trim() : '',
  )

  const candidates = [sessionIntent, formIntent, handoffIntent]
    .map((intent) => buildSerializableIntent(intent))
    .filter(Boolean)

  const nonBlockerIntent = candidates.find((intent) => intent.action && intent.action !== normalizedBlockerAction)
  if (nonBlockerIntent) return nonBlockerIntent

  if (normalizedBlockerAction) {
    const nonActionIntent = candidates.find((intent) => !intent.action && (intent.label || intent.returnScreen || intent.draftLabel || intent.source))
    return nonActionIntent ?? null
  }

  return candidates.find((intent) => intent.action || intent.label || intent.returnScreen || intent.draftLabel || intent.source) ?? null
}

function buildSerializableRecommendationDraft(recommendationDraft = null, recommendationRoom = null) {
  if (!recommendationDraft || typeof recommendationDraft !== 'object' || Array.isArray(recommendationDraft)) {
    return null
  }

  const room = typeof recommendationDraft?.room === 'string' && recommendationDraft.room.trim()
    ? recommendationDraft.room.trim()
    : (typeof recommendationRoom === 'string' && recommendationRoom.trim() ? recommendationRoom.trim() : null)
  const style = typeof recommendationDraft?.style === 'string' && recommendationDraft.style.trim() ? recommendationDraft.style.trim() : null
  const priority = typeof recommendationDraft?.priority === 'string' && recommendationDraft.priority.trim() ? recommendationDraft.priority.trim() : null
  const lifestyle = Array.isArray(recommendationDraft?.lifestyle)
    ? recommendationDraft.lifestyle.filter((value, index, array) => typeof value === 'string' && value.trim() && array.indexOf(value) === index)
    : []
  const extraRequest = typeof recommendationDraft?.extraRequest === 'string' ? recommendationDraft.extraRequest.trim() : ''

  if (!room && !style && !priority && !lifestyle.length && !extraRequest) return null

  return {
    room,
    style,
    priority,
    lifestyle,
    extraRequest,
  }
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
  const layoutTrayItems = Array.isArray(draftSave.layoutTrayItems)
    ? draftSave.layoutTrayItems.map((item) => ({ ...item }))
    : []
  const recommendationDraft = buildSerializableRecommendationDraft(draftSave.recommendationDraft, draftSave.recommendationRoom)
  const apartmentSelectionId = typeof draftSave.apartmentSelectionId === 'string' && draftSave.apartmentSelectionId.trim()
    ? draftSave.apartmentSelectionId.trim()
    : ''

  const payload = {
    draftLabel: typeof draftSave.draftLabel === 'string' ? draftSave.draftLabel.trim() : '',
    apartmentLabel: typeof draftSave.apartmentLabel === 'string' ? draftSave.apartmentLabel.trim() : '',
    apartmentSelectionId,
    recommendationRoom: typeof draftSave.recommendationRoom === 'string' && draftSave.recommendationRoom.trim()
      ? draftSave.recommendationRoom.trim()
      : (recommendationDraft?.room ?? ''),
    recommendationDraft,
    selectedSpaceIds,
    layoutItems,
    layoutTrayItems,
    layoutItemCount: layoutItems.length,
  }

  if (!payload.draftLabel && !payload.apartmentLabel && !payload.apartmentSelectionId && !payload.recommendationRoom && !payload.selectedSpaceIds.length && !payload.layoutItems.length && !payload.layoutTrayItems.length) {
    return null
  }

  return {
    draftLabel: payload.draftLabel || null,
    apartmentLabel: payload.apartmentLabel || null,
    ...(payload.apartmentSelectionId ? { apartmentSelectionId: payload.apartmentSelectionId } : {}),
    recommendationRoom: payload.recommendationRoom || null,
    ...(payload.recommendationDraft ? { recommendationDraft: payload.recommendationDraft } : {}),
    selectedSpaceIds: payload.selectedSpaceIds,
    layoutItems: payload.layoutItems,
    ...(Array.isArray(draftSave.layoutTrayItems) ? { layoutTrayItems: payload.layoutTrayItems } : {}),
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
    const mergedDraft = readMergeDraft(data)
    return {
      tone: 'merge',
      message: normalizeAuthErrorMessage(message, { tone: 'merge' }) || '게스트 초안 병합 확인이 필요해요. 현재 초안은 그대로 보관되어 있어요.',
      summary: buildFallbackSummary(fallbackSummary),
      allowedMergeResolutions: readAllowedMergeResolutions(data),
      resumeToken: data.resumeToken ?? null,
      nextAction: normalizeContinuationNextAction(data.nextAction ?? null),
      continuationStatus: data.status ?? null,
      continuationStatusLabel: data.statusLabel ?? null,
      mergedDraft: mergedDraft
        ? {
            mode: mergedDraft.mode ?? mergedDraft.status ?? null,
            wishlistCount: readMergeCount(mergedDraft.wishlistCount, fallbackSummary.wishlistCount ?? 0),
            cartCount: readMergeCount(mergedDraft.cartCount, fallbackSummary.cartCount ?? 0),
            layoutItemCount: readMergeCount(mergedDraft.layoutItemCount, fallbackSummary.layoutItemCount ?? 0),
            recommendationDraftRestored: typeof mergedDraft.recommendationDraftRestored === 'boolean'
              ? mergedDraft.recommendationDraftRestored
              : (fallbackSummary.hasRecommendationDraft ?? false),
          }
        : null,
    }
  }

  if (status >= 500 || status === 0) {
    return {
      tone: 'service',
      message: message ?? '인증 데모 상태를 준비하지 못했어요. 잠시 후 다시 시도해주세요.',
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

export function buildAuthStatusCopy(status, summary, resultSummary = null, errorSummary = null) {
  if (status === 'resume-ready') {
    return '이전 로그인 시도가 남아 있어요. 이어서 로그인할 수 있어요.'
  }

  if (status === 'submitting') return '로그인 중…'

  if (status === 'signup-success') {
    return resultSummary?.nextAction === 'retry-login'
      ? '회원가입이 완료됐어요. 이제 로그인해 주세요.'
      : '회원가입이 완료됐어요.'
  }

  if (status === 'ready') {
    if (resultSummary?.nextAction === 'complete-profile') return '프로필을 마저 입력하면 계속할 수 있어요.'
    if (resultSummary?.nextAction === 'verify-email') return '이메일 인증을 마치면 계속할 수 있어요.'
    if (resultSummary?.nextAction === 'confirm-merge-resolution') return '어떤 초안을 이어갈지 선택해 주세요.'
    return resultSummary?.accountLabel
      ? `${resultSummary.accountLabel} 계정으로 로그인됐어요.`
      : '로그인됐어요.'
  }

  if (status === 'error') {
    if (errorSummary?.tone === 'credentials') return errorSummary.message ?? '이메일 또는 비밀번호를 다시 확인해 주세요.'
    if (errorSummary?.tone === 'merge') return errorSummary.message ?? '어떤 초안을 이어갈지 선택해 주세요.'
    if (errorSummary?.tone === 'service') {
      return errorSummary.message ?? '인증 연결을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.'
    }
    return errorSummary?.message ?? '로그인에 실패했어요. 다시 시도해 주세요.'
  }

  return '로그인하면 저장한 작업을 이어서 볼 수 있어요.'
}
