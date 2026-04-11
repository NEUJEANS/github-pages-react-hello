import test from 'node:test'
import assert from 'node:assert/strict'

import { buildAuthGuardPanelState, buildAuthLoginPanelState, buildAuthReadyPanelState, buildAuthResumePanelState, buildAuthSessionNotice, shouldAutoOpenAuthReadyPanel } from './auth-session-view-state.js'

test('buildAuthLoginPanelState mirrors the initial login payload contract for non-guard modal flows', () => {
  assert.deepEqual(buildAuthLoginPanelState({
    authSummary: {
      handoffId: 'auth-20260409180000-login',
      wishlistCount: 1,
      cartCount: 2,
      layoutItemCount: 4,
      continuation: {
        nextAction: 'confirm-merge-resolution',
        resumeToken: 'auth-20260409180000-login:resume',
      },
      mergeResolution: 'keep-guest',
      draftSave: {
        draftLabel: '거실 배치 보드',
        apartmentLabel: '래미안 포레스트 84A',
        recommendationRoom: '거실',
        selectedSpaceIds: ['living', 'bed1'],
        layoutItemCount: 4,
      },
    },
    connection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/login',
      source: 'default',
      credentialsMode: 'include',
    },
    intent: {
      label: '로그인 후 주문 이어가기',
      draftLabel: '카트 handoff',
    },
  }), {
    handoffId: 'auth-20260409180000-login',
    connectionLabel: 'same-origin /api auth scaffold',
    connectionEndpoint: '/api/auth/login',
    connectionSource: 'default',
    connectionCredentialsMode: 'include',
    intentLabel: '로그인 후 주문 이어가기',
    intentDraftLabel: '카트 handoff',
    draftSaveBits: ['초안 거실 배치 보드', '래미안 포레스트 84A', '거실 추천', '선택 공간 2개', '저장 배치 4개'],
    submitPayloadPreview: {
      endpoint: '/api/auth/login',
      targetLabel: 'same-origin /api auth scaffold',
      payloadKeys: ['email', 'password', 'handoffId', 'guestDraftSnapshot', 'mergeResolution', 'intent', 'continuation', 'draftSave', 'connection'],
      expectedResponseKeys: ['handoffId', 'sessionId', 'user', 'connection', 'guestDraftSummary', 'mergedGuestDraft', 'intent', 'draftSave', 'resumeToken', 'nextAction'],
      handoffId: 'auth-20260409180000-login',
      draftSaveLayoutItemCount: 4,
      draftSaveSelectedSpaceCount: 2,
      wishlistCount: 1,
      cartCount: 2,
      layoutItemCount: 4,
    },
  })
})

test('buildAuthGuardPanelState summarizes guarded login handoff context before submit', () => {
  assert.deepEqual(buildAuthGuardPanelState({
    engagement: {
      aiRequests: 2,
      furniturePlacements: 4,
      draftBoards: 1,
      wishlistCount: 3,
      cartCount: 2,
    },
    reasons: ['AI 추천 요청 2회', '장바구니 2개'],
    guestDraftSnapshot: {
      recommendationDraft: {
        room: '거실',
      },
      spaceProfile: {
        spaces: ['living', 'bed1', 'entry'],
      },
      continuity: {
        apartmentLabel: '래미안 포레스트 84A',
        selectedRooms: ['거실', '안방'],
      },
    },
    authSummary: {
      handoffId: 'auth-20260409054000-abcd',
      wishlistCount: 3,
      cartCount: 2,
      layoutItemCount: 5,
      draftSave: {
        draftLabel: '84A 거실 보드',
        apartmentLabel: '래미안 포레스트 84A',
        recommendationRoom: '거실',
        selectedSpaceIds: ['living', 'bed1', 'entry'],
        layoutItemCount: 5,
      },
    },
    connection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/login',
      source: 'default',
      credentialsMode: 'include',
    },
    intent: {
      label: '로그인 후 보드 저장',
      draftLabel: '84A 거실',
    },
  }), {
    reasonCount: 2,
    reasons: ['AI 추천 요청 2회', '장바구니 2개'],
    aiRequests: 2,
    furniturePlacements: 4,
    draftBoards: 1,
    wishlistCount: 3,
    cartCount: 2,
    layoutItemCount: 5,
    selectedSpaceCount: 3,
    recommendationRoom: '거실',
    handoffId: 'auth-20260409054000-abcd',
    connectionLabel: 'same-origin /api auth scaffold',
    connectionEndpoint: '/api/auth/login',
    connectionSource: 'default',
    connectionCredentialsMode: 'include',
    intentLabel: '로그인 후 보드 저장',
    intentDraftLabel: '84A 거실',
    draftContextBits: ['래미안 포레스트 84A', '공간 2개', '거실 추천'],
    draftSaveBits: ['초안 84A 거실 보드', '래미안 포레스트 84A', '거실 추천', '선택 공간 3개', '저장 배치 5개'],
    submitPayloadPreview: {
      endpoint: '/api/auth/login',
      targetLabel: 'same-origin /api auth scaffold',
      payloadKeys: ['email', 'password', 'handoffId', 'guestDraftSnapshot', 'intent', 'draftSave', 'connection'],
      expectedResponseKeys: ['handoffId', 'sessionId', 'user', 'connection', 'guestDraftSummary', 'mergedGuestDraft', 'intent', 'draftSave', 'resumeToken', 'nextAction'],
      handoffId: 'auth-20260409054000-abcd',
      draftSaveLayoutItemCount: 5,
      draftSaveSelectedSpaceCount: 3,
      wishlistCount: 3,
      cartCount: 2,
      layoutItemCount: 5,
    },
  })
})

