import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAuthScaffoldPendingHandoff,
  buildAuthScaffoldPendingResponse,
  buildAuthScaffoldResponse,
  buildAuthScaffoldSessionResponse,
  readAuthScaffoldPending,
  readAuthScaffoldSession,
  resetAuthScaffoldState,
  signOutAuthScaffoldSession,
  submitAuthScaffoldContinuation,
  submitAuthScaffoldRequest,
} from './auth-backend-scaffold.js'

test('buildAuthScaffoldResponse returns a merged session payload for valid credentials', () => {
  const response = buildAuthScaffoldResponse({
    email: 'User@Example.com ',
    password: 'password123',
    intent: {
      source: 'layout-editor',
      action: 'save-layout-draft',
      label: '로그인 후 보드 저장',
      returnScreen: 'layout',
    },
    guestDraftSnapshot: {
      recommendationDraft: { room: '거실' },
      spaceProfile: { spaces: ['living', 'bed1'] },
      continuity: {
        apartmentLabel: '래미안 포레스트 84A',
        selectedRooms: ['거실', '침실'],
        wishlistIds: ['wish-1', 'wish-2'],
        cartItems: [{ id: 'cart-1', qty: 1 }],
        layoutItems: [{ id: 'layout-1' }, { id: 'layout-2' }],
      },
    },
    draftSave: {
      draftLabel: '거실 배치 보드',
      apartmentLabel: '래미안 포레스트 84A',
      recommendationRoom: '거실',
      selectedSpaceIds: ['living', 'bed1'],
      layoutItems: [{ id: 'layout-1' }],
      layoutItemCount: 1,
    },
  })

  assert.equal(response.status, 200)
  assert.equal(response.data.sessionId, 'demo-user-example-com')
  assert.equal(response.data.user.email, 'user@example.com')
  assert.deepEqual(response.data.mergedGuestDraft, {
    mode: 'merged',
    resolution: null,
    count: 2,
    wishlistCount: 2,
    cartCount: 1,
    layoutItemCount: 2,
    recommendationDraftRestored: true,
  })
  assert.deepEqual(response.data.guestDraftSummary, {
    apartmentLabel: '래미안 포레스트 84A',
    selectedRoomCount: 2,
    selectedRooms: ['거실', '침실'],
    selectedSpaceIds: ['living', 'bed1'],
    recommendationRoom: '거실',
    wishlistCount: 2,
    cartCount: 1,
    layoutItemCount: 2,
  })
  assert.deepEqual(response.data.intent, {
    source: 'layout-editor',
    action: 'save-layout-draft',
    label: '로그인 후 보드 저장',
    returnScreen: 'layout',
  })
  assert.deepEqual(response.data.draftSave, {
    draftLabel: '거실 배치 보드',
    apartmentLabel: '래미안 포레스트 84A',
    recommendationRoom: '거실',
    selectedSpaceIds: ['living', 'bed1'],
    layoutItems: [{ id: 'layout-1' }],
    layoutItemCount: 1,
  })
  assert.equal(response.data.resumeToken, null)
  assert.equal(response.data.nextAction, 'save-layout-draft')
})

test('buildAuthScaffoldResponse preserves an upstream continuation contract when intent is not yet finalized', () => {
  const response = buildAuthScaffoldResponse({
    email: 'user@example.com',
    password: 'password123',
    handoffId: 'auth-continue-1234',
    continuation: {
      resumeToken: 'resume-upstream-123',
      nextAction: 'resume-layout-checkout',
      status: 'ready',
      statusLabel: '이어서 진행 가능',
    },
    guestDraftSnapshot: {
      continuity: {
        wishlistIds: ['wish-1'],
        cartItems: [{ id: 'cart-1', qty: 1 }],
        layoutItems: [{ id: 'layout-1' }],
      },
    },
  })

  assert.equal(response.status, 200)
  assert.equal(response.data.resumeToken, 'resume-upstream-123')
  assert.equal(response.data.nextAction, 'resume-layout-checkout')
  assert.equal(response.data.status, 'ready')
  assert.equal(response.data.statusLabel, '이어서 진행 가능')
  assert.equal(response.data.handoffId, 'auth-continue-1234')
})

