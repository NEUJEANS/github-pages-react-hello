import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAuthContinuationFieldState,
  buildAuthSessionResultSummary,
  buildEmptyLoginForm,
  pickPersistedAuthContinuationFields,
} from './auth-entry-shell-state.js'

test('buildAuthContinuationFieldState fills the frontend auth continuation fields with safe defaults', () => {
  assert.deepEqual(
    buildAuthContinuationFieldState({ displayName: '민지', verificationCode: '123456' }),
    {
      displayName: '민지',
      phone: '',
      verificationCode: '123456',
      mergeResolution: '',
    },
  )
})

test('pickPersistedAuthContinuationFields only keeps fields for actionable auth blockers', () => {
  assert.deepEqual(
    pickPersistedAuthContinuationFields(
      { nextAction: 'complete-profile' },
      { displayName: '하니', phone: '010-1234-5678' },
    ),
    {
      displayName: '하니',
      phone: '010-1234-5678',
    },
  )

  assert.equal(
    pickPersistedAuthContinuationFields(
      { nextAction: 'resume-authenticated-flow' },
      { displayName: '다니엘' },
    ),
    null,
  )
})

test('buildEmptyLoginForm returns a frontend-only default login form', () => {
  const form = buildEmptyLoginForm({ action: 'save-layout-draft', label: '보드 저장 이어가기' })

  assert.equal(form.mode, 'login')
  assert.equal(form.email, '')
  assert.equal(form.password, '')
  assert.equal(form.handoffId, null)
  assert.equal(form.status, 'idle')
  assert.equal(form.connection, null)
  assert.deepEqual(form.intent, {
    source: null,
    action: 'save-layout-draft',
    label: '보드 저장 이어가기',
    returnScreen: null,
    draftLabel: null,
  })
})

test('buildAuthSessionResultSummary keeps the auth-ready session contract compact for the shell', () => {
  assert.deepEqual(
    buildAuthSessionResultSummary({
      accountLabel: '민지',
      sessionId: 'demo-minji',
      handoffId: 'handoff-123',
      wishlistCount: 2,
      cartCount: 1,
      layoutItemCount: 4,
      hasRecommendationDraft: true,
      guestDraftSummary: { layoutItemCount: 4 },
      draftSave: { draftLabel: '프로젝트 레이아웃 보드' },
      intent: { action: 'save-layout-draft', returnScreen: 'layout' },
      connection: { source: 'frontend-scaffold' },
      continuation: {
        resumeToken: 'handoff-123:resume',
        nextAction: 'resume-authenticated-flow',
        status: 'ready',
        statusLabel: '이어서 진행 가능',
      },
      authMode: 'scaffold',
      authTransport: 'frontend-scaffold',
    }),
    {
      accountLabel: '민지',
      sessionId: 'demo-minji',
      handoffId: 'handoff-123',
      mergeMode: null,
      mergedDraftCount: 0,
      restoredWishlistCount: 0,
      restoredCartCount: 0,
      restoredLayoutItemCount: 0,
      restoredRecommendationDraft: false,
      wishlistCount: 2,
      cartCount: 1,
      layoutItemCount: 4,
      hasRecommendationDraft: true,
      guestDraftSummary: { layoutItemCount: 4 },
      draftSave: { draftLabel: '프로젝트 레이아웃 보드' },
      intent: { action: 'save-layout-draft', returnScreen: 'layout' },
      connection: { source: 'frontend-scaffold' },
      resumeToken: 'handoff-123:resume',
      nextAction: 'resume-authenticated-flow',
      continuationStatus: 'ready',
      continuationStatusLabel: '이어서 진행 가능',
      authMode: 'scaffold',
      authTransport: 'frontend-scaffold',
    },
  )
})