test('buildAuthReadyPanelState summarizes the authenticated resume panel for bootstrapped login state', () => {
  assert.deepEqual(buildAuthReadyPanelState({
    accountLabel: 'user@example.com',
    sessionId: 'session-1234',
    handoffId: 'auth-20260406123000-2n9c',
    mergeMode: 'merged',
    restoredWishlistCount: 2,
    restoredCartCount: 1,
    restoredLayoutItemCount: 3,
    restoredRecommendationDraft: true,
    intent: {
      label: '로그인 후 보드 저장',
      draftLabel: '거실 84A',
      returnScreen: 'layout',
    },
    continuation: {
      nextAction: 'save-layout-draft',
      resumeToken: 'auth-20260406123000-2n9c:resume',
    },
    connection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/login',
    },
    guestDraftSummary: {
      apartmentLabel: '래미안 포레스트 84A',
      selectedRoomCount: 2,
      recommendationRoom: '거실',
    },
    draftSave: {
      draftLabel: '거실 배치 보드',
      apartmentLabel: '래미안 포레스트 84A',
      recommendationRoom: '거실',
      selectedSpaceIds: ['living', 'bed1'],
      layoutItemCount: 3,
    },
  }), {
    title: 'user@example.com 계정 연결됨',
    subtitle: '게스트 초안을 계정에 이어붙인 상태예요.',
    restoredBits: ['찜 2개', '장바구니 1개', '배치 3개', '추천 초안'],
    draftContextBits: ['래미안 포레스트 84A', '공간 2개', '거실 추천'],
    draftSaveBits: ['초안 거실 배치 보드', '래미안 포레스트 84A', '거실 추천', '선택 공간 2개', '저장 배치 3개'],
    accountLabel: 'user@example.com',
    handoffId: 'auth-20260406123000-2n9c',
    sessionId: 'session-1234',
    mergeMode: 'merged',
    intentLabel: '로그인 후 보드 저장',
    intentDraftLabel: '거실 84A',
    nextAction: 'save-layout-draft',
    resumeToken: 'auth-20260406123000-2n9c:resume',
    continuationStatus: null,
    continuationStatusLabel: null,
    returnScreen: 'layout',
    connectionLabel: 'same-origin /api auth scaffold',
    connectionEndpoint: '/api/auth/login',
    primaryActionLabel: '보드 저장 이어가기',
    primaryActionHint: '로그인 후 저장하려던 배치 초안을 그대로 이어갈 수 있어요.',
    primaryActionDisabled: false,
    actionChecklist: null,
    actionPayloadPreview: {
      continuationEndpoint: '/api/auth/continue',
      connectionEndpoint: '/api/auth/login',
      targetLabel: 'same-origin /api auth scaffold',
      handoffId: 'auth-20260406123000-2n9c',
      resumeToken: 'auth-20260406123000-2n9c:resume',
      payloadKeys: ['continuation', 'handoffId', 'resumeToken', 'draftSave'],
      fieldKeys: [],
      expectedResponseKeys: ['handoffId', 'sessionId', 'user', 'connection', 'resumeToken', 'nextAction', 'status', 'statusLabel', 'draftSave'],
      draftSaveLayoutItemCount: 3,
      draftSaveSelectedSpaceCount: 2,
    },
  })

  assert.equal(buildAuthReadyPanelState(null), null)
})

