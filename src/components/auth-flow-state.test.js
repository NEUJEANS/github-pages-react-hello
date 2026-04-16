import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAuthContinuationPlan,
  buildAuthErrorSummary,
  buildAuthResultSummary,
  buildAuthStatusCopy,
  buildAuthSubmitPlan,
  buildGuestDraftSnapshot,
  resolveContinuationSubmitIntent,
} from './auth-flow-state.js'

test('buildGuestDraftSnapshot keeps the login handoff payload serializable and focused', () => {
  const snapshot = buildGuestDraftSnapshot({
    engagement: { aiRequests: 2, furniturePlacements: 1, draftBoards: 1 },
    aiForm: {
      room: '거실',
      style: 'natural',
      priority: 'flow',
      lifestyle: ['반려동물'],
      extraRequest: '우드 톤',
    },
    spaceProfile: {
      query: '서울 성동구',
      apartmentType: '84A',
      apartmentSelectionId: 'apt-1',
      spaces: ['living', 'bed1'],
    },
    selectedApartment: { brand: '래미안', complex: '포레스트', unitLabel: '84A' },
    selectedSpaceSummary: { availableRooms: ['거실', '침실'] },
    wishlistedIds: ['bed-001'],
    cartItems: [{ id: 'bed-001', qty: 2, name: 'ignore me' }],
    editorItems: [{ id: 'placed-sofa', sourceId: 'sofa-001', x: 10, y: 20, rotation: 0, colorIndex: 2, label: 'SOFA' }],
    layoutTrayItems: [{ id: 'plant-001', name: '플랜트', priceLabel: '₩89,000', uiOnly: true }],
  })

  assert.deepEqual(snapshot, {
    engagement: { aiRequests: 2, furniturePlacements: 1, draftBoards: 1 },
    recommendationDraft: {
      room: '거실',
      style: 'natural',
      priority: 'flow',
      lifestyle: ['반려동물'],
      extraRequest: '우드 톤',
    },
    spaceProfile: {
      query: '서울 성동구',
      apartmentType: '84A',
      apartmentSelectionId: 'apt-1',
      spaces: ['living', 'bed1'],
    },
    continuity: {
      apartmentLabel: '래미안 포레스트 84A',
      selectedRooms: ['거실', '침실'],
      wishlistIds: ['bed-001'],
      cartItems: [{ id: 'bed-001', qty: 2 }],
      layoutItems: [{ id: 'placed-sofa', sourceId: 'sofa-001', x: 10, y: 20, rotation: 0, colorIndex: 2 }],
      layoutTrayItems: [{ id: 'plant-001', name: '플랜트', priceLabel: '₩89,000', uiOnly: true }],
    },
  })
})

test('resolveContinuationSubmitIntent prefers the pre-blocker product intent over the blocker intent', () => {
  const intent = resolveContinuationSubmitIntent({
    sessionIntent: {
      source: 'auth-modal',
      action: 'complete-profile',
      label: '프로필 마무리',
      returnScreen: 'home',
    },
    formIntent: {
      source: 'layout-editor',
      action: 'save-layout-draft',
      label: '로그인 후 보드 저장',
      returnScreen: 'layout',
      draftLabel: '84A · 3개 공간 선택',
    },
    handoffIntent: {
      source: 'auth-modal',
      action: 'complete-profile',
      label: '프로필 마무리',
      returnScreen: 'home',
    },
    blockerAction: 'complete-profile',
  })

  assert.deepEqual(intent, {
    source: 'layout-editor',
    action: 'save-layout-draft',
    label: '로그인 후 보드 저장',
    returnScreen: 'layout',
    draftLabel: '84A · 3개 공간 선택',
  })
})

test('resolveContinuationSubmitIntent drops blocker-only intent when no post-blocker action exists', () => {
  const intent = resolveContinuationSubmitIntent({
    sessionIntent: {
      source: 'auth-modal',
      action: 'complete-profile',
      label: '프로필 마무리',
      returnScreen: 'home',
    },
    blockerAction: 'complete-profile',
  })

  assert.equal(intent, null)
})