test('buildAuthScaffoldResponse derives canonical continuation actions from intent before the backend is wired', () => {
  const loginResponse = buildAuthScaffoldResponse({
    email: 'user@example.com',
    password: 'password123',
    handoffId: 'auth-login-1234',
    intent: {
      source: 'header',
      action: 'login',
      label: '기본 로그인',
      returnScreen: 'home',
    },
  })

  assert.equal(loginResponse.status, 200)
  assert.equal(loginResponse.data.nextAction, 'resume-authenticated-flow')
  assert.equal(loginResponse.data.resumeToken, 'auth-login-1234:resume')

  const checkoutResponse = buildAuthScaffoldResponse({
    email: 'user@example.com',
    password: 'password123',
    handoffId: 'auth-checkout-1234',
    intent: {
      source: 'cart-drawer',
      action: 'checkout',
      label: '로그인 후 주문 이어가기',
      returnScreen: 'home',
    },
  })

  assert.equal(checkoutResponse.status, 200)
  assert.equal(checkoutResponse.data.nextAction, 'checkout-cart')
  assert.equal(checkoutResponse.data.resumeToken, 'auth-checkout-1234:resume')
})

test('buildAuthScaffoldResponse derives an action-required blocker for complete-profile auth steps', () => {
  const response = buildAuthScaffoldResponse({
    email: 'user@example.com',
    password: 'password123',
    handoffId: 'auth-continue-1234',
    continuation: {
      resumeToken: 'resume-upstream-123',
      nextAction: 'complete-profile',
    },
  })

  assert.equal(response.status, 200)
  assert.equal(response.data.nextAction, 'complete-profile')
  assert.equal(response.data.status, 'action-required')
  assert.equal(response.data.statusLabel, '프로필 보완 필요')
})

test('buildAuthScaffoldResponse can expose demo action-required blockers directly from login credentials', () => {
  const profileResponse = buildAuthScaffoldResponse({
    email: 'profile@example.com',
    password: 'password123',
    handoffId: 'auth-demo-profile-1234',
  })
  const verifyResponse = buildAuthScaffoldResponse({
    email: 'verify@example.com',
    password: 'password123',
    handoffId: 'auth-demo-verify-1234',
  })

  assert.equal(profileResponse.status, 200)
  assert.equal(profileResponse.data.nextAction, 'complete-profile')
  assert.equal(profileResponse.data.status, 'action-required')
  assert.equal(profileResponse.data.statusLabel, '프로필 보완 필요')

  assert.equal(verifyResponse.status, 200)
  assert.equal(verifyResponse.data.nextAction, 'verify-email')
  assert.equal(verifyResponse.data.status, 'action-required')
  assert.equal(verifyResponse.data.statusLabel, '이메일 인증 필요')
})

test('buildAuthScaffoldResponse returns 409 for the merge-conflict demo password', () => {
  const response = buildAuthScaffoldResponse({
    email: 'user@example.com',
    password: 'merge-conflict',
    handoffId: 'auth-merge-1234',
    guestDraftSnapshot: {
      continuity: {
        wishlistIds: ['wish-1'],
        cartItems: [],
        layoutItems: [{ id: 'layout-1' }],
      },
    },
  })

  assert.equal(response.status, 409)
  assert.equal(response.data.message, 'Guest draft merge confirmation required')
  assert.equal(response.data.allowedMergeResolution, 'keep-guest')
  assert.equal(response.data.resumeToken, 'auth-merge-1234:merge')
  assert.equal(response.data.nextAction, 'confirm-merge-resolution')
  assert.equal(response.data.status, 'action-required')
  assert.equal(response.data.statusLabel, '초안 병합 방향 확인 필요')
  assert.equal(response.data.mergedGuestDraft.layoutItemCount, 1)
})

test('buildAuthScaffoldResponse accepts an explicit merge confirmation for the guest draft retry', () => {
  const response = buildAuthScaffoldResponse({
    email: 'user@example.com',
    password: 'merge-conflict',
    handoffId: 'auth-merge-1234',
    mergeResolution: 'keep-guest',
    guestDraftSnapshot: {
      continuity: {
        wishlistIds: ['wish-1'],
        cartItems: [],
        layoutItems: [{ id: 'layout-1' }],
      },
    },
  })

  assert.equal(response.status, 200)
  assert.equal(response.data.mergedGuestDraft.mode, 'merge-confirmed')
  assert.equal(response.data.mergedGuestDraft.resolution, 'keep-guest')
  assert.equal(response.data.resumeToken, 'auth-merge-1234:resume')
  assert.equal(response.data.nextAction, 'resume-guest-draft')
})