test('buildAuthReadyPanelState adapts primary CTA copy to backend continuation actions', () => {
  assert.deepEqual(buildAuthReadyPanelState({
    accountLabel: 'user@example.com',
    intent: {
      label: '로그인 후 주문 이어가기',
      draftLabel: '장바구니 2개',
      returnScreen: null,
    },
    continuation: {
      nextAction: 'checkout-cart',
      resumeToken: 'auth-user-1234:resume',
    },
  }), {
    title: 'user@example.com 계정 연결됨',
    subtitle: '현재 로그인 연결이 유지되고 있어요.',
    restoredBits: [],
    draftContextBits: [],
    draftSaveBits: [],
    accountLabel: 'user@example.com',
    handoffId: null,
    sessionId: null,
    mergeMode: null,
    intentLabel: '로그인 후 주문 이어가기',
    intentDraftLabel: '장바구니 2개',
    nextAction: 'checkout-cart',
    resumeToken: 'auth-user-1234:resume',
    continuationStatus: null,
    continuationStatusLabel: null,
    returnScreen: null,
    connectionLabel: null,
    connectionEndpoint: null,
    primaryActionLabel: '주문 흐름 이어가기',
    primaryActionHint: '계정 장바구니 기준으로 다음 주문 단계를 이어갈 수 있어요.',
    primaryActionDisabled: false,
    actionChecklist: null,
    actionPayloadPreview: {
      continuationEndpoint: '/api/auth/continue',
      connectionEndpoint: null,
      targetLabel: null,
      handoffId: null,
      resumeToken: 'auth-user-1234:resume',
      payloadKeys: ['continuation', 'handoffId', 'resumeToken'],
      fieldKeys: [],
      expectedResponseKeys: ['handoffId', 'sessionId', 'user', 'connection', 'resumeToken', 'nextAction', 'status', 'statusLabel'],
      draftSaveLayoutItemCount: 0,
      draftSaveSelectedSpaceCount: 0,
    },
  })

  assert.deepEqual(buildAuthReadyPanelState({
    accountLabel: 'user@example.com',
    intent: {
      label: '로그인 후 보드 저장',
      draftLabel: '거실 84A',
      returnScreen: null,
    },
    continuation: {
      nextAction: 'resume-account-state',
      resumeToken: 'auth-user-1234:resume',
    },
  }), {
    title: 'user@example.com 계정 연결됨',
    subtitle: '현재 로그인 연결이 유지되고 있어요.',
    restoredBits: [],
    draftContextBits: [],
    draftSaveBits: [],
    accountLabel: 'user@example.com',
    handoffId: null,
    sessionId: null,
    mergeMode: null,
    intentLabel: '로그인 후 보드 저장',
    intentDraftLabel: '거실 84A',
    nextAction: 'resume-account-state',
    resumeToken: 'auth-user-1234:resume',
    continuationStatus: null,
    continuationStatusLabel: null,
    returnScreen: null,
    connectionLabel: null,
    connectionEndpoint: null,
    primaryActionLabel: '계정 상태로 이어가기',
    primaryActionHint: '계정 기준으로 복원된 보드와 저장 상태를 레이아웃 화면에서 확인할 수 있어요.',
    primaryActionDisabled: false,
    actionChecklist: null,
    actionPayloadPreview: {
      continuationEndpoint: '/api/auth/continue',
      connectionEndpoint: null,
      targetLabel: null,
      handoffId: null,
      resumeToken: 'auth-user-1234:resume',
      payloadKeys: ['continuation', 'handoffId', 'resumeToken'],
      fieldKeys: [],
      expectedResponseKeys: ['handoffId', 'sessionId', 'user', 'connection', 'resumeToken', 'nextAction', 'status', 'statusLabel'],
      draftSaveLayoutItemCount: 0,
      draftSaveSelectedSpaceCount: 0,
    },
  })

  assert.deepEqual(buildAuthReadyPanelState({
    accountLabel: 'user@example.com',
    intent: {
      label: '로그인 후 보드 저장',
      draftLabel: '거실 84A',
      returnScreen: null,
    },
    continuation: {
      nextAction: 'resume-guest-draft',
      resumeToken: 'auth-user-1234:resume',
    },
  }), {
    title: 'user@example.com 계정 연결됨',
    subtitle: '현재 로그인 연결이 유지되고 있어요.',
    restoredBits: [],
    draftContextBits: [],
    draftSaveBits: [],
    accountLabel: 'user@example.com',
    handoffId: null,
    sessionId: null,
    mergeMode: null,
    intentLabel: '로그인 후 보드 저장',
    intentDraftLabel: '거실 84A',
    nextAction: 'resume-guest-draft',
    resumeToken: 'auth-user-1234:resume',
    continuationStatus: null,
    continuationStatusLabel: null,
    returnScreen: null,
    connectionLabel: null,
    connectionEndpoint: null,
    primaryActionLabel: '게스트 초안 이어가기',
    primaryActionHint: '병합된 게스트 초안을 레이아웃 흐름에서 바로 이어 확인할 수 있어요.',
    primaryActionDisabled: false,
    actionChecklist: null,
    actionPayloadPreview: {
      continuationEndpoint: '/api/auth/continue',
      connectionEndpoint: null,
      targetLabel: null,
      handoffId: null,
      resumeToken: 'auth-user-1234:resume',
      payloadKeys: ['continuation', 'handoffId', 'resumeToken'],
      fieldKeys: [],
      expectedResponseKeys: ['handoffId', 'sessionId', 'user', 'connection', 'resumeToken', 'nextAction', 'status', 'statusLabel'],
      draftSaveLayoutItemCount: 0,
      draftSaveSelectedSpaceCount: 0,
    },
  })

  assert.deepEqual(buildAuthReadyPanelState({
    accountLabel: 'user@example.com',
    intent: {
      label: '로그인 후 프로필 마무리',
      returnScreen: 'layout',
    },
    continuation: {
      nextAction: 'complete-profile',
      resumeToken: 'auth-user-1234:profile',
      status: 'action-required',
      statusLabel: '프로필 보완 필요',
    },
  }), {
    title: 'user@example.com 계정 연결됨',
    subtitle: '로그인은 연결됐지만 프로필 보완이 남아 있어요.',
    restoredBits: [],
    draftContextBits: [],
    draftSaveBits: [],
    accountLabel: 'user@example.com',
    handoffId: null,
    sessionId: null,
    mergeMode: null,
    intentLabel: '로그인 후 프로필 마무리',
    intentDraftLabel: null,
    nextAction: 'complete-profile',
    resumeToken: 'auth-user-1234:profile',
    continuationStatus: 'action-required',
    continuationStatusLabel: '프로필 보완 필요',
    returnScreen: 'layout',
    connectionLabel: null,
    connectionEndpoint: null,
    primaryActionLabel: '프로필 보완 제출',
    primaryActionHint: '백엔드가 요구한 최소 프로필 payload를 바로 제출하고, blocker가 풀리면 원래 로그인 목적 흐름으로 이어갈 수 있어요.',
    primaryActionDisabled: false,
    actionChecklist: {
      title: '프로필 보완 연결 준비',
      description: '백엔드가 추가 프로필 입력을 요구하는 상태예요. 아직 별도 화면은 없지만, 프론트가 어떤 계약으로 다음 단계를 이어야 하는지 바로 확인할 수 있어요.',
      items: [
        'resume token auth-user-1234:profile 값을 유지한 채 다음 프로필 저장 요청으로 이어가기',
        '현재 인증 연결 대상을 그대로 유지하기',
        '닉네임 · 연락처 같은 프로필 필드를 직렬화 가능한 payload로 최소 구성하기',
      ],
    },
    actionPayloadPreview: {
      continuationEndpoint: '/api/auth/continue',
      connectionEndpoint: null,
      targetLabel: null,
      handoffId: null,
      resumeToken: 'auth-user-1234:profile',
      payloadKeys: ['continuation', 'handoffId', 'resumeToken'],
      fieldKeys: ['displayName', 'phone'],
      expectedResponseKeys: ['handoffId', 'sessionId', 'user', 'connection', 'resumeToken', 'nextAction', 'status', 'statusLabel'],
      draftSaveLayoutItemCount: 0,
      draftSaveSelectedSpaceCount: 0,
    },
  })

  assert.deepEqual(buildAuthReadyPanelState({
    accountLabel: 'user@example.com',
    continuation: {
      nextAction: 'verify-email',
      resumeToken: 'auth-user-1234:verify',
      status: 'action-required',
      statusLabel: '이메일 인증 필요',
    },
    connection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/login',
    },
  }, {
    actionConnection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/continue',
    },
  }), {
    title: 'user@example.com 계정 연결됨',
    subtitle: '로그인은 연결됐지만 이메일 인증 확인이 남아 있어요.',
    restoredBits: [],
    draftContextBits: [],
    draftSaveBits: [],
    accountLabel: 'user@example.com',
    handoffId: null,
    sessionId: null,
    mergeMode: null,
    intentLabel: '저장한 작업',
    intentDraftLabel: null,
    nextAction: 'verify-email',
    resumeToken: 'auth-user-1234:verify',
    continuationStatus: 'action-required',
    continuationStatusLabel: '이메일 인증 필요',
    returnScreen: null,
    connectionLabel: 'same-origin /api auth scaffold',
    connectionEndpoint: '/api/auth/continue',
    primaryActionLabel: '이메일 인증 확인',
    primaryActionHint: '인증 코드를 바로 제출하고, backend가 준비 완료를 돌려주면 원래 이어가려던 흐름으로 복귀할 수 있어요.',
    primaryActionDisabled: false,
    actionChecklist: {
      title: '이메일 인증 연결 준비',
      description: '백엔드가 이메일 인증 단계를 기다리고 있어요. 실제 인증 화면이 붙기 전까지 필요한 handoff 계약을 먼저 노출합니다.',
      items: [
        'resume token auth-user-1234:verify 으로 인증 확인 조회를 재개하기',
        '현재 인증 연결 대상 same-origin /api auth scaffold (/api/auth/continue) 기준으로 폴링/재개 흐름 붙이기',
        '인증 완료 전에는 로그인 모달을 닫지 않고 상태만 갱신하기',
      ],
    },
    actionPayloadPreview: {
      continuationEndpoint: '/api/auth/continue',
      connectionEndpoint: '/api/auth/continue',
      targetLabel: 'same-origin /api auth scaffold',
      handoffId: null,
      resumeToken: 'auth-user-1234:verify',
      payloadKeys: ['continuation', 'handoffId', 'resumeToken'],
      fieldKeys: ['verificationCode'],
      expectedResponseKeys: ['handoffId', 'sessionId', 'user', 'connection', 'resumeToken', 'nextAction', 'status', 'statusLabel'],
      draftSaveLayoutItemCount: 0,
      draftSaveSelectedSpaceCount: 0,
    },
  })

  assert.deepEqual(buildAuthReadyPanelState({
    accountLabel: 'user@example.com',
    intent: {
      label: '로그인 후 현재 흐름 이어가기',
      returnScreen: null,
    },
    continuation: {
      nextAction: 'resume-authenticated-flow',
      resumeToken: 'auth-user-1234:resume',
    },
  }), {
    title: 'user@example.com 계정 연결됨',
    subtitle: '현재 로그인 연결이 유지되고 있어요.',
    restoredBits: [],
    draftContextBits: [],
    draftSaveBits: [],
    accountLabel: 'user@example.com',
    handoffId: null,
    sessionId: null,
    mergeMode: null,
    intentLabel: '로그인 후 현재 흐름 이어가기',
    intentDraftLabel: null,
    nextAction: 'resume-authenticated-flow',
    resumeToken: 'auth-user-1234:resume',
    continuationStatus: null,
    continuationStatusLabel: null,
    returnScreen: null,
    connectionLabel: null,
    connectionEndpoint: null,
    primaryActionLabel: '현재 흐름으로 돌아가기',
    primaryActionHint: '백엔드 scaffold가 현재 인증 handoff를 확인했어요. 로그인 모달을 닫고 지금 보던 흐름으로 돌아갈 수 있어요.',
    primaryActionDisabled: false,
    actionChecklist: null,
    actionPayloadPreview: {
      continuationEndpoint: '/api/auth/continue',
      connectionEndpoint: null,
      targetLabel: null,
      handoffId: null,
      resumeToken: 'auth-user-1234:resume',
      payloadKeys: ['continuation', 'handoffId', 'resumeToken'],
      fieldKeys: [],
      expectedResponseKeys: ['handoffId', 'sessionId', 'user', 'connection', 'resumeToken', 'nextAction', 'status', 'statusLabel'],
      draftSaveLayoutItemCount: 0,
      draftSaveSelectedSpaceCount: 0,
    },
  })

  assert.deepEqual(buildAuthReadyPanelState({
    accountLabel: 'merge@example.com',
    handoffId: 'auth-merge-1234',
    continuation: {
      nextAction: 'confirm-merge-resolution',
      resumeToken: 'auth-merge-1234:resume',
      status: 'action-required',
      statusLabel: '초안 병합 확인 필요',
    },
    connection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/login',
    },
  }, {
    actionConnection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/continue',
    },
  }), {
    title: 'merge@example.com 계정 연결됨',
    subtitle: '로그인은 연결됐지만 초안 병합 방향 확인이 남아 있어요.',
    restoredBits: [],
    draftContextBits: [],
    draftSaveBits: [],
    accountLabel: 'merge@example.com',
    handoffId: 'auth-merge-1234',
    sessionId: null,
    mergeMode: null,
    intentLabel: '저장한 작업',
    intentDraftLabel: null,
    nextAction: 'confirm-merge-resolution',
    resumeToken: 'auth-merge-1234:resume',
    continuationStatus: 'action-required',
    continuationStatusLabel: '초안 병합 확인 필요',
    returnScreen: null,
    connectionLabel: 'same-origin /api auth scaffold',
    connectionEndpoint: '/api/auth/continue',
    primaryActionLabel: '병합 방향 확정',
    primaryActionHint: '선택한 병합 기준으로 `/api/auth/continue` 재개 요청을 보내면, backend가 같은 handoff를 이어서 다음 상태를 돌려줄 수 있어요.',
    primaryActionDisabled: false,
    actionChecklist: {
      title: '초안 병합 방향 확정 준비',
      description: '백엔드가 게스트 초안과 계정 상태 중 어떤 기준으로 이어갈지 다시 확인하고 있어요. 새로 로그인하지 않고 같은 handoff 계약으로 병합 방향만 확정할 수 있어요.',
      items: [
        'resume token auth-merge-1234:resume 과 함께 선택한 mergeResolution 값을 그대로 재개 요청에 실어 보내기',
        '현재 인증 연결 대상 same-origin /api auth scaffold (/api/auth/continue) 기준으로 같은 handoff를 이어가기',
        '확정 전에는 게스트 초안과 계정 상태를 모두 유지한 채 병합 방향만 선택하기',
      ],
    },
    actionPayloadPreview: {
      continuationEndpoint: '/api/auth/continue',
      connectionEndpoint: '/api/auth/continue',
      targetLabel: 'same-origin /api auth scaffold',
      handoffId: 'auth-merge-1234',
      resumeToken: 'auth-merge-1234:resume',
      payloadKeys: ['continuation', 'handoffId', 'resumeToken'],
      fieldKeys: ['mergeResolution'],
      expectedResponseKeys: ['handoffId', 'sessionId', 'user', 'connection', 'resumeToken', 'nextAction', 'status', 'statusLabel'],
      draftSaveLayoutItemCount: 0,
      draftSaveSelectedSpaceCount: 0,
    },
  })
})

