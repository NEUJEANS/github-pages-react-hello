import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAuthGuardPanelState,
  buildAuthLoginPanelState,
  buildAuthReadyPanelState,
  buildAuthResumePanelState,
  buildAuthSessionNotice,
  resolveAuthSessionNoticePrimaryAction,
  shouldAutoOpenAuthReadyPanel,
} from './auth-session-view-state.js'

test('buildAuthLoginPanelState keeps only the user-facing login panel contract', () => {
  assert.deepEqual(buildAuthLoginPanelState({
    authSummary: {
      handoffId: 'auth-20260409180000-login',
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
    },
    intent: {
      label: '로그인 후 주문 이어가기',
      draftLabel: '카트 handoff',
    },
  }), {
    handoffId: 'auth-20260409180000-login',
    intentLabel: '로그인 후 주문 이어가기',
    intentDraftLabel: '카트 handoff',
    draftSaveBits: ['초안 거실 배치 보드', '래미안 포레스트 84A', '거실 추천', '선택 공간 2개', '저장 배치 4개'],
  })
})

test('buildAuthGuardPanelState summarizes guarded login context without backend wiring metadata', () => {
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
    intentLabel: '로그인 후 보드 저장',
    intentDraftLabel: '84A 거실',
    draftContextBits: ['래미안 포레스트 84A', '공간 2개', '거실 추천'],
    draftSaveBits: ['초안 84A 거실 보드', '래미안 포레스트 84A', '거실 추천', '선택 공간 3개', '저장 배치 5개'],
  })
})

test('buildAuthReadyPanelState returns the customer-facing resume contract only', () => {
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
    draftSave: {
      draftLabel: '거실 배치 보드',
      apartmentLabel: '래미안 포레스트 84A',
      recommendationRoom: '거실',
      selectedSpaceIds: ['living', 'bed1'],
      layoutItemCount: 3,
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
    primaryActionLabel: '보드 저장 이어가기',
    primaryActionHint: '로그인 후 저장하려던 배치 초안을 그대로 이어갈 수 있어요.',
    primaryActionDisabled: false,
    actionChecklist: null,
  })
})

test('buildAuthReadyPanelState keeps action-required auth copy customer-facing without technical debug text', () => {
  const scenarios = [
    buildAuthReadyPanelState({
      accountLabel: 'profile@example.com',
      continuation: {
        nextAction: 'complete-profile',
        resumeToken: 'auth-profile-1',
        status: 'action-required',
        statusLabel: '프로필 보완 필요',
      },
    }),
    buildAuthReadyPanelState({
      accountLabel: 'verify@example.com',
      continuation: {
        nextAction: 'verify-email',
        resumeToken: 'auth-verify-1',
        status: 'action-required',
        statusLabel: '이메일 인증 필요',
      },
    }),
    buildAuthReadyPanelState({
      accountLabel: 'merge@example.com',
      continuation: {
        nextAction: 'confirm-merge-resolution',
        resumeToken: 'auth-merge-1',
        status: 'action-required',
        statusLabel: '초안 병합 확인 필요',
      },
    }),
  ]

  const forbidden = /backend|payload|handoff|resume token|\/api\/auth\/continue|same-origin|scaffold/i

  scenarios.forEach((state) => {
    const visibleCopy = [
      state?.title,
      state?.subtitle,
      state?.primaryActionHint,
      state?.actionChecklist?.title,
      state?.actionChecklist?.description,
      ...(state?.actionChecklist?.items ?? []),
    ].filter(Boolean).join(' | ')

    assert.equal(forbidden.test(visibleCopy), false, visibleCopy)
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
  })

  assert.equal(keepGuest.primaryActionLabel, '현재 초안으로 계속')
  assert.match(keepGuest.primaryActionHint, /현재 초안/)
  assert.equal(replaceWithAccount.primaryActionLabel, '계정 상태로 계속')
  assert.match(replaceWithAccount.primaryActionHint, /계정에 저장된 상태/)
})