test('buildAuthContinuationPlan prepares a serializable follow-up auth contract payload', () => {
  const plan = buildAuthContinuationPlan({
    endpoint: '/api/auth/continue',
    handoffId: ' auth-continue-123 ',
    continuation: {
      resumeToken: ' resume-123 ',
      nextAction: ' complete-profile ',
      status: ' action-required ',
      statusLabel: ' 프로필 보완 필요 ',
    },
    intent: {
      source: 'layout-editor',
      action: 'save-layout-draft',
      label: '로그인 후 보드 저장',
      returnScreen: 'layout',
    },
    fields: {
      displayName: ' Havenly User ',
      phone: ' 010-1234-5678 ',
      ignored: undefined,
    },
    draftSave: {
      draftLabel: ' 거실 배치 보드 ',
      apartmentLabel: ' 래미안 포레스트 84A ',
      recommendationRoom: ' 거실 ',
      selectedSpaceIds: ['living', 'bed1', 'living'],
      layoutItems: [{ id: 'layout-1', sourceId: 'sofa-001', x: 10, y: 20, rotation: 0, colorIndex: 2 }],
    },
  })

  assert.equal(plan.canSubmit, true)
  assert.equal(plan.endpoint, '/api/auth/continue')
  assert.deepEqual(plan.request, {
    continuation: {
      resumeToken: 'resume-123',
      nextAction: 'complete-profile',
      status: 'action-required',
      statusLabel: '프로필 보완 필요',
    },
    fields: {
      displayName: 'Havenly User',
      phone: '010-1234-5678',
    },
    handoffId: 'auth-continue-123',
    intent: {
      source: 'layout-editor',
      action: 'save-layout-draft',
      label: '로그인 후 보드 저장',
      returnScreen: 'layout',
    },
    draftSave: {
      draftLabel: '거실 배치 보드',
      apartmentLabel: '래미안 포레스트 84A',
      recommendationRoom: '거실',
      selectedSpaceIds: ['living', 'bed1'],
      layoutItems: [{ id: 'layout-1', sourceId: 'sofa-001', x: 10, y: 20, rotation: 0, colorIndex: 2 }],
      layoutItemCount: 1,
    },
  })
  assert.deepEqual(plan.summary, {
    handoffId: 'auth-continue-123',
    continuation: {
      resumeToken: 'resume-123',
      nextAction: 'complete-profile',
      status: 'action-required',
      statusLabel: '프로필 보완 필요',
    },
    intent: {
      source: 'layout-editor',
      action: 'save-layout-draft',
      label: '로그인 후 보드 저장',
      returnScreen: 'layout',
    },
    fieldCount: 2,
    requiredFields: ['displayName', 'phone'],
    missingFields: [],
    draftSave: {
      draftLabel: '거실 배치 보드',
      apartmentLabel: '래미안 포레스트 84A',
      recommendationRoom: '거실',
      selectedSpaceIds: ['living', 'bed1'],
      layoutItems: [{ id: 'layout-1', sourceId: 'sofa-001', x: 10, y: 20, rotation: 0, colorIndex: 2 }],
      layoutItemCount: 1,
    },
    hasDraftSave: true,
  })
})

test('buildAuthContinuationPlan blocks submit until required continuation fields are serializable', () => {
  const plan = buildAuthContinuationPlan({
    endpoint: '/api/auth/continue',
    handoffId: ' auth-continue-123 ',
    continuation: {
      resumeToken: ' resume-123 ',
      nextAction: ' verify-email ',
      status: ' action-required ',
      statusLabel: ' 이메일 인증 필요 ',
    },
    fields: {
      verificationCode: '   ',
    },
  })

  assert.equal(plan.canSubmit, false)
  assert.deepEqual(plan.request, {
    continuation: {
      resumeToken: 'resume-123',
      nextAction: 'verify-email',
      status: 'action-required',
      statusLabel: '이메일 인증 필요',
    },
    fields: {
      verificationCode: '',
    },
    handoffId: 'auth-continue-123',
    intent: null,
    draftSave: null,
  })
  assert.deepEqual(plan.summary, {
    handoffId: 'auth-continue-123',
    continuation: {
      resumeToken: 'resume-123',
      nextAction: 'verify-email',
      status: 'action-required',
      statusLabel: '이메일 인증 필요',
    },
    intent: null,
    fieldCount: 1,
    requiredFields: ['verificationCode'],
    missingFields: ['verificationCode'],
    draftSave: null,
    hasDraftSave: false,
  })
})

