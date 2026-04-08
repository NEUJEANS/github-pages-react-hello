import test from 'node:test'
import assert from 'node:assert/strict'

import { buildAuthReadyPanelState, buildAuthSessionNotice, shouldAutoOpenAuthReadyPanel } from './auth-session-view-state.js'

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
  }), {
    title: 'user@example.com 계정 연결됨',
    subtitle: '게스트 초안을 계정에 이어붙인 상태예요.',
    restoredBits: ['찜 2개', '장바구니 1개', '배치 3개', '추천 초안'],
    draftContextBits: ['래미안 포레스트 84A', '공간 2개', '거실 추천'],
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
    subtitle: '현재 로그인 연결이 유지되고 있어요.',
    restoredBits: [],
    draftContextBits: [],
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
  }), {
    title: 'user@example.com 계정 연결됨',
    subtitle: '현재 로그인 연결이 유지되고 있어요.',
    restoredBits: [],
    draftContextBits: [],
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
    connectionEndpoint: '/api/auth/login',
    primaryActionLabel: '이메일 인증 확인',
    primaryActionHint: '인증 코드를 바로 제출하고, backend가 준비 완료를 돌려주면 원래 이어가려던 흐름으로 복귀할 수 있어요.',
    primaryActionDisabled: false,
    actionChecklist: {
      title: '이메일 인증 연결 준비',
      description: '백엔드가 이메일 인증 단계를 기다리고 있어요. 실제 인증 화면이 붙기 전까지 필요한 handoff 계약을 먼저 노출합니다.',
      items: [
        'resume token auth-user-1234:verify 으로 인증 확인 조회를 재개하기',
        '현재 인증 연결 대상 same-origin /api auth scaffold (/api/auth/login) 기준으로 폴링/재개 흐름 붙이기',
        '인증 완료 전에는 로그인 모달을 닫지 않고 상태만 갱신하기',
      ],
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
  })
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
      nextAction: 'resume-authenticated-flow',
      status: 'ready',
    },
  }), false)
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
  }), {
    title: 'user@example.com 계정 연결됨',
    body: '게스트 초안을 계정에 이어붙였어요. 래미안 포레스트 84A · 공간 2개 · 거실 추천 기준으로 이어졌어요. handoff auth-20260406123000-2n9c 기준으로 이어졌어요. 현재는 same-origin scaffold 응답으로 연결 상태를 확인 중이에요. 로그인 요청 대상은 same-origin /api auth scaffold (/api/auth/login)로 기록해뒀어요. 로그인 후 보드 저장 (거실 84A) 단계까지 이어서 진행할 수 있어요. 찜 2개 · 장바구니 1개 · 배치 3개 · 추천 초안 복원 내용을 이번 세션에 반영했어요.',
    restoredBits: ['찜 2개', '장바구니 1개', '배치 3개', '추천 초안'],
    draftContextBits: ['래미안 포레스트 84A', '공간 2개', '거실 추천'],
  })
})

test('buildAuthSessionNotice falls back gracefully when nothing was restored', () => {
  assert.deepEqual(buildAuthSessionNotice({
    accountLabel: 'user@example.com',
    mergeMode: 'replaced',
  }), {
    title: 'user@example.com 계정 연결됨',
    body: '계정 상태로 전환했어요.',
    restoredBits: [],
    draftContextBits: [],
  })

  assert.equal(buildAuthSessionNotice(null), null)
})
