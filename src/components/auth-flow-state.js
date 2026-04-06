function sanitizeEmail(email = '') {
  return email.trim().toLowerCase()
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

export function buildAuthSubmitPlan({ email, password, guestDraftSnapshot }) {
  const normalizedEmail = sanitizeEmail(email)
  const hasPassword = password.trim().length >= 8
  const hasGuestDraft = Boolean(guestDraftSnapshot)

  return {
    canSubmit: normalizedEmail.includes('@') && hasPassword,
    endpoint: '/api/auth/login',
    method: 'POST',
    request: {
      email: normalizedEmail,
      password,
      guestDraftSnapshot: hasGuestDraft ? guestDraftSnapshot : null,
    },
    summary: {
      email: normalizedEmail,
      wishlistCount: guestDraftSnapshot?.continuity?.wishlistIds?.length ?? 0,
      cartCount: guestDraftSnapshot?.continuity?.cartItems?.length ?? 0,
      layoutItemCount: guestDraftSnapshot?.continuity?.layoutItems?.length ?? 0,
      hasRecommendationDraft: Boolean(guestDraftSnapshot?.recommendationDraft),
    },
  }
}

export function buildAuthResultSummary(result, fallbackSummary = {}) {
  const data = result?.data ?? {}
  const mergedDraft = data.mergedGuestDraft ?? data.guestDraftMerged ?? null

  return {
    sessionId: data.sessionId ?? data.session?.id ?? null,
    accountLabel: data.user?.name ?? data.user?.email ?? data.account?.email ?? null,
    mergedDraftCount: typeof mergedDraft?.count === 'number'
      ? mergedDraft.count
      : fallbackSummary.layoutItemCount ?? 0,
    wishlistCount: fallbackSummary.wishlistCount ?? 0,
    cartCount: fallbackSummary.cartCount ?? 0,
    layoutItemCount: fallbackSummary.layoutItemCount ?? 0,
    hasRecommendationDraft: fallbackSummary.hasRecommendationDraft ?? false,
  }
}

export function buildAuthStatusCopy(status, summary, resultSummary = null) {
  if (status === 'submitting') return '계정 연결 준비 중… 게스트 초안을 함께 묶고 있어요.'
  if (status === 'ready') {
    const accountCopy = resultSummary?.accountLabel ? ` · ${resultSummary.accountLabel} 계정과 연결 준비됨` : ''
    const sessionCopy = resultSummary?.sessionId ? ` · 세션 ${resultSummary.sessionId}` : ''
    return `백엔드 연결 준비 완료${accountCopy}${sessionCopy} · 찜 ${summary.wishlistCount}개 · 장바구니 ${summary.cartCount}개 · 배치 ${summary.layoutItemCount}개를 함께 전달할 수 있어요.`
  }
  if (status === 'error') {
    return '로그인 연결에 실패했어요. 잠시 후 다시 시도하거나 백엔드 인증 설정을 확인해주세요.'
  }
  return '로그인하면 게스트 상태의 추천, 보드, 찜, 장바구니를 계정에 이어붙일 준비를 시작합니다.'
}
