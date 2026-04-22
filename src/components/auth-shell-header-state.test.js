import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildShellAccountIdentity,
  buildShellAccountMenuActions,
  buildShellHeaderSearchState,
  shouldReloadAfterLoginSuccess,
} from './auth-shell-header-state.js'

test('buildShellHeaderSearchState maps screens to focused search copy', () => {
  assert.deepEqual(buildShellHeaderSearchState('layout'), {
    label: '보드 가구 검색',
    helper: '레이아웃 보드에서 바로 배치할 가구를 찾아보세요.',
    targetScreen: 'layout',
  })

  assert.deepEqual(buildShellHeaderSearchState('home'), {
    label: '가구 탐색 시작',
    helper: '추천 가구와 카탈로그를 바로 둘러보세요.',
    targetScreen: 'beds',
  })
})

test('buildShellAccountIdentity prefers profile display name and derives an initial', () => {
  assert.deepEqual(buildShellAccountIdentity({
    accountState: {
      profile: {
        displayName: '하늘',
      },
    },
    savedAt: '2026-04-22T03:00:00.000Z',
  }), {
    label: '하늘',
    initial: '하',
    subtitle: '로그인됨',
  })
})

test('buildShellAccountMenuActions returns restore and logout actions for signed-in users', () => {
  assert.deepEqual(buildShellAccountMenuActions({
    authSession: { accountLabel: 'user@example.com' },
    hasRestorableLayout: true,
  }), [
    {
      id: 'account',
      label: '계정 상태 보기',
      description: '현재 로그인 상태와 이어질 작업을 확인합니다.',
    },
    {
      id: 'restore-layout',
      label: '저장 보드 불러오기',
      description: '계정에 저장된 레이아웃 보드를 다시 적용합니다.',
    },
    {
      id: 'logout',
      label: '로그아웃',
      description: '현재 계정 연결을 해제합니다.',
      tone: 'danger',
    },
  ])
})

test('shouldReloadAfterLoginSuccess reloads whenever a login-created session is available', () => {
  assert.equal(shouldReloadAfterLoginSuccess({
    ok: true,
    data: {
      sessionId: 'auth-session-1',
    },
  }, 'login'), true)

  assert.equal(shouldReloadAfterLoginSuccess({
    ok: true,
    data: {
      sessionId: 'auth-session-1',
      nextAction: 'complete-profile',
    },
  }, 'login'), true)

  assert.equal(shouldReloadAfterLoginSuccess({
    ok: true,
    data: {
      sessionId: 'auth-session-1',
    },
  }, 'signup'), false)
})