test('buildAuthReadyPanelState adapts merge confirmation CTA copy to the selected resolution', () => {
  const keepGuest = buildAuthReadyPanelState({
    accountLabel: 'merge@example.com',
    handoffId: 'auth-merge-1234',
    continuation: {
      nextAction: 'confirm-merge-resolution',
      resumeToken: 'auth-merge-1234:resume',
      status: 'action-required',
      statusLabel: '초안 병합 확인 필요',
    },
    continuationFields: {
      mergeResolution: 'keep-guest',
    },
    connection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/login',
    },
  }, {
    actionConnection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/continue',
    },
  })

  const replaceWithAccount = buildAuthReadyPanelState({
    accountLabel: 'merge@example.com',
    handoffId: 'auth-merge-1234',
    continuation: {
      nextAction: 'confirm-merge-resolution',
      resumeToken: 'auth-merge-1234:resume',
      status: 'action-required',
      statusLabel: '초안 병합 확인 필요',
    },
    continuationFields: {
      mergeResolution: 'replace-with-account',
    },
    connection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/login',
    },
  }, {
    actionConnection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/continue',
    },
  })

  assert.equal(keepGuest.primaryActionLabel, '현재 초안으로 계속')
  assert.match(keepGuest.primaryActionHint, /현재 게스트 초안/)
  assert.equal(replaceWithAccount.primaryActionLabel, '계정 상태로 계속')
  assert.match(replaceWithAccount.primaryActionHint, /계정에 저장된 상태/)
})