test('buildAuthContinuationPlan requires a serializable merge resolution when auth is paused on merge confirmation', () => {
  const plan = buildAuthContinuationPlan({
    endpoint: '/api/auth/continue',
    handoffId: 'auth-continue-merge-123',
    continuation: {
      resumeToken: 'resume-merge-123',
      nextAction: 'confirm-merge-resolution',
    },
    fields: {
      mergeResolution: ' keep-guest ',
    },
  })

  assert.equal(plan.canSubmit, true)
  assert.deepEqual(plan.request.fields, {
    mergeResolution: 'keep-guest',
  })
  assert.equal(plan.request.intent, null)
  assert.deepEqual(plan.summary.requiredFields, ['mergeResolution'])
  assert.deepEqual(plan.summary.missingFields, [])
})

test('buildAuthSubmitPlan prepares a backend-friendly login request with handoff metadata', () => {
  const plan = buildAuthSubmitPlan({
    email: ' USER@Example.com ',
    password: 'password123',
    handoffId: 'auth-20260406123000-2n9c',
    endpoint: '/internal/auth/login',
    intent: { action: 'save-layout-draft', label: '로그인 후 보드 저장' },
    continuation: { resumeToken: 'resume-123', nextAction: 'confirm-merge-resolution' },
    draftSave: {
      draftLabel: ' 거실 배치 보드 ',
      apartmentLabel: ' 래미안 포레스트 84A ',
      recommendationRoom: ' 거실 ',
      recommendationDraft: {
        room: ' 거실 ',
        style: ' 모던 ',
        priority: ' 수납 ',
        lifestyle: ['재택근무', '반려동물', '재택근무'],
        extraRequest: ' 채광을 살리고 싶어요 ',
      },
      selectedSpaceIds: ['living', 'bed1', 'living'],
      layoutItems: [{ id: 'layout-1', sourceId: 'sofa-001', x: 10, y: 20, rotation: 0, colorIndex: 2 }],
    },
    guestDraftSnapshot: {
      recommendationDraft: { room: '거실' },
      continuity: {
        wishlistIds: ['a', 'b'],
        cartItems: [{ id: 'x', qty: 1 }],
        layoutItems: [{ id: 'placed-sofa' }],
      },
    },
  })

  assert.equal(plan.canSubmit, true)
  assert.equal(plan.endpoint, '/internal/auth/login')
  assert.equal(plan.method, 'POST')
  assert.equal(plan.handoffId, 'auth-20260406123000-2n9c')
  assert.equal(plan.request.email, 'user@example.com')
  assert.equal(plan.request.handoffId, 'auth-20260406123000-2n9c')
  assert.deepEqual(plan.request.intent, { action: 'save-layout-draft', label: '로그인 후 보드 저장' })
  assert.deepEqual(plan.request.draftSave, {
    draftLabel: '거실 배치 보드',
    apartmentLabel: '래미안 포레스트 84A',
    recommendationRoom: '거실',
    recommendationDraft: {
      room: '거실',
      style: '모던',
      priority: '수납',
      lifestyle: ['재택근무', '반려동물'],
      extraRequest: '채광을 살리고 싶어요',
    },
    selectedSpaceIds: ['living', 'bed1'],
    layoutItems: [{ id: 'layout-1', sourceId: 'sofa-001', x: 10, y: 20, rotation: 0, colorIndex: 2 }],
    layoutItemCount: 1,
  })
  assert.equal(plan.summary.handoffId, 'auth-20260406123000-2n9c')
  assert.equal(plan.summary.wishlistCount, 2)
  assert.equal(plan.summary.cartCount, 1)
  assert.equal(plan.summary.layoutItemCount, 1)
  assert.equal(plan.summary.hasRecommendationDraft, true)
  assert.equal(plan.summary.mergeResolution, null)
  assert.deepEqual(plan.summary.intent, { action: 'save-layout-draft', label: '로그인 후 보드 저장' })
  assert.deepEqual(plan.summary.continuation, {
    resumeToken: 'resume-123',
    nextAction: 'confirm-merge-resolution',
    status: null,
    statusLabel: null,
  })
  assert.deepEqual(plan.summary.draftSave, {
    draftLabel: '거실 배치 보드',
    apartmentLabel: '래미안 포레스트 84A',
    recommendationRoom: '거실',
    recommendationDraft: {
      room: '거실',
      style: '모던',
      priority: '수납',
      lifestyle: ['재택근무', '반려동물'],
      extraRequest: '채광을 살리고 싶어요',
    },
    selectedSpaceIds: ['living', 'bed1'],
    layoutItems: [{ id: 'layout-1', sourceId: 'sofa-001', x: 10, y: 20, rotation: 0, colorIndex: 2 }],
    layoutItemCount: 1,
  })
  assert.equal(plan.summary.hasDraftSave, true)
})

