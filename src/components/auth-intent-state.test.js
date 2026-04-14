import test from 'node:test'
import assert from 'node:assert/strict'

import {
  canResumePostAuthIntent,
  resolvePostAuthScreen,
  shouldAttachDraftSaveToAuthContinuation,
  shouldAutoResumeReadyAuthModal,
  shouldCloseLoginModalAfterAuth,
  shouldOpenCartAfterAuthResume,
  shouldSubmitContinuationBeforeResume,
} from './auth-intent-state.js'

test('resolvePostAuthScreen prefers the serialized return screen from auth intent', () => {
  assert.equal(resolvePostAuthScreen({ returnScreen: 'layout' }), 'layout')
  assert.equal(resolvePostAuthScreen({ returnScreen: ' layout ' }), 'layout')
  assert.equal(resolvePostAuthScreen(null, 'home'), 'home')
  assert.equal(resolvePostAuthScreen({ returnScreen: '   ' }, 'beds'), 'beds')
})

test('resolvePostAuthScreen can fall back to backend continuation actions when no return screen is present', () => {
  assert.equal(resolvePostAuthScreen(null, null, { nextAction: 'save-layout-draft' }), 'layout')
  assert.equal(resolvePostAuthScreen(null, null, { nextAction: 'resume-layout-checkout' }), 'layout')
  assert.equal(resolvePostAuthScreen(null, null, { nextAction: 'resume-guest-draft' }), 'layout')
  assert.equal(resolvePostAuthScreen(null, null, { nextAction: 'resume-account-state' }), 'layout')
  assert.equal(resolvePostAuthScreen(null, null, { nextAction: 'checkout-cart' }), 'home')
  assert.equal(resolvePostAuthScreen(null, 'beds', { nextAction: 'resume-authenticated-flow' }), 'beds')
  assert.equal(resolvePostAuthScreen(null, 'beds', { nextAction: 'complete-profile' }), 'beds')
})

test('canResumePostAuthIntent only allows ready-panel continuation when a real screen target exists', () => {
  assert.equal(canResumePostAuthIntent({ returnScreen: 'layout' }), true)
  assert.equal(canResumePostAuthIntent(null, null, { nextAction: 'checkout-cart' }), true)
  assert.equal(canResumePostAuthIntent(null, 'layout', { nextAction: 'resume-authenticated-flow' }), true)
  assert.equal(canResumePostAuthIntent(null, null, { nextAction: 'resume-authenticated-flow' }), false)
  assert.equal(canResumePostAuthIntent(null, null, { nextAction: 'complete-profile' }), false)
  assert.equal(canResumePostAuthIntent(null, null, { nextAction: 'verify-email' }), false)
  assert.equal(canResumePostAuthIntent(null, 'home', { nextAction: 'verify-email' }), true)
})

test('shouldSubmitContinuationBeforeResume only marks real resumable auth handoffs for backend continuation submission', () => {
  assert.equal(shouldSubmitContinuationBeforeResume({ nextAction: 'save-layout-draft' }), true)
  assert.equal(shouldSubmitContinuationBeforeResume({ nextAction: 'resume-layout-checkout' }), true)
  assert.equal(shouldSubmitContinuationBeforeResume({ nextAction: 'resume-guest-draft' }), true)
  assert.equal(shouldSubmitContinuationBeforeResume({ nextAction: 'resume-account-state' }), true)
  assert.equal(shouldSubmitContinuationBeforeResume({ nextAction: 'checkout-cart' }), true)
  assert.equal(shouldSubmitContinuationBeforeResume({ nextAction: 'complete-profile' }), false)
  assert.equal(shouldSubmitContinuationBeforeResume({ nextAction: 'verify-email' }), false)
  assert.equal(shouldSubmitContinuationBeforeResume({ nextAction: 'retry-login' }), false)
  assert.equal(shouldSubmitContinuationBeforeResume(null), false)
})

test('shouldOpenCartAfterAuthResume reopens checkout intent flows after auth completes', () => {
  assert.equal(shouldOpenCartAfterAuthResume({ action: 'checkout-cart' }, null), true)
  assert.equal(shouldOpenCartAfterAuthResume(null, { nextAction: 'checkout-cart' }), true)
  assert.equal(shouldOpenCartAfterAuthResume({ action: 'login' }, { nextAction: 'save-layout-draft' }), false)
  assert.equal(shouldOpenCartAfterAuthResume(null, { nextAction: 'resume-authenticated-flow' }), false)
})

test('shouldAutoResumeReadyAuthModal only auto-advances ready layout resumptions', () => {
  assert.equal(shouldAutoResumeReadyAuthModal({ action: 'save-layout-draft' }, { nextAction: 'save-layout-draft', status: 'ready' }), true)
  assert.equal(shouldAutoResumeReadyAuthModal({ action: 'resume-account-state' }, { nextAction: 'resume-account-state', status: 'ready' }), true)
  assert.equal(shouldAutoResumeReadyAuthModal(null, { nextAction: 'resume-guest-draft', status: 'ready' }), true)
  assert.equal(shouldAutoResumeReadyAuthModal({ action: 'checkout-cart' }, { nextAction: 'checkout-cart', status: 'ready' }), false)
  assert.equal(shouldAutoResumeReadyAuthModal({ action: 'save-layout-draft' }, { nextAction: 'save-layout-draft', status: 'action-required' }), false)
  assert.equal(shouldAutoResumeReadyAuthModal({ action: 'login' }, { nextAction: 'save-layout-draft', status: 'ready' }), false)
  assert.equal(shouldAutoResumeReadyAuthModal(null, { nextAction: 'verify-email', status: 'ready' }), false)
})

test('shouldAttachDraftSaveToAuthContinuation keeps layout draft payloads attached for layout-oriented intents and resumptions', () => {
  assert.equal(shouldAttachDraftSaveToAuthContinuation({ action: 'save-layout-draft' }, { nextAction: 'complete-profile' }), true)
  assert.equal(shouldAttachDraftSaveToAuthContinuation({ action: 'resume-account-state' }, { nextAction: 'verify-email' }), true)
  assert.equal(shouldAttachDraftSaveToAuthContinuation({ action: 'login' }, { nextAction: 'save-layout-draft' }), true)
  assert.equal(shouldAttachDraftSaveToAuthContinuation({ action: 'checkout' }, { nextAction: 'checkout-cart' }), true)
  assert.equal(shouldAttachDraftSaveToAuthContinuation({ action: 'login' }, { nextAction: 'verify-email' }), false)
  assert.equal(shouldAttachDraftSaveToAuthContinuation(null, null), false)
})

test('shouldCloseLoginModalAfterAuth closes only after successful auth results without backend blockers or resumable follow-through', () => {
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true }), true)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true, data: { nextAction: 'resume-layout-checkout' } }), false)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true, data: { nextAction: 'checkout-cart' } }), false)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true }, { returnScreen: 'layout' }), false)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true }, { action: 'login', returnScreen: 'layout' }), true)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true, data: { nextAction: 'resume-authenticated-flow' } }, { action: 'login', returnScreen: 'layout' }), true)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true, data: { nextAction: 'complete-profile' } }), false)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true, data: { nextAction: 'verify-email' } }), false)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true, data: { nextAction: 'confirm-merge-resolution' } }), false)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true, data: { status: 'action-required' } }), false)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: false }), false)
  assert.equal(shouldCloseLoginModalAfterAuth(null), false)
})