test('buildAuthResumePanelState exposes pending action-required handoffs without a bootstrapped auth session', () => {
  assert.deepEqual(buildAuthResumePanelState({
    email: 'verify@example.com',
    handoffId: 'auth-verify-123',
    connection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/login',
    },
    continuation: {
      nextAction: 'verify-email',
      resumeToken: 'auth-verify-123:resume',
      status: 'action-required',
      statusLabel: '이메일 인증 필요',
    },
    summary: {
      intent: {
        label: '로그인 후 결제 이어가기',
      },
    },
    draftSave: {
      draftLabel: '거실 저장 초안',
      selectedSpaceIds: ['living'],
      layoutItemCount: 2,
    },
    guestDraftSummary: {
      apartmentLabel: '래미안 포레스트 84A',
      selectedRoomCount: 1,
      recommendationRoom: '거실',
    },
  }, {
    actionConnection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/continue',
    },
  }), {
    title: 'verify@example.com 계정 연결됨',
    subtitle: '로그인은 연결됐지만 이메일 인증 확인이 남아 있어요.',
    restoredBits: [],
    draftContextBits: ['래미안 포레스트 84A', '공간 1개', '거실 추천'],
    draftSaveBits: ['초안 거실 저장 초안', '선택 공간 1개', '저장 배치 2개'],
    accountLabel: 'verify@example.com',
    handoffId: 'auth-verify-123',
    sessionId: null,
    mergeMode: null,
    intentLabel: '로그인 후 결제 이어가기',
    intentDraftLabel: null,
    nextAction: 'verify-email',
    resumeToken: 'auth-verify-123:resume',
    continuationStatus: 'action-required',
    continuationStatusLabel: '이메일 인증 필요',
    returnScreen: null,
    connectionLabel: 'same-origin /api auth scaffold',
    connectionEndpoint: '/api/auth/continue',
    primaryActionLabel: '이메일 인증 확인',
    primaryActionHint: '인증 코드를 바로 제출하고, backend가 준비 완료를 돌려주면 원래 이어가려던 흐름으로 복귀할 수 있어요.',
    primaryActionDisabled: false,
    actionChecklist: {
      title: '이메일 인증 연결 준비',
      description: '백엔드가 이메일 인증 단계를 기다리고 있어요. 실제 인증 화면이 붙기 전까지 필요한 handoff 계약을 먼저 노출합니다.',
      items: [
        'resume token auth-verify-123:resume 으로 인증 확인 조회를 재개하기',
        '현재 인증 연결 대상 same-origin /api auth scaffold (/api/auth/continue) 기준으로 폴링/재개 흐름 붙이기',
        '인증 완료 전에는 로그인 모달을 닫지 않고 상태만 갱신하기',
      ],
    },
    actionPayloadPreview: {
      continuationEndpoint: '/api/auth/continue',
      connectionEndpoint: '/api/auth/continue',
      targetLabel: 'same-origin /api auth scaffold',
      handoffId: 'auth-verify-123',
      resumeToken: 'auth-verify-123:resume',
      payloadKeys: ['continuation', 'handoffId', 'resumeToken', 'draftSave'],
      fieldKeys: ['verificationCode'],
      expectedResponseKeys: ['handoffId', 'sessionId', 'user', 'connection', 'resumeToken', 'nextAction', 'status', 'statusLabel', 'draftSave'],
      draftSaveLayoutItemCount: 2,
      draftSaveSelectedSpaceCount: 1,
    },
  })

  assert.equal(buildAuthResumePanelState({
    email: 'resume@example.com',
    continuation: {
      nextAction: 'resume-authenticated-flow',
      resumeToken: 'resume-token',
    },
  }), null)
})