test('buildAuthContinuationPlan preserves an explicit empty layout tray snapshot', () => {
  const plan = buildAuthContinuationPlan({
    draftSave: {
      draftLabel: '거실 보드',
      recommendationRoom: '거실',
      layoutItems: [],
      layoutTrayItems: [],
    },
  })

  assert.deepEqual(plan.request.draftSave?.layoutTrayItems, [])
})

test('buildAuthResultSummary extracts backend auth response details without widening the login flow contract', () => {
  const summary = buildAuthResultSummary({
    data: {
      sessionId: 'session-1',
      handoffId: 'auth-20260406123000-2n9c',
      user: { email: 'user@example.com' },
      guestDraftSummary: {
        apartmentLabel: '래미안 포레스트 84A',
        selectedRoomCount: 2,
        selectedRooms: ['거실', '침실'],
        selectedSpaceIds: ['living', 'bed1'],
        recommendationRoom: '거실',
        wishlistCount: 2,
        cartCount: 1,
        layoutItemCount: 3,
      },
      intent: {
        source: 'layout-editor',
        action: 'save-layout-draft',
        label: '로그인 후 보드 저장',
        returnScreen: 'layout',
      },
      connection: {
        method: 'POST',
        endpoint: '/api/auth/login',
        resolvedUrl: '/api/auth/login',
        targetLabel: 'same-origin /api auth scaffold',
        isExternal: false,
        isSameOriginScaffold: true,
        credentialsMode: 'include',
        source: 'default',
      },
      draftSave: {
        draftLabel: '거실 배치 보드',
        apartmentLabel: '래미안 포레스트 84A',
        recommendationRoom: '거실',
        selectedSpaceIds: ['living', 'bed1'],
        layoutItems: [{ id: 'layout-1' }],
        layoutItemCount: 1,
      },
      mergedGuestDraft: {
        count: 3,
        mode: 'merged',
        wishlistCount: 2,
        cartCount: 1,
        layoutItemCount: 3,
        recommendationDraftRestored: true,
      },
      resumeToken: 'resume-123',
      nextAction: 'resume-layout-checkout',
      status: 'action-required',
      statusLabel: '프로필 보완 필요',
    },
    meta: {
      authMode: 'scaffold',
      authTransport: 'same-origin-middleware',
    },
  }, {
    handoffId: 'auth-20260406123000-2n9c',
    wishlistCount: 2,
    cartCount: 1,
    layoutItemCount: 3,
    hasRecommendationDraft: true,
  })

  assert.deepEqual(summary, {
    sessionId: 'session-1',
    handoffId: 'auth-20260406123000-2n9c',
    accountLabel: 'user@example.com',
    mergeMode: 'merged',
    mergedDraftCount: 3,
    restoredWishlistCount: 2,
    restoredCartCount: 1,
    restoredLayoutItemCount: 3,
    restoredRecommendationDraft: true,
    wishlistCount: 2,
    cartCount: 1,
    layoutItemCount: 3,
    hasRecommendationDraft: true,
    guestDraftSummary: {
      apartmentLabel: '래미안 포레스트 84A',
      selectedRoomCount: 2,
      selectedRooms: ['거실', '침실'],
      selectedSpaceIds: ['living', 'bed1'],
      recommendationRoom: '거실',
      wishlistCount: 2,
      cartCount: 1,
      layoutItemCount: 3,
    },
    intent: {
      source: 'layout-editor',
      action: 'save-layout-draft',
      label: '로그인 후 보드 저장',
      returnScreen: 'layout',
    },
    connection: {
      method: 'POST',
      endpoint: '/api/auth/login',
      resolvedUrl: '/api/auth/login',
      targetLabel: 'same-origin /api auth scaffold',
      isExternal: false,
      isSameOriginScaffold: true,
      credentialsMode: 'include',
      source: 'default',
    },
    draftSave: {
      draftLabel: '거실 배치 보드',
      apartmentLabel: '래미안 포레스트 84A',
      recommendationRoom: '거실',
      selectedSpaceIds: ['living', 'bed1'],
      layoutItems: [{ id: 'layout-1' }],
      layoutItemCount: 1,
    },
    resumeToken: 'resume-123',
    nextAction: 'resume-layout-checkout',
    continuationStatus: 'action-required',
    continuationStatusLabel: '프로필 보완 필요',
    authMode: 'scaffold',
    authTransport: 'same-origin-middleware',
  })
})

