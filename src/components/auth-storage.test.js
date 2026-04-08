import test from 'node:test'
import assert from 'node:assert/strict'

import {
  AUTH_HANDOFF_STORAGE_KEY,
  AUTH_SESSION_STORAGE_KEY,
  buildAuthConnectionSummary,
  buildAuthReadyState,
  buildAuthResumeState,
  buildGuestDraftSessionSummary,
  buildSerializableAuthConnection,
  buildSerializableAuthContinuation,
  buildSerializableAuthContinuationFields,
  buildSerializableAuthIntent,
  buildPersistedAuthHandoff,
  buildPersistedAuthSession,
  clearPersistedAuthHandoff,
  clearPersistedAuthSession,
  createAuthHandoffId,
  persistAuthHandoff,
  persistAuthSession,
  readPersistedAuthHandoff,
  readPersistedAuthSession,
} from './auth-storage.js'

function createMemoryStorage() {
  const map = new Map()

  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null
    },
    setItem(key, value) {
      map.set(key, value)
    },
    removeItem(key) {
      map.delete(key)
    },
  }
}

test('buildAuthConnectionSummary resolves same-origin and external auth targets', () => {
  assert.deepEqual(
    buildAuthConnectionSummary({ endpoint: '/api/auth/login', method: 'POST' }),
    {
      method: 'POST',
      endpoint: '/api/auth/login',
      resolvedUrl: '/api/auth/login',
      targetLabel: 'same-origin /api auth scaffold',
      isExternal: false,
      isSameOriginScaffold: true,
      credentialsMode: 'include',
      source: 'default',
    },
  )

  assert.deepEqual(
    buildAuthConnectionSummary(
      { endpoint: '/api/auth/login', method: 'POST' },
      { apiBaseUrl: 'https://havenly.example.com', currentOrigin: 'https://havenly.example.com' },
    ),
    {
      method: 'POST',
      endpoint: '/api/auth/login',
      resolvedUrl: 'https://havenly.example.com/api/auth/login',
      targetLabel: 'same-origin /api auth scaffold',
      isExternal: false,
      isSameOriginScaffold: true,
      credentialsMode: 'include',
      source: 'default',
    },
  )

  assert.deepEqual(
    buildAuthConnectionSummary(
      { endpoint: '/api/auth/login', method: 'POST' },
      { apiBaseUrl: 'https://api.example.com', currentOrigin: 'https://havenly.example.com' },
    ),
    {
      method: 'POST',
      endpoint: '/api/auth/login',
      resolvedUrl: 'https://api.example.com/api/auth/login',
      targetLabel: 'api.example.com',
      isExternal: true,
      isSameOriginScaffold: false,
      credentialsMode: 'include',
      source: 'default',
    },
  )

  assert.deepEqual(
    buildAuthConnectionSummary(
      { endpoint: '/api/auth/continue', method: 'POST' },
      { appBasePath: '/github-pages-react-hello/', currentOrigin: 'https://havenly.example.com' },
    ),
    {
      method: 'POST',
      endpoint: '/api/auth/continue',
      resolvedUrl: '/github-pages-react-hello/api/auth/continue',
      targetLabel: 'same-origin /api auth scaffold',
      isExternal: false,
      isSameOriginScaffold: true,
      credentialsMode: 'include',
      source: 'default',
    },
  )

  assert.deepEqual(
    buildAuthConnectionSummary(
      { endpoint: '/api/auth/continue', method: 'POST' },
      {
        apiBaseUrl: 'https://havenly.example.com',
        appBasePath: '/github-pages-react-hello/',
        currentOrigin: 'https://havenly.example.com',
      },
    ),
    {
      method: 'POST',
      endpoint: '/api/auth/continue',
      resolvedUrl: 'https://havenly.example.com/github-pages-react-hello/api/auth/continue',
      targetLabel: 'same-origin /api auth scaffold',
      isExternal: false,
      isSameOriginScaffold: true,
      credentialsMode: 'include',
      source: 'default',
    },
  )
})

test('createAuthHandoffId creates a compact serializable correlation id for login handoffs', () => {
  const handoffId = createAuthHandoffId({
    now: new Date('2026-04-06T12:30:00.000Z'),
    random: () => 0.123456,
  })

  assert.equal(handoffId, 'auth-20260406123000-2n9c')
})