test('buildAuthScaffoldResponse can switch to the account state after a merge conflict confirmation', () => {
  const response = buildAuthScaffoldResponse({
    email: 'user@example.com',
    password: 'merge-conflict',
    handoffId: 'auth-merge-1234',
    mergeResolution: 'replace-with-account',
    guestDraftSnapshot: {
      continuity: {
        wishlistIds: ['wish-1'],
        cartItems: [],
        layoutItems: [{ id: 'layout-1' }],
      },
    },
  })

  assert.equal(response.status, 200)
  assert.equal(response.data.mergedGuestDraft.mode, 'replaced')
  assert.equal(response.data.mergedGuestDraft.resolution, 'replace-with-account')
  assert.equal(response.data.resumeToken, 'auth-merge-1234:resume')
  assert.equal(response.data.nextAction, 'resume-account-state')
  assert.deepEqual(response.data.accountState, {
    wishlistIds: [],
    cartItems: [],
    layoutItems: [],
    recommendationDraft: null,
  })
})

test('submitAuthScaffoldContinuation carries serialized draft-save payload through merge confirmation resume', () => {
  resetAuthScaffoldState()

  submitAuthScaffoldRequest({
    request: {
      email: 'user@example.com',
      password: 'merge-conflict',
      handoffId: 'auth-merge-1234',
      intent: {
        source: 'layout-editor',
        action: 'save-layout-draft',
        label: '로그인 후 보드 저장',
        returnScreen: 'layout',
      },
      guestDraftSnapshot: {
        recommendationDraft: { room: '거실' },
        spaceProfile: { spaces: ['living', 'bed1'] },
        continuity: {
          apartmentLabel: '래미안 포레스트 84A',
          wishlistIds: ['wish-1'],
          cartItems: [],
          layoutItems: [{ id: 'layout-1' }],
        },
      },
    },
  })

  const resumed = submitAuthScaffoldContinuation({
    request: {
      handoffId: 'auth-merge-1234',
      continuation: {
        resumeToken: 'auth-merge-1234:merge',
        nextAction: 'confirm-merge-resolution',
      },
      fields: {
        mergeResolution: 'keep-guest',
      },
      draftSave: {
        draftLabel: '거실 배치 보드',
        apartmentLabel: '래미안 포레스트 84A',
        recommendationRoom: '거실',
        selectedSpaceIds: ['living', 'bed1'],
        layoutItems: [{ id: 'layout-1', sourceId: 'sofa-001', x: 10, y: 20, rotation: 0, colorIndex: 2 }],
      },
    },
  })

  assert.equal(resumed.status, 200)
  assert.equal(resumed.data.nextAction, 'save-layout-draft')
  assert.deepEqual(resumed.data.draftSave, {
    draftLabel: '거실 배치 보드',
    apartmentLabel: '래미안 포레스트 84A',
    recommendationRoom: '거실',
    selectedSpaceIds: ['living', 'bed1'],
    layoutItems: [{ id: 'layout-1', sourceId: 'sofa-001', x: 10, y: 20, rotation: 0, colorIndex: 2 }],
    layoutItemCount: 1,
  })
})

test('buildAuthScaffoldResponse rejects short passwords and malformed emails', () => {
  const response = buildAuthScaffoldResponse({
    email: 'not-an-email',
    password: 'short',
    handoffId: 'auth-invalid-1234',
  })

  assert.equal(response.status, 401)
  assert.deepEqual(response.data, {
    message: 'Invalid credentials',
    handoffId: 'auth-invalid-1234',
    resumeToken: 'auth-invalid-1234:retry',
    nextAction: 'retry-login',
  })
})

test('submitAuthScaffoldRequest can hydrate session connection metadata directly from the serialized request contract', () => {
  resetAuthScaffoldState()

  const response = submitAuthScaffoldRequest({
    request: {
      email: 'user@example.com',
      password: 'password123',
      handoffId: 'auth-serialized-connection-1',
      connection: {
        method: 'POST',
        endpoint: '/api/auth/login',
        resolvedUrl: 'https://api.example.com/api/auth/login',
        targetLabel: 'api.example.com',
        isExternal: true,
        isSameOriginScaffold: false,
        credentialsMode: 'include',
        source: 'runtime',
      },
    },
  })

  assert.equal(response.status, 200)
  assert.deepEqual(response.data.connection, {
    method: 'POST',
    endpoint: '/api/auth/login',
    resolvedUrl: 'https://api.example.com/api/auth/login',
    targetLabel: 'api.example.com',
    isExternal: true,
    isSameOriginScaffold: false,
    credentialsMode: 'include',
    source: 'runtime',
  })
  assert.deepEqual(readAuthScaffoldSession().data.connection, {
    method: 'POST',
    endpoint: '/api/auth/login',
    resolvedUrl: 'https://api.example.com/api/auth/login',
    targetLabel: 'api.example.com',
    isExternal: true,
    isSameOriginScaffold: false,
    credentialsMode: 'include',
    source: 'runtime',
  })
})