test('buildAuthResultSummary normalizes legacy backend continuation actions before the frontend resume flow consumes them', () => {
  const checkoutSummary = buildAuthResultSummary({
    data: {
      sessionId: 'session-checkout-1',
      user: { email: 'user@example.com' },
      resumeToken: 'resume-checkout-123',
      nextAction: 'checkout',
    },
    meta: {
      authMode: 'scaffold',
      authTransport: 'same-origin-middleware',
    },
  })

  assert.equal(checkoutSummary.nextAction, 'checkout-cart')
  assert.equal(checkoutSummary.resumeToken, 'resume-checkout-123')

  const loginSummary = buildAuthResultSummary({
    data: {
      sessionId: 'session-login-1',
      user: { email: 'user@example.com' },
      resumeToken: 'resume-login-123',
      nextAction: 'login',
    },
    meta: {
      authMode: 'scaffold',
      authTransport: 'same-origin-middleware',
    },
  })

  assert.equal(loginSummary.nextAction, 'resume-authenticated-flow')
  assert.equal(loginSummary.resumeToken, 'resume-login-123')
})

test('buildAuthResultSummary can preserve serialized auth handoff context from fallback bootstrap state when the backend session is sparse', () => {
  const fallbackConnection = {
    method: 'POST',
    endpoint: '/api/auth/login',
    resolvedUrl: '/api/auth/login',
    targetLabel: 'same-origin /api auth scaffold',
    isExternal: false,
    isSameOriginScaffold: true,
    credentialsMode: 'include',
    source: 'default',
  }

  const summary = buildAuthResultSummary({
    data: {
      sessionId: 'session-bootstrap-1',
      user: { email: 'user@example.com' },
    },
    meta: {
      authMode: 'scaffold',
      authTransport: 'same-origin-middleware',
    },
  }, {
    handoffId: 'auth-20260406123000-2n9c',
    wishlistCount: 2,
    cartCount: 1,
    layoutItemCount: 3,
    hasRecommendationDraft: true,
    guestDraftSummary: {
      apartmentLabel: '래미안 포레스트 84A',
      selectedRoomCount: 2,
      selectedRooms: ['거실', '침실'],
      selectedSpaceIds: ['living', 'bed1'],
      recommendationRoom: '거실',
      wishlistCount: 2,
      cartCount: 1,
      layoutItemCount: 3,
    },
    intent: {
      source: 'layout-editor',
      action: 'save-layout-draft',
      label: '로그인 후 보드 저장',
      returnScreen: 'layout',
      draftLabel: '거실 84A',
    },
    connection: fallbackConnection,
    continuation: {
      resumeToken: 'resume-bootstrap-123',
      nextAction: 'save-layout-draft',
      status: 'action-required',
      statusLabel: '보드 저장 준비',
    },
  })

  assert.equal(summary.handoffId, 'auth-20260406123000-2n9c')
  assert.deepEqual(summary.intent, {
    source: 'layout-editor',
    action: 'save-layout-draft',
    label: '로그인 후 보드 저장',
    returnScreen: 'layout',
    draftLabel: '거실 84A',
  })
  assert.deepEqual(summary.connection, fallbackConnection)
  assert.deepEqual(summary.guestDraftSummary, {
    apartmentLabel: '래미안 포레스트 84A',
    selectedRoomCount: 2,
    selectedRooms: ['거실', '침실'],
    selectedSpaceIds: ['living', 'bed1'],
    recommendationRoom: '거실',
    wishlistCount: 2,
    cartCount: 1,
    layoutItemCount: 3,
  })
  assert.equal(summary.wishlistCount, 2)
  assert.equal(summary.cartCount, 1)
  assert.equal(summary.layoutItemCount, 3)
  assert.equal(summary.hasRecommendationDraft, true)
  assert.equal(summary.resumeToken, 'resume-bootstrap-123')
  assert.equal(summary.nextAction, 'save-layout-draft')
  assert.equal(summary.continuationStatus, 'action-required')
  assert.equal(summary.continuationStatusLabel, '보드 저장 준비')
})