test('buildAuthReadyPanelState carries a configured continuation endpoint into the payload preview contract', () => {
  const state = buildAuthReadyPanelState({
    accountLabel: 'profile@example.com',
    handoffId: 'auth-profile-123',
    continuation: {
      nextAction: 'complete-profile',
      resumeToken: 'auth-profile-123:resume',
      status: 'action-required',
    },
    connection: {
      targetLabel: 'remote auth service',
      endpoint: '/api/auth/login',
    },
  }, {
    actionConnection: {
      targetLabel: 'remote auth service',
      endpoint: '/v2/auth/continue',
    },
  })

  assert.equal(state.actionPayloadPreview.continuationEndpoint, '/v2/auth/continue')
  assert.equal(state.connectionEndpoint, '/v2/auth/continue')
  assert.deepEqual(state.actionPayloadPreview.fieldKeys, ['displayName', 'phone'])
})

test('buildAuthReadyPanelState falls back to the persisted action connection for action-required backend resumes', () => {
  const state = buildAuthReadyPanelState({
    accountLabel: 'verify@example.com',
    handoffId: 'auth-verify-123',
    continuation: {
      nextAction: 'verify-email',
      resumeToken: 'auth-verify-123:resume',
      status: 'action-required',
    },
    connection: {
      targetLabel: 'remote auth service',
      endpoint: '/api/auth/login',
    },
    actionConnection: {
      targetLabel: 'remote auth service',
      endpoint: '/persisted/auth/continue',
    },
  })

  assert.equal(state.actionPayloadPreview.continuationEndpoint, '/persisted/auth/continue')
  assert.equal(state.connectionEndpoint, '/persisted/auth/continue')
  assert.equal(state.connectionLabel, 'remote auth service')
})


