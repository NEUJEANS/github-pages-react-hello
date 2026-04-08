import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAuthContinuationPlan,
  buildAuthErrorSummary,
  buildAuthResultSummary,
  buildAuthStatusCopy,
  buildAuthSubmitPlan,
  buildGuestDraftSnapshot,
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
    },
  })
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
    fields: {
      displayName: ' Havenly User ',
      phone: ' 010-1234-5678 ',
      ignored: undefined,
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
  })
  assert.deepEqual(plan.summary, {
    handoffId: 'auth-continue-123',
    continuation: {
      resumeToken: 'resume-123',
      nextAction: 'complete-profile',
      status: 'action-required',
      statusLabel: '프로필 보완 필요',
    },
    fieldCount: 2,
    requiredFields: ['displayName', 'phone'],
    missingFields: [],
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
  })
  assert.deepEqual(plan.summary, {
    handoffId: 'auth-continue-123',
    continuation: {
      resumeToken: 'resume-123',
      nextAction: 'verify-email',
      status: 'action-required',
      statusLabel: '이메일 인증 필요',
    },
    fieldCount: 1,
    requiredFields: ['verificationCode'],
    missingFields: ['verificationCode'],
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
    resumeToken: 'resume-123',
    nextAction: 'resume-layout-checkout',
    continuationStatus: 'action-required',
    continuationStatusLabel: '프로필 보완 필요',
    authMode: 'scaffold',
    authTransport: 'same-origin-middleware',
  })
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
      message: 'Guest draft merge confirmation required',
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
    },
  )
})

test('buildAuthStatusCopy reflects the staged auth handoff state', () => {
  assert.match(
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
    /handoff auth-20260406123000-2n9c.*api\.example\.com.*\/api\/auth\/login.*resume-layout-checkout.*resume-123.*프로필 보완 필요/,
  )

  assert.match(
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
    /user@example.com 계정과 연결 준비됨.*handoff auth-20260406123000-2n9c.*session-1.*게스트 초안 병합 완료.*same-origin scaffold로 응답 확인.*resume-layout-checkout.*resume-123.*프로필 보완 필요/,
  )
})