test('buildSerializableAuthConnection trims auth target metadata down to serializable backend wiring fields', () => {
  assert.deepEqual(buildSerializableAuthConnection({
    method: ' POST ',
    endpoint: ' /api/auth/login ',
    resolvedUrl: ' https://api.example.com/api/auth/login ',
    targetLabel: ' api.example.com ',
    isExternal: true,
    isSameOriginScaffold: false,
    credentialsMode: ' include ',
    source: ' runtime ',
    ignored: { nested: true },
  }), {
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

test('buildSerializableAuthContinuation keeps backend resume contract fields compact and serializable', () => {
  assert.deepEqual(buildSerializableAuthContinuation({
    resumeToken: ' resume-123 ',
    nextAction: ' confirm-merge-resolution ',
    status: ' action-required ',
    statusLabel: ' 프로필 보완 필요 ',
    ignored: { nested: true },
  }), {
    resumeToken: 'resume-123',
    nextAction: 'confirm-merge-resolution',
    status: 'action-required',
    statusLabel: '프로필 보완 필요',
  })

  assert.deepEqual(buildSerializableAuthContinuation({
    resumeToken: ' resume-legacy-123 ',
    nextAction: ' checkout ',
  }), {
    resumeToken: 'resume-legacy-123',
    nextAction: 'checkout-cart',
    status: null,
    statusLabel: null,
  })

  assert.deepEqual(buildSerializableAuthContinuation({
    resumeToken: ' resume-legacy-login-123 ',
    nextAction: ' login ',
  }), {
    resumeToken: 'resume-legacy-login-123',
    nextAction: 'resume-authenticated-flow',
    status: null,
    statusLabel: null,
  })
})

test('buildSerializableAuthContinuationFields keeps blocker payload fields serializable without empty noise', () => {
  assert.deepEqual(buildSerializableAuthContinuationFields({
    displayName: ' 홍길동 ',
    phone: ' 010-1234-5678 ',
    verificationCode: '',
    ignored: null,
  }), {
    displayName: '홍길동',
    phone: '010-1234-5678',
  })
})

test('persistAuthHandoff stores the serializable guest draft payload for follow-up auth wiring', () => {
  const storage = createMemoryStorage()
  const handoff = buildPersistedAuthHandoff({
    handoffId: 'auth-20260406123000-2n9c',
    endpoint: '/api/auth/login',
    method: 'POST',
    summary: {
      email: 'user@example.com',
      handoffId: 'auth-20260406123000-2n9c',
      wishlistCount: 1,
      cartCount: 2,
      layoutItemCount: 3,
      hasRecommendationDraft: true,
      mergeResolution: 'keep-guest',
      intent: {
        source: 'layout-editor',
        action: 'save-layout-draft',
        label: '로그인 후 보드 저장',
        draftLabel: '서울 성동구 성수이로 123 HAVENLY Apartments',
      },
    },
  }, {
    continuity: {
      wishlistIds: ['wish-1'],
      cartItems: [{ id: 'sku-1', qty: 2 }],
      layoutItems: [{ id: 'layout-1', x: 12, y: 16 }],
    },
  }, {
    submittedAt: '2026-04-06T06:59:00.000Z',
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
    continuation: {
      resumeToken: 'resume-123',
      nextAction: 'confirm-merge-resolution',
    },
    continuationFields: {
      displayName: ' 홍길동 ',
      phone: ' 010-1234-5678 ',
    },
  })

  assert.equal(persistAuthHandoff(storage, handoff), true)
  assert.equal(storage.getItem(AUTH_HANDOFF_STORAGE_KEY) !== null, true)
  assert.deepEqual(readPersistedAuthHandoff(storage), handoff)
  assert.deepEqual(handoff.summary.intent, {
    source: 'layout-editor',
    action: 'save-layout-draft',
    label: '로그인 후 보드 저장',
    returnScreen: null,
    draftLabel: '서울 성동구 성수이로 123 HAVENLY Apartments',
  })
  assert.deepEqual(handoff.connection, {
    method: 'POST',
    endpoint: '/api/auth/login',
    resolvedUrl: 'https://api.example.com/api/auth/login',
    targetLabel: 'api.example.com',
    isExternal: true,
    isSameOriginScaffold: false,
    credentialsMode: 'include',
    source: 'runtime',
  })
  assert.deepEqual(handoff.continuation, {
    resumeToken: 'resume-123',
    nextAction: 'confirm-merge-resolution',
    status: null,
    statusLabel: null,
  })
  assert.deepEqual(handoff.continuationFields, {
    displayName: '홍길동',
    phone: '010-1234-5678',
  })
})

test('buildPersistedAuthHandoff keeps the serialized draft-save handoff alongside interrupted login state', () => {
  const handoff = buildPersistedAuthHandoff(
    {
      endpoint: '/api/auth/login',
      method: 'POST',
      handoffId: 'auth-20260406123000-2n9c',
      summary: {
        email: 'user@example.com',
        handoffId: 'auth-20260406123000-2n9c',
        wishlistCount: 1,
        cartCount: 0,
        layoutItemCount: 2,
        hasRecommendationDraft: true,
        intent: {
          source: 'layout-editor',
          action: 'save-layout-draft',
          label: '로그인 후 보드 저장',
          returnScreen: 'layout',
          draftLabel: '거실 배치 보드',
        },
      },
    },
    {
      continuity: {
        apartmentLabel: '래미안 포레스트 84A',
        layoutItems: [{ id: 'layout-1' }, { id: 'layout-2' }],
      },
      recommendationDraft: { room: '거실' },
      spaceProfile: { spaces: ['living', 'bed1'] },
    },
    {
      draftSave: {
        draftLabel: ' 거실 배치 보드 ',
        apartmentLabel: ' 래미안 포레스트 84A ',
        recommendationRoom: ' 거실 ',
        selectedSpaceIds: ['living', 'bed1', 'living'],
        layoutItems: [{ id: 'layout-1', sourceId: 'sofa-001', x: 10, y: 20, rotation: 0, colorIndex: 2 }],
      },
    },
  )

  assert.deepEqual(handoff.draftSave, {
    draftLabel: '거실 배치 보드',
    apartmentLabel: '래미안 포레스트 84A',
    recommendationRoom: '거실',
    selectedSpaceIds: ['living', 'bed1'],
    layoutItems: [{ id: 'layout-1', sourceId: 'sofa-001', x: 10, y: 20, rotation: 0, colorIndex: 2 }],
    layoutItemCount: 1,
  })
})

test('buildAuthResumeState revives an interrupted login attempt from persisted handoff data', () => {
  const handoff = {
    submittedAt: '2026-04-06T06:59:00.000Z',
    handoffId: 'auth-20260406123000-2n9c',
    email: 'user@example.com',
    summary: {
      handoffId: 'auth-20260406123000-2n9c',
      wishlistCount: 1,
      cartCount: 2,
      layoutItemCount: 3,
      hasRecommendationDraft: true,
      mergeResolution: 'keep-guest',
      intent: { source: 'cart-drawer', action: 'checkout-cart', label: '로그인 후 주문 이어가기', draftLabel: '장바구니 2개' },
    },
    connection: {
      method: 'POST',
      endpoint: '/api/auth/login',
      resolvedUrl: 'https://api.example.com/api/auth/login',
      targetLabel: 'api.example.com',
      credentialsMode: 'include',
      source: 'runtime',
      isExternal: true,
      isSameOriginScaffold: false,
    },
    continuation: {
      resumeToken: 'resume-123',
      nextAction: 'confirm-merge-resolution',
    },
    continuationFields: {
      displayName: '홍길동',
      phone: '010-1234-5678',
    },
    allowedMergeResolutions: ['keep-guest', 'replace-with-account'],
    error: 'Guest draft merge confirmation required',
    status: 409,
  }
  const session = { accountLabel: 'user@example.com' }
  const resumeState = buildAuthResumeState(handoff, session)

  assert.equal(resumeState.email, 'user@example.com')
  assert.equal(resumeState.password, '')
  assert.equal(resumeState.handoffId, 'auth-20260406123000-2n9c')
  assert.equal(resumeState.status, 'resume-ready')
  assert.deepEqual(resumeState.result, {
    ok: false,
    status: 409,
    data: {
      message: 'Guest draft merge confirmation required',
      resumeToken: 'resume-123',
      nextAction: 'confirm-merge-resolution',
      allowedMergeResolutions: ['keep-guest', 'replace-with-account'],
    },
  })
  assert.equal(resumeState.handoff, handoff)
  assert.equal(resumeState.session, session)
  assert.equal(resumeState.mergeResolution, 'keep-guest')
  assert.deepEqual(resumeState.connection, {
    method: 'POST',
    endpoint: '/api/auth/login',
    resolvedUrl: 'https://api.example.com/api/auth/login',
    targetLabel: 'api.example.com',
    credentialsMode: 'include',
    source: 'runtime',
    isExternal: true,
    isSameOriginScaffold: false,
  })
  assert.deepEqual(resumeState.intent, {
    source: 'cart-drawer',
    action: 'checkout-cart',
    label: '로그인 후 주문 이어가기',
    returnScreen: null,
    draftLabel: '장바구니 2개',
  })
  assert.deepEqual(resumeState.continuation, {
    resumeToken: 'resume-123',
    nextAction: 'confirm-merge-resolution',
    status: null,
    statusLabel: null,
  })
  assert.deepEqual(resumeState.continuationFields, {
    displayName: '홍길동',
    phone: '010-1234-5678',
  })
  assert.equal(resumeState.draftSave, null)
})

test('buildGuestDraftSessionSummary keeps the persisted post-login restore details serializable', () => {
  assert.deepEqual(buildGuestDraftSessionSummary({
    recommendationDraft: { room: '거실' },
    spaceProfile: { spaces: ['living', 'bed1'] },
    continuity: {
      apartmentLabel: '래미안 포레스트 84A',
      selectedRooms: ['거실', '침실'],
      wishlistIds: ['wish-1'],
      cartItems: [{ id: 'cart-1', qty: 1 }],
      layoutItems: [{ id: 'layout-1' }, { id: 'layout-2' }],
    },
  }), {
    apartmentLabel: '래미안 포레스트 84A',
    selectedRoomCount: 2,
    selectedRooms: ['거실', '침실'],
    selectedSpaceIds: ['living', 'bed1'],
    recommendationRoom: '거실',
    wishlistCount: 1,
    cartCount: 1,
    layoutItemCount: 2,
  })
})


test('buildAuthReadyState revives a bootstrapped scaffold session into the login modal state', () => {
  const session = {
    savedAt: '2026-04-06T07:01:00.000Z',
    sessionId: 'sess_123',
    handoffId: 'auth-20260406123000-2n9c',
    accountLabel: 'user@example.com',
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
    continuation: {
      resumeToken: 'resume-session-123',
      nextAction: 'resume-layout-checkout',
      status: null,
      statusLabel: null,
    },
    continuationFields: {
      verificationCode: '123456',
    },
    accountState: {
      wishlistIds: ['wish-account-1'],
      cartItems: [{ id: 'cart-account-1', qty: 2 }],
      layoutItems: [{ id: 'layout-account-1', x: 12, y: 16 }],
      recommendationDraft: {
        room: '침실',
        style: 'natural',
        priority: 'storage',
        lifestyle: ['재택근무'],
        extraRequest: '붙박이장 중심으로',
      },
    },
  }

  assert.deepEqual(buildAuthReadyState(session), {
    email: 'user@example.com',
    password: '',
    handoffId: 'auth-20260406123000-2n9c',
    status: 'ready',
    result: null,
    resumedAt: '2026-04-06T07:01:00.000Z',
    handoff: null,
    session,
    mergeResolution: null,
    intent: {
      source: 'layout-editor',
      action: 'save-layout-draft',
      label: '로그인 후 보드 저장',
      returnScreen: 'layout',
      draftLabel: null,
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
      resumeToken: 'resume-session-123',
      nextAction: 'resume-layout-checkout',
      status: null,
      statusLabel: null,
    },
    continuationFields: {
      verificationCode: '123456',
    },
    draftSave: null,
    accountState: {
      wishlistIds: ['wish-account-1'],
      cartItems: [{ id: 'cart-account-1', qty: 2 }],
      layoutItems: [{ id: 'layout-account-1', x: 12, y: 16 }],
      recommendationDraft: {
        room: '침실',
        style: 'natural',
        priority: 'storage',
        lifestyle: ['재택근무'],
        extraRequest: '붙박이장 중심으로',
      },
    },
  })
})

test('buildAuthReadyState can override the active post-login intent without mutating the bootstrapped session contract', () => {
  const session = {
    savedAt: '2026-04-08T05:40:00.000Z',
    sessionId: 'sess_456',
    handoffId: 'auth-20260408054000-abcd',
    accountLabel: 'user@example.com',
    intent: {
      source: 'header',
      action: 'login',
      label: '기본 로그인',
      returnScreen: 'home',
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
      resumeToken: 'resume-session-456',
      nextAction: 'resume-authenticated-flow',
      status: null,
      statusLabel: null,
    },
  }

  const readyState = buildAuthReadyState(session, {
    intent: {
      source: 'layout-editor',
      action: 'save-layout-draft',
      label: '로그인 후 보드 저장',
      returnScreen: 'layout',
      draftLabel: '거실 배치 보드',
    },
  })

  assert.equal(readyState.session, session)
  assert.deepEqual(readyState.intent, {
    source: 'layout-editor',
    action: 'save-layout-draft',
    label: '로그인 후 보드 저장',
    returnScreen: 'layout',
    draftLabel: '거실 배치 보드',
  })
  assert.deepEqual(session.intent, {
    source: 'header',
    action: 'login',
    label: '기본 로그인',
    returnScreen: 'home',
  })
})

test('persistAuthSession stores the latest successful auth summary for the frontend shell', () => {
  const storage = createMemoryStorage()
  const session = buildPersistedAuthSession({
    sessionId: 'sess_123',
    handoffId: 'auth-20260406123000-2n9c',
    accountLabel: 'user@example.com',
    mergeMode: 'merged',
    mergedDraftCount: 3,
    restoredWishlistCount: 1,
    restoredCartCount: 2,
    restoredLayoutItemCount: 3,
    restoredRecommendationDraft: true,
    wishlistCount: 1,
    cartCount: 2,
    layoutItemCount: 3,
    hasRecommendationDraft: true,
    guestDraftSummary: {
      apartmentLabel: '무시될 서버 요약',
      selectedRoomCount: 1,
      selectedRooms: ['거실'],
      selectedSpaceIds: ['living'],
      recommendationRoom: '거실',
      wishlistCount: 9,
      cartCount: 9,
      layoutItemCount: 9,
    },
    intent: {
      source: 'server',
      action: 'server-intent',
      label: '서버 intent',
      returnScreen: 'home',
    },
    authMode: 'scaffold',
    authTransport: 'same-origin-middleware',
    resumeToken: 'resume-session-123',
    nextAction: 'resume-layout-checkout',
    accountState: {
      wishlistIds: ['wish-account-1'],
      cartItems: [{ id: 'cart-account-1', qty: 2 }],
      layoutItems: [{ id: 'layout-account-1', x: 12, y: 16 }],
      recommendationDraft: {
        room: '침실',
        style: 'natural',
        priority: 'storage',
        lifestyle: ['재택근무'],
        extraRequest: '붙박이장 중심으로',
      },
    },
  }, {
    savedAt: '2026-04-06T07:01:00.000Z',
    intent: {
      source: 'layout-editor',
      action: 'save-layout-draft',
      label: '로그인 후 보드 저장',
      returnScreen: 'layout',
      draftLabel: '거실 84A',
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
    continuationFields: {
      displayName: '홍길동',
      phone: '010-1234-5678',
    },
    guestDraftSnapshot: {
      recommendationDraft: { room: '거실' },
      spaceProfile: { spaces: ['living', 'bed1'] },
      continuity: {
        apartmentLabel: '래미안 포레스트 84A',
        selectedRooms: ['거실', '침실'],
        wishlistIds: ['wish-1'],
        cartItems: [{ id: 'cart-1', qty: 1 }, { id: 'cart-2', qty: 1 }],
        layoutItems: [{ id: 'layout-1' }, { id: 'layout-2' }, { id: 'layout-3' }],
      },
    },
  })

  assert.equal(persistAuthSession(storage, session), true)
  assert.equal(storage.getItem(AUTH_SESSION_STORAGE_KEY) !== null, true)
  assert.deepEqual(readPersistedAuthSession(storage), session)
  assert.equal(session.handoffId, 'auth-20260406123000-2n9c')
  assert.equal(session.authMode, 'scaffold')
  assert.deepEqual(session.intent, {
    source: 'layout-editor',
    action: 'save-layout-draft',
    label: '로그인 후 보드 저장',
    returnScreen: 'layout',
    draftLabel: '거실 84A',
  })
  assert.deepEqual(session.connection, {
    method: 'POST',
    endpoint: '/api/auth/login',
    resolvedUrl: '/api/auth/login',
    targetLabel: 'same-origin /api auth scaffold',
    isExternal: false,
    isSameOriginScaffold: true,
    credentialsMode: 'include',
    source: 'default',
  })
  assert.deepEqual(session.continuation, {
    resumeToken: 'resume-session-123',
    nextAction: 'resume-layout-checkout',
    status: null,
    statusLabel: null,
  })
  assert.deepEqual(session.continuationFields, {
    displayName: '홍길동',
    phone: '010-1234-5678',
  })
  assert.deepEqual(session.accountState, {
    wishlistIds: ['wish-account-1'],
    cartItems: [{ id: 'cart-account-1', qty: 2 }],
    layoutItems: [{ id: 'layout-account-1', x: 12, y: 16 }],
    recommendationDraft: {
      room: '침실',
      style: 'natural',
      priority: 'storage',
      lifestyle: ['재택근무'],
      extraRequest: '붙박이장 중심으로',
    },
  })
})

test('buildPersistedAuthSession falls back to backend session context when no guest draft snapshot is provided', () => {
  const session = buildPersistedAuthSession({
    sessionId: 'sess_backend',
    accountLabel: 'user@example.com',
    guestDraftSummary: {
      apartmentLabel: '래미안 포레스트 84A',
      selectedRoomCount: 2,
      selectedRooms: ['거실', '침실'],
      selectedSpaceIds: ['living', 'bed1'],
      recommendationRoom: '거실',
      wishlistCount: 1,
      cartCount: 2,
      layoutItemCount: 3,
    },
    intent: {
      source: 'layout-editor',
      action: 'save-layout-draft',
      label: '로그인 후 보드 저장',
      returnScreen: 'layout',
    },
  })

  assert.deepEqual(session.guestDraftSummary, {
    apartmentLabel: '래미안 포레스트 84A',
    selectedRoomCount: 2,
    selectedRooms: ['거실', '침실'],
    selectedSpaceIds: ['living', 'bed1'],
    recommendationRoom: '거실',
    wishlistCount: 1,
    cartCount: 2,
    layoutItemCount: 3,
  })
  assert.deepEqual(session.intent, {
    source: 'layout-editor',
    action: 'save-layout-draft',
    label: '로그인 후 보드 저장',
    returnScreen: 'layout',
    draftLabel: null,
  })
})

test('buildSerializableAuthIntent trims the guarded login handoff context down to serializable UI fields', () => {
  assert.deepEqual(buildSerializableAuthIntent({
    source: ' layout-editor ',
    action: ' save-layout-draft ',
    label: ' 로그인 후 보드 저장 ',
    returnScreen: ' layout ',
    draftLabel: ' 거실 84A ',
    ignored: { nested: true },
  }), {
    source: 'layout-editor',
    action: 'save-layout-draft',
    label: '로그인 후 보드 저장',
    returnScreen: 'layout',
    draftLabel: '거실 84A',
  })
})

test('clearPersistedAuthHandoff and clearPersistedAuthSession remove saved auth state', () => {
  const storage = createMemoryStorage()
  storage.setItem(AUTH_HANDOFF_STORAGE_KEY, JSON.stringify({ email: 'user@example.com' }))
  storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({ accountLabel: 'user@example.com' }))

  assert.equal(clearPersistedAuthHandoff(storage), true)
  assert.equal(clearPersistedAuthSession(storage), true)
  assert.equal(storage.getItem(AUTH_HANDOFF_STORAGE_KEY), null)
  assert.equal(storage.getItem(AUTH_SESSION_STORAGE_KEY), null)
})