test('buildAuthResumePanelState exposes pending action-required handoffs without technical transport metadata', () => {
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
    primaryActionLabel: '이메일 인증 확인',
    primaryActionHint: '인증 확인이 끝나면 원래 이어가려던 흐름으로 돌아갈 수 있어요.',
    primaryActionDisabled: false,
    actionChecklist: {
      title: '이메일 인증 준비',
      description: '로그인은 연결됐고, 인증 확인만 마치면 바로 이어서 사용할 수 있어요.',
      items: [
        '인증 창을 열어 본인 확인을 완료하기',
        '인증이 끝나면 현재 화면에서 확인 상태를 갱신하기',
        '확인이 끝나면 원래 하려던 흐름으로 돌아가기',
      ],
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

test('resolveAuthSessionNoticePrimaryAction uses specific labels for continuation blockers and resumable states', () => {
  assert.deepEqual(resolveAuthSessionNoticePrimaryAction({
    nextAction: 'complete-profile',
    primaryActionLabel: '프로필 보완 제출',
  }), {
    label: '프로필 보완 열기',
    needsAccountModal: true,
  })

  assert.deepEqual(resolveAuthSessionNoticePrimaryAction({
    nextAction: 'verify-email',
    primaryActionLabel: '이메일 인증 확인',
  }), {
    label: '이메일 인증 이어가기',
    needsAccountModal: true,
  })

  assert.deepEqual(resolveAuthSessionNoticePrimaryAction({
    nextAction: 'confirm-merge-resolution',
    primaryActionLabel: '병합 방향 확정',
  }), {
    label: '병합 방향 선택 열기',
    needsAccountModal: true,
  })

  assert.deepEqual(resolveAuthSessionNoticePrimaryAction({
    nextAction: 'save-layout-draft',
    primaryActionLabel: '보드 저장 이어가기',
  }), {
    label: '보드 열기',
    needsAccountModal: false,
  })
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
    bodyHtml: '<strong>게스트 초안을 계정에 연결했어요.</strong> 복원됨: <strong>찜 2개 · 장바구니 1개 · 배치 3개 · 추천 초안</strong>. 로그인 후 보드 저장 (거실 84A) 단계까지 이어서 진행할 수 있어요.',
    restoredBits: ['찜 2개', '장바구니 1개', '배치 3개', '추천 초안'],
    draftContextBits: ['래미안 포레스트 84A', '공간 2개', '거실 추천'],
    draftSaveBits: ['초안 거실 배치 보드', '래미안 포레스트 84A', '거실 추천', '선택 공간 2개', '저장 배치 3개'],
  })
})

test('buildAuthSessionNotice surfaces continuation blockers in customer-facing copy', () => {
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
    bodyHtml: '<strong>게스트 초안을 계정에 연결했어요.</strong> 현재 단계: <strong>이메일 인증 필요</strong>.',
    restoredBits: [],
    draftContextBits: [],
    draftSaveBits: [],
  })
})

test('buildAuthSessionNotice escapes dynamic copy before building bodyHtml', () => {
  const notice = buildAuthSessionNotice({
    accountLabel: 'verify@example.com',
    mergeMode: 'replaced',
    continuation: {
      nextAction: 'verify-email',
      status: 'action-required',
      statusLabel: '<img src=x onerror=alert(1)>',
    },
    intent: {
      label: '<script>alert(1)</script>',
      draftLabel: '"draft"',
    },
  })

  assert.equal(notice.body.includes('<img src=x onerror=alert(1)>'), true)
  assert.equal(notice.bodyHtml.includes('<img src=x onerror=alert(1)>'), false)
  assert.equal(notice.bodyHtml.includes('<script>alert(1)</script>'), false)
  assert.match(notice.bodyHtml, /&lt;img src=x onerror=alert\(1\)&gt;/)
  assert.match(notice.bodyHtml, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.match(notice.bodyHtml, /&quot;draft&quot;/)
})