test('buildAuthResumePanelState falls back to the persisted handoff action connection for merge confirmation resumes', () => {
  const state = buildAuthResumePanelState({
    email: 'merge@example.com',
    handoffId: 'auth-merge-123',
    actionConnection: {
      targetLabel: 'remote auth service',
      endpoint: '/persisted/auth/continue',
    },
    continuation: {
      nextAction: 'confirm-merge-resolution',
      resumeToken: 'auth-merge-123:merge',
      status: 'action-required',
    },
  })

  assert.equal(state.actionPayloadPreview.continuationEndpoint, '/persisted/auth/continue')
  assert.equal(state.connectionEndpoint, '/persisted/auth/continue')
  assert.deepEqual(state.actionPayloadPreview.fieldKeys, ['mergeResolution'])
})

test('shouldAutoOpenAuthReadyPanel reopens the login modal for action-required auth continuations', () => {
  assert.equal(shouldAutoOpenAuthReadyPanel(null), false)
  assert.equal(shouldAutoOpenAuthReadyPanel({ accountLabel: 'user@example.com' }), false)
  assert.equal(shouldAutoOpenAuthReadyPanel({
    accountLabel: 'user@example.com',
    continuation: {
      nextAction: 'complete-profile',
      status: 'action-required',
    },
  }), true)
  assert.equal(shouldAutoOpenAuthReadyPanel({
    accountLabel: 'user@example.com',
    continuation: {
      nextAction: 'verify-email',
    },
  }), true)
  assert.equal(shouldAutoOpenAuthReadyPanel({
    accountLabel: 'user@example.com',
    continuation: {
      nextAction: 'confirm-merge-resolution',
    },
  }), true)
  assert.equal(shouldAutoOpenAuthReadyPanel({
    accountLabel: 'user@example.com',
    continuation: {
      nextAction: 'resume-authenticated-flow',
      status: 'ready',
    },
  }), false)
  assert.equal(shouldAutoOpenAuthReadyPanel({
    accountLabel: 'user@example.com',
    continuation: {
      nextAction: 'resume-authenticated-flow',
      status: 'ready',
      statusLabel: '이메일 인증 완료',
    },
  }), true)
  assert.equal(shouldAutoOpenAuthReadyPanel({
    accountLabel: 'user@example.com',
    continuation: {
      nextAction: 'complete-profile',
      status: 'action-required',
    },
  }, 'form'), false)
})