test('buildAuthResultSummary preserves the existing account label and session id when continuation responses omit them', () => {
  const summary = buildAuthResultSummary({
    ok: true,
    status: 200,
    data: {
      nextAction: 'resume-authenticated-flow',
      status: 'ready',
      statusLabel: '프로필 준비 완료',
    },
  }, {
    accountLabel: 'profile@example.com',
    sessionId: 'session-existing-123',
    handoffId: 'auth-profile-123',
    continuation: {
      resumeToken: 'resume-profile-123',
      nextAction: 'complete-profile',
      status: 'action-required',
      statusLabel: '프로필 보완 필요',
    },
  })

  assert.equal(summary.accountLabel, 'profile@example.com')
  assert.equal(summary.sessionId, 'session-existing-123')
  assert.equal(summary.handoffId, 'auth-profile-123')
  assert.equal(summary.resumeToken, 'resume-profile-123')
  assert.equal(summary.nextAction, 'resume-authenticated-flow')
  assert.equal(summary.continuationStatus, 'ready')
  assert.equal(summary.continuationStatusLabel, '프로필 준비 완료')
})

test('buildAuthErrorSummary categorizes backend auth failures for the modal state', () => {
  assert.deepEqual(
    buildAuthErrorSummary({ ok: false, status: 401, data: { message: 'Invalid credentials', resumeToken: 'resume-invalid', nextAction: 'retry-login' } }, {
      handoffId: 'auth-20260406123000-2n9c',
      wishlistCount: 2,
      cartCount: 1,
      layoutItemCount: 3,
      hasRecommendationDraft: true,
    }),
    {
      tone: 'credentials',
      message: 'Invalid credentials',
      summary: {
        handoffId: 'auth-20260406123000-2n9c',
        wishlistCount: 2,
        cartCount: 1,
        layoutItemCount: 3,
        hasRecommendationDraft: true,
      },
      resumeToken: 'resume-invalid',
      nextAction: 'retry-login',
    },
  )

  assert.deepEqual(
    buildAuthErrorSummary({
      ok: false,
      status: 409,
      data: {
        message: 'Guest draft merge confirmation required',
        allowedMergeResolution: 'keep-guest',
        allowedMergeResolutions: ['replace-with-account', 'keep-guest', 'replace-with-account'],
        resumeToken: 'resume-merge',
        nextAction: 'confirm-merge-resolution',
        status: 'action-required',
        statusLabel: '초안 병합 방향 확인 필요',
        mergedGuestDraft: {
          mode: 'merged',
          wishlistCount: 5,
          cartCount: 3,
          layoutItemCount: 7,
          recommendationDraftRestored: true,
        },
      },
    }, {
      handoffId: 'auth-20260406123000-2n9c',
      wishlistCount: 2,
      cartCount: 1,
      layoutItemCount: 3,
      hasRecommendationDraft: true,
    }),
    {
      tone: 'merge',
      message: '현재 게스트 초안과 계정 상태 중 어떤 쪽을 이어갈지 선택해 주세요.',
      summary: {
        handoffId: 'auth-20260406123000-2n9c',
        wishlistCount: 2,
        cartCount: 1,
        layoutItemCount: 3,
        hasRecommendationDraft: true,
      },
      allowedMergeResolutions: ['replace-with-account', 'keep-guest'],
      resumeToken: 'resume-merge',
      nextAction: 'confirm-merge-resolution',
      continuationStatus: 'action-required',
      continuationStatusLabel: '초안 병합 방향 확인 필요',
      mergedDraft: {
        mode: 'merged',
        wishlistCount: 5,
        cartCount: 3,
        layoutItemCount: 7,
        recommendationDraftRestored: true,
      },
    },
  )
})

