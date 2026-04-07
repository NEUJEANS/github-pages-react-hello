import test from 'node:test'
import assert from 'node:assert/strict'

import { resolvePostAuthScreen, shouldCloseLoginModalAfterAuth } from './auth-intent-state.js'

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
  assert.equal(resolvePostAuthScreen(null, 'beds', { nextAction: 'complete-profile' }), 'beds')
})

test('shouldCloseLoginModalAfterAuth closes only after successful auth results without backend blockers', () => {
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true }), true)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true, data: { nextAction: 'resume-layout-checkout' } }), true)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true, data: { nextAction: 'complete-profile' } }), false)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true, data: { nextAction: 'verify-email' } }), false)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true, data: { status: 'action-required' } }), false)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: false }), false)
  assert.equal(shouldCloseLoginModalAfterAuth(null), false)
})