test('buildAuthSessionNotice summarizes restored guest draft details after login', () => {
  assert.deepEqual(buildAuthSessionNotice({
    accountLabel: 'user@example.com',
    handoffId: 'auth-20260406123000-2n9c',
    mergeMode: 'merged',
    restoredWishlistCount: 2,
    restoredCartCount: 1,
    restoredLayoutItemCount: 3,
    restoredRecommendationDraft: true,
    authMode: 'scaffold',
    authTransport: 'same-origin-middleware',
    intent: {
      label: '로그인 후 보드 저장',
      draftLabel: '거실 84A',
    },
    connection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/login',
    },
    guestDraftSummary: {
      apartmentLabel: '래미안 포레스트 84A',
      selectedRoomCount: 2,
      recommendationRoom: '거실',
    },
    draftSave: {
      draftLabel: '거실 배치 보드',
      apartmentLabel: '래미안 포레스트 84A',
      recommendationRoom: '거실',
      selectedSpaceIds: ['living', 'bed1'],
      layoutItemCount: 3,
    },
  }), {
    title: 'user@example.com 계정 연결됨',
    body: '게스트 초안을 계정에 연결했어요. 복원됨: 찜 2개 · 장바구니 1개 · 배치 3개 · 추천 초안. 로그인 후 보드 저장 (거실 84A) 단계까지 이어서 진행할 수 있어요.',
    restoredBits: ['찜 2개', '장바구니 1개', '배치 3개', '추천 초안'],
    draftContextBits: ['래미안 포레스트 84A', '공간 2개', '거실 추천'],
    draftSaveBits: ['초안 거실 배치 보드', '래미안 포레스트 84A', '거실 추천', '선택 공간 2개', '저장 배치 3개'],
  })
})

test('buildAuthSessionNotice falls back gracefully when nothing was restored', () => {
  assert.deepEqual(buildAuthSessionNotice({
    accountLabel: 'user@example.com',
    mergeMode: 'replaced',
  }), {
    title: 'user@example.com 계정 연결됨',
    body: '계정에 저장된 상태로 전환했어요.',
    restoredBits: [],
    draftContextBits: [],
    draftSaveBits: [],
  })

  assert.equal(buildAuthSessionNotice(null), null)
})

test('buildAuthSessionNotice surfaces backend continuation blockers in the restored session copy', () => {
  assert.deepEqual(buildAuthSessionNotice({
    accountLabel: 'verify@example.com',
    mergeMode: 'merged',
    continuation: {
      nextAction: 'verify-email',
      status: 'action-required',
      statusLabel: '이메일 인증 필요',
    },
  }), {
    title: 'verify@example.com 계정 연결됨',
    body: '게스트 초안을 계정에 연결했어요. 현재 단계: 이메일 인증 필요.',
    restoredBits: [],
    draftContextBits: [],
    draftSaveBits: [],
  })
})