test('buildAuthErrorSummary keeps service failures frontend-focused for scaffold auth', () => {
  const summary = buildAuthErrorSummary(
    {
      ok: false,
      status: 503,
      data: {
        message: 'GitHub Pages auth backend is not configured yet.',
      },
      meta: {
        authMode: 'remote',
        authTransport: 'unconfigured-pages',
      },
    },
    { handoffId: 'auth-pages-1', wishlistCount: 0, cartCount: 0, layoutItemCount: 0, hasRecommendationDraft: false },
  )

  assert.equal(summary.tone, 'service')
  assert.equal(summary.message, 'GitHub Pages auth backend is not configured yet.')
})

test('buildAuthStatusCopy reflects the staged auth handoff state', () => {
  assert.equal(
    buildAuthStatusCopy(
      'resume-ready',
      { handoffId: 'auth-20260406123000-2n9c', wishlistCount: 0, cartCount: 0, layoutItemCount: 0 },
      {
        resumeToken: 'resume-123',
        nextAction: 'resume-layout-checkout',
        continuationStatusLabel: '프로필 보완 필요',
      },
      null,
      { targetLabel: 'api.example.com', endpoint: '/api/auth/login' },
    ),
    '이전 로그인 시도가 남아 있어요. 이어서 로그인할 수 있어요.',
  )

  assert.equal(
    buildAuthStatusCopy(
      'ready',
      { handoffId: 'auth-20260406123000-2n9c', wishlistCount: 2, cartCount: 1, layoutItemCount: 3 },
      {
        sessionId: 'session-1',
        handoffId: 'auth-20260406123000-2n9c',
        accountLabel: 'user@example.com',
        mergeMode: 'merged',
        resumeToken: 'resume-123',
        nextAction: 'resume-layout-checkout',
        continuationStatusLabel: '프로필 보완 필요',
        authMode: 'scaffold',
        authTransport: 'same-origin-middleware',
      },
    ),
    'user@example.com 계정으로 로그인됐어요.',
  )

  assert.equal(
    buildAuthStatusCopy(
      'error',
      { handoffId: 'auth-20260406123000-2n9c', wishlistCount: 2, cartCount: 1, layoutItemCount: 3 },
      null,
      {
        tone: 'merge',
        message: 'Guest draft merge confirmation required',
        continuationStatusLabel: '초안 병합 방향 확인 필요',
        mergedDraft: {
          wishlistCount: 5,
          cartCount: 3,
          layoutItemCount: 7,
          recommendationDraftRestored: true,
        },
      },
    ),
    'Guest draft merge confirmation required',
  )
})