test('buildAuthScaffoldSessionResponse exposes the latest scaffold auth session payload', () => {
  const response = buildAuthScaffoldSessionResponse({
    ok: true,
    sessionId: 'demo-user-example-com',
    user: {
      email: 'user@example.com',
      name: 'user@example.com',
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
    resumeToken: 'auth-user-1234:resume',
    nextAction: 'checkout-cart',
  })

  assert.equal(response.status, 200)
  assert.equal(response.data.sessionId, 'demo-user-example-com')
  assert.equal(response.data.user.email, 'user@example.com')
  assert.deepEqual(response.data.connection, {
    method: 'POST',
    endpoint: '/api/auth/login',
    resolvedUrl: '/api/auth/login',
    targetLabel: 'same-origin /api auth scaffold',
    isExternal: false,
    isSameOriginScaffold: true,
    credentialsMode: 'include',
    source: 'default',
  })
  assert.equal(response.data.resumeToken, 'auth-user-1234:resume')
  assert.equal(response.data.nextAction, 'checkout-cart')
})

test('buildAuthScaffoldSessionResponse returns 401 when no scaffold auth session exists', () => {
  const response = buildAuthScaffoldSessionResponse(null)

  assert.equal(response.status, 401)
  assert.deepEqual(response.data, {
    message: 'No scaffold auth session',
    nextAction: 'login-required',
  })
})

test('buildAuthScaffoldPendingHandoff keeps guest draft counts and continuation status for interrupted login retries', () => {
  const pending = buildAuthScaffoldPendingHandoff({
    submittedAt: '2026-04-07T00:20:00.000Z',
    request: {
      email: 'user@example.com',
      handoffId: 'auth-20260407002000-abcd',
      mergeResolution: null,
      intent: {
        source: 'layout-editor',
        action: 'save-layout-draft',
        label: '로그인 후 보드 저장',
        returnScreen: 'layout',
      },
      continuation: {
        resumeToken: 'auth-20260407002000-abcd:merge',
        nextAction: 'confirm-merge-resolution',
        status: 'action-required',
        statusLabel: '병합 확인 필요',
      },
      guestDraftSnapshot: {
        recommendationDraft: { room: '거실' },
        spaceProfile: { spaces: ['living', 'bed1'] },
        continuity: {
          apartmentLabel: '래미안 포레스트 84A',
          selectedRooms: ['거실', '침실'],
          wishlistIds: ['wish-1', 'wish-2'],
          cartItems: [{ id: 'cart-1', qty: 1 }],
          layoutItems: [{ id: 'layout-1' }, { id: 'layout-2' }],
        },
      },
    },
    response: {
      status: 409,
      data: {
        message: 'Guest draft merge confirmation required',
        allowedMergeResolutions: ['keep-guest', 'replace-with-account'],
        resumeToken: 'auth-20260407002000-abcd:merge',
        nextAction: 'confirm-merge-resolution',
        status: 'action-required',
        statusLabel: '병합 확인 필요',
      },
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
  })

  assert.deepEqual(pending, {
    submittedAt: '2026-04-07T00:20:00.000Z',
    handoffId: 'auth-20260407002000-abcd',
    endpoint: '/api/auth/login',
    method: 'POST',
    email: 'user@example.com',
    request: {
      email: 'user@example.com',
      handoffId: 'auth-20260407002000-abcd',
      mergeResolution: null,
      intent: {
        source: 'layout-editor',
        action: 'save-layout-draft',
        label: '로그인 후 보드 저장',
        returnScreen: 'layout',
      },
      continuation: {
        resumeToken: 'auth-20260407002000-abcd:merge',
        nextAction: 'confirm-merge-resolution',
        status: 'action-required',
        statusLabel: '병합 확인 필요',
      },
      guestDraftSnapshot: {
        recommendationDraft: { room: '거실' },
        spaceProfile: { spaces: ['living', 'bed1'] },
        continuity: {
          apartmentLabel: '래미안 포레스트 84A',
          selectedRooms: ['거실', '침실'],
          wishlistIds: ['wish-1', 'wish-2'],
          cartItems: [{ id: 'cart-1', qty: 1 }],
          layoutItems: [{ id: 'layout-1' }, { id: 'layout-2' }],
        },
      },
    },
    summary: {
      email: 'user@example.com',
      handoffId: 'auth-20260407002000-abcd',
      wishlistCount: 2,
      cartCount: 1,
      layoutItemCount: 2,
      hasRecommendationDraft: true,
      mergeResolution: null,
      intent: {
        source: 'layout-editor',
        action: 'save-layout-draft',
        label: '로그인 후 보드 저장',
        returnScreen: 'layout',
      },
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
    continuation: {
      resumeToken: 'auth-20260407002000-abcd:merge',
      nextAction: 'confirm-merge-resolution',
      status: 'action-required',
      statusLabel: '병합 확인 필요',
    },
    continuationFields: null,
    draftSave: null,
    guestDraftSnapshot: {
      recommendationDraft: { room: '거실' },
      spaceProfile: { spaces: ['living', 'bed1'] },
      continuity: {
        apartmentLabel: '래미안 포레스트 84A',
        selectedRooms: ['거실', '침실'],
        wishlistIds: ['wish-1', 'wish-2'],
        cartItems: [{ id: 'cart-1', qty: 1 }],
        layoutItems: [{ id: 'layout-1' }, { id: 'layout-2' }],
      },
    },
    guestDraftSummary: {
      apartmentLabel: '래미안 포레스트 84A',
      selectedRoomCount: 2,
      selectedRooms: ['거실', '침실'],
      selectedSpaceIds: ['living', 'bed1'],
      recommendationRoom: '거실',
      wishlistCount: 2,
      cartCount: 1,
      layoutItemCount: 2,
    },
    allowedMergeResolutions: ['keep-guest', 'replace-with-account'],
    error: 'Guest draft merge confirmation required',
    status: 409,
  })
})

test('buildAuthScaffoldPendingResponse exposes the latest interrupted auth handoff payload', () => {
  const response = buildAuthScaffoldPendingResponse({
    submittedAt: '2026-04-07T00:20:00.000Z',
    handoffId: 'auth-20260407002000-abcd',
    email: 'user@example.com',
    continuation: {
      resumeToken: 'auth-20260407002000-abcd:merge',
      nextAction: 'confirm-merge-resolution',
      status: 'action-required',
      statusLabel: '병합 확인 필요',
    },
    summary: {
      email: 'user@example.com',
      handoffId: 'auth-20260407002000-abcd',
      wishlistCount: 2,
      cartCount: 1,
      layoutItemCount: 2,
      hasRecommendationDraft: true,
      mergeResolution: null,
      intent: {
        source: 'layout-editor',
        action: 'save-layout-draft',
        label: '로그인 후 보드 저장',
        returnScreen: 'layout',
      },
    },
    status: 409,
  })

  assert.equal(response.status, 200)
  assert.deepEqual(response.data, {
    submittedAt: '2026-04-07T00:20:00.000Z',
    handoffId: 'auth-20260407002000-abcd',
    email: 'user@example.com',
    continuation: {
      resumeToken: 'auth-20260407002000-abcd:merge',
      nextAction: 'confirm-merge-resolution',
      status: 'action-required',
      statusLabel: '병합 확인 필요',
    },
    summary: {
      email: 'user@example.com',
      handoffId: 'auth-20260407002000-abcd',
      wishlistCount: 2,
      cartCount: 1,
      layoutItemCount: 2,
      hasRecommendationDraft: true,
      mergeResolution: null,
      intent: {
        source: 'layout-editor',
        action: 'save-layout-draft',
        label: '로그인 후 보드 저장',
        returnScreen: 'layout',
      },
    },
    status: 409,
  })
})

test('buildAuthScaffoldPendingResponse returns 404 when no interrupted auth handoff exists', () => {
  const response = buildAuthScaffoldPendingResponse(null)

  assert.equal(response.status, 404)
  assert.deepEqual(response.data, {
    message: 'No scaffold auth handoff',
    nextAction: 'login-required',
  })
})

test('buildAuthScaffoldPendingHandoff lifts serializable draft-save and continuation field state to the top level for frontend bootstrap', () => {
  const pending = buildAuthScaffoldPendingHandoff({
    request: {
      email: 'profile@example.com',
      handoffId: 'auth-pending-serialized-1',
      intent: {
        source: 'layout-editor',
        action: 'save-layout-draft',
        label: '로그인 후 보드 저장',
        returnScreen: 'layout',
      },
      continuation: {
        resumeToken: 'auth-pending-serialized-1:profile',
        nextAction: 'complete-profile',
        status: 'action-required',
        statusLabel: '프로필 보완 필요',
      },
      fields: {
        displayName: 'Havenly User',
        phone: '010-1234-5678',
      },
      draftSave: {
        draftLabel: '거실 배치 보드',
        apartmentLabel: '래미안 포레스트 84A',
        recommendationRoom: '거실',
        selectedSpaceIds: ['living', 'bed1'],
        layoutItems: [{ id: 'layout-1' }],
        layoutItemCount: 1,
      },
      guestDraftSnapshot: {
        recommendationDraft: { room: '거실' },
        spaceProfile: { spaces: ['living', 'bed1'] },
        continuity: {
          apartmentLabel: '래미안 포레스트 84A',
          layoutItems: [{ id: 'layout-1' }, { id: 'layout-2' }],
        },
      },
    },
    response: {
      status: 422,
      data: {
        message: 'Profile completion fields required',
        resumeToken: 'auth-pending-serialized-1:profile',
        nextAction: 'complete-profile',
        status: 'action-required',
        statusLabel: '프로필 보완 필요',
      },
    },
  })

  assert.deepEqual(pending.continuationFields, {
    displayName: 'Havenly User',
    phone: '010-1234-5678',
  })
  assert.deepEqual(pending.draftSave, {
    draftLabel: '거실 배치 보드',
    apartmentLabel: '래미안 포레스트 84A',
    recommendationRoom: '거실',
    selectedSpaceIds: ['living', 'bed1'],
    layoutItems: [{ id: 'layout-1' }],
    layoutItemCount: 1,
  })
})


test('submitAuthScaffoldContinuation can complete a profile blocker and restore the saved continuation target', () => {
  resetAuthScaffoldState()

  submitAuthScaffoldRequest({
    request: {
      email: 'user@example.com',
      password: 'password123',
      handoffId: 'auth-profile-1',
      intent: {
        source: 'layout-editor',
        action: 'save-layout-draft',
        label: '로그인 후 보드 저장',
        returnScreen: 'layout',
      },
      continuation: {
        resumeToken: 'auth-profile-1:profile',
        nextAction: 'complete-profile',
      },
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
  })

  const blocked = submitAuthScaffoldContinuation({
    request: {
      handoffId: 'auth-profile-1',
      continuation: {
        resumeToken: 'auth-profile-1:profile',
        nextAction: 'complete-profile',
      },
      fields: {
        displayName: '  ',
      },
    },
  })

  assert.equal(blocked.status, 422)
  assert.equal(blocked.data.nextAction, 'complete-profile')
  assert.equal(blocked.data.status, 'action-required')

  const completed = submitAuthScaffoldContinuation({
    request: {
      handoffId: 'auth-profile-1',
      continuation: {
        resumeToken: 'auth-profile-1:profile',
        nextAction: 'complete-profile',
      },
      fields: {
        displayName: 'Havenly User',
        phone: '010-1234-5678',
      },
      draftSave: {
        draftLabel: '거실 배치 보드',
        apartmentLabel: '래미안 포레스트 84A',
        recommendationRoom: '거실',
        selectedSpaceIds: ['living', 'bed1'],
        layoutItems: [{ id: 'layout-1' }],
        layoutItemCount: 1,
      },
    },
  })

  assert.equal(completed.status, 200)
  assert.equal(completed.data.nextAction, 'save-layout-draft')
  assert.equal(completed.data.status, 'ready')
  assert.equal(completed.data.connection?.endpoint, '/api/auth/login')
  assert.deepEqual(completed.data.profile, {
    displayName: 'Havenly User',
    phone: '010-1234-5678',
  })
  assert.deepEqual(completed.data.draftSave, {
    draftLabel: '거실 배치 보드',
    apartmentLabel: '래미안 포레스트 84A',
    recommendationRoom: '거실',
    selectedSpaceIds: ['living', 'bed1'],
    layoutItems: [{ id: 'layout-1' }],
    layoutItemCount: 1,
  })
})

test('submitAuthScaffoldContinuation falls back to the generic authenticated flow after a blocker-only profile intent is completed', () => {
  resetAuthScaffoldState()

  submitAuthScaffoldRequest({
    request: {
      email: 'profile@example.com',
      password: 'password123',
      handoffId: 'auth-profile-blocker-only',
      intent: {
        source: 'login-modal',
        action: 'complete-profile',
        label: '프로필 마무리',
        returnScreen: 'home',
      },
    },
  })

  const completed = submitAuthScaffoldContinuation({
    request: {
      handoffId: 'auth-profile-blocker-only',
      continuation: {
        resumeToken: 'auth-profile-blocker-only:resume',
        nextAction: 'complete-profile',
      },
      fields: {
        displayName: 'Havenly User',
        phone: '010-1234-5678',
      },
    },
  })

  assert.equal(completed.status, 200)
  assert.equal(completed.data.nextAction, 'resume-authenticated-flow')
  assert.equal(completed.data.status, 'ready')
  assert.equal(completed.data.statusLabel, '프로필 준비 완료')
})

test('submitAuthScaffoldContinuation can recover the intended post-login flow from the continuation payload when the stored session intent is sparse', () => {
  resetAuthScaffoldState()

  submitAuthScaffoldRequest({
    request: {
      email: 'profile@example.com',
      password: 'password123',
      handoffId: 'auth-profile-intent-recovery',
      continuation: {
        resumeToken: 'auth-profile-intent-recovery:profile',
        nextAction: 'complete-profile',
      },
    },
  })

  const completed = submitAuthScaffoldContinuation({
    request: {
      handoffId: 'auth-profile-intent-recovery',
      continuation: {
        resumeToken: 'auth-profile-intent-recovery:profile',
        nextAction: 'complete-profile',
      },
      intent: {
        source: 'layout-editor',
        action: 'save-layout-draft',
        label: '로그인 후 보드 저장',
        returnScreen: 'layout',
      },
      fields: {
        displayName: 'Havenly User',
        phone: '010-1234-5678',
      },
    },
  })

  assert.equal(completed.status, 200)
  assert.equal(completed.data.nextAction, 'save-layout-draft')
  assert.equal(completed.data.status, 'ready')
  assert.deepEqual(completed.data.intent, {
    source: 'layout-editor',
    action: 'save-layout-draft',
    label: '로그인 후 보드 저장',
    returnScreen: 'layout',
  })
})

test('submitAuthScaffoldContinuation falls back to the generic authenticated flow after a blocker-only email verification intent is completed', () => {
  resetAuthScaffoldState()

  submitAuthScaffoldRequest({
    request: {
      email: 'verify@example.com',
      password: 'password123',
      handoffId: 'auth-verify-blocker-only',
      intent: {
        source: 'login-modal',
        action: 'verify-email',
        label: '이메일 인증 이어가기',
        returnScreen: 'home',
      },
    },
  })

  const completed = submitAuthScaffoldContinuation({
    request: {
      handoffId: 'auth-verify-blocker-only',
      continuation: {
        resumeToken: 'auth-verify-blocker-only:resume',
        nextAction: 'verify-email',
      },
      fields: {
        verificationCode: '123456',
      },
    },
  })

  assert.equal(completed.status, 200)
  assert.equal(completed.data.nextAction, 'resume-authenticated-flow')
  assert.equal(completed.data.status, 'ready')
  assert.equal(completed.data.statusLabel, '이메일 인증 완료')
})

test('submitAuthScaffoldContinuation can resolve a pending merge handoff into a scaffold session', () => {
  resetAuthScaffoldState()

  const connection = {
    method: 'POST',
    endpoint: '/api/auth/login',
    resolvedUrl: 'https://havenly.example.com/api/auth/login',
    targetLabel: 'same-origin /api auth scaffold',
    isExternal: false,
    isSameOriginScaffold: true,
    credentialsMode: 'include',
    source: 'default',
  }

  submitAuthScaffoldRequest({
    request: {
      email: 'merge@example.com',
      password: 'merge-conflict',
      handoffId: 'auth-merge-cont-1',
      intent: {
        source: 'layout-editor',
        action: 'save-layout-draft',
        label: '로그인 후 보드 저장',
        returnScreen: 'layout',
      },
      guestDraftSnapshot: {
        continuity: {
          wishlistIds: ['wish-1'],
          cartItems: [{ id: 'cart-1', qty: 1 }],
          layoutItems: [{ id: 'layout-1' }],
        },
      },
    },
    connection,
  })

  const missingResolution = submitAuthScaffoldContinuation({
    request: {
      handoffId: 'auth-merge-cont-1',
      continuation: {
        resumeToken: 'auth-merge-cont-1:merge',
        nextAction: 'confirm-merge-resolution',
      },
      fields: {},
    },
    connection,
  })

  assert.equal(missingResolution.status, 422)
  assert.equal(missingResolution.data.nextAction, 'confirm-merge-resolution')
  assert.deepEqual(missingResolution.data.allowedMergeResolutions, ['keep-guest', 'replace-with-account'])

  const resolved = submitAuthScaffoldContinuation({
    request: {
      handoffId: 'auth-merge-cont-1',
      continuation: {
        resumeToken: 'auth-merge-cont-1:merge',
        nextAction: 'confirm-merge-resolution',
      },
      fields: {
        mergeResolution: 'replace-with-account',
      },
    },
    connection,
  })

  assert.equal(resolved.status, 200)
  assert.equal(resolved.data.handoffId, 'auth-merge-cont-1')
  assert.equal(resolved.data.nextAction, 'save-layout-draft')
  assert.equal(resolved.data.status, 'ready')
  assert.equal(resolved.data.accountState?.wishlistIds?.length, 0)
  assert.equal(readAuthScaffoldPending().status, 404)
  assert.equal(readAuthScaffoldSession().status, 200)
})

test('stateful scaffold helpers preserve pending handoffs, session bootstrap, and logout teardown', () => {
  resetAuthScaffoldState()

  const connection = {
    method: 'POST',
    endpoint: '/api/auth/login',
    resolvedUrl: 'https://havenly.example.com/api/auth/login',
    targetLabel: 'same-origin /api auth scaffold',
    isExternal: false,
    isSameOriginScaffold: true,
    credentialsMode: 'include',
    source: 'default',
  }

  const mergePrompt = submitAuthScaffoldRequest({
    request: {
      email: 'merge@example.com',
      password: 'merge-conflict',
      handoffId: 'auth-stateful-merge-1',
      guestDraftSnapshot: {
        continuity: {
          wishlistIds: ['wish-1'],
          cartItems: [{ id: 'cart-1', qty: 1 }],
          layoutItems: [{ id: 'layout-1' }],
        },
      },
    },
    connection,
    submittedAt: '2026-04-08T03:10:00.000Z',
  })

  assert.equal(mergePrompt.status, 409)
  assert.equal(readAuthScaffoldSession().status, 401)
  assert.equal(readAuthScaffoldPending().status, 200)
  assert.equal(readAuthScaffoldPending().data.handoffId, 'auth-stateful-merge-1')
  assert.equal(readAuthScaffoldPending().data.connection.targetLabel, 'same-origin /api auth scaffold')
  assert.equal(readAuthScaffoldPending().data.draftSave, null)
  assert.equal(readAuthScaffoldPending().data.continuationFields, null)

  const mergeResolved = submitAuthScaffoldRequest({
    request: {
      email: 'merge@example.com',
      password: 'merge-conflict',
      handoffId: 'auth-stateful-merge-1',
      mergeResolution: 'keep-guest',
      guestDraftSnapshot: {
        continuity: {
          wishlistIds: ['wish-1'],
          cartItems: [{ id: 'cart-1', qty: 1 }],
          layoutItems: [{ id: 'layout-1' }],
        },
      },
    },
    connection,
  })

  assert.equal(mergeResolved.status, 200)
  assert.equal(readAuthScaffoldPending().status, 404)
  assert.equal(readAuthScaffoldSession().status, 200)
  assert.equal(readAuthScaffoldSession().data.handoffId, 'auth-stateful-merge-1')
  assert.equal(readAuthScaffoldSession().data.connection.resolvedUrl, 'https://havenly.example.com/api/auth/login')

  const logout = signOutAuthScaffoldSession()
  assert.equal(logout.status, 200)
  assert.equal(logout.data.nextAction, 'login-required')
  assert.equal(logout.data.connection.targetLabel, 'same-origin /api auth scaffold')
  assert.equal(readAuthScaffoldSession().status, 401)
  assert.equal(readAuthScaffoldPending().status, 404)
})
