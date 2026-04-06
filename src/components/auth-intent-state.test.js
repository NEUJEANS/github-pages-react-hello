import test from 'node:test'
import assert from 'node:assert/strict'

import { resolvePostAuthScreen, shouldCloseLoginModalAfterAuth } from './auth-intent-state.js'

test('resolvePostAuthScreen prefers the serialized return screen from auth intent', () => {
  assert.equal(resolvePostAuthScreen({ returnScreen: 'layout' }), 'layout')
  assert.equal(resolvePostAuthScreen({ returnScreen: ' layout ' }), 'layout')
  assert.equal(resolvePostAuthScreen(null, 'home'), 'home')
  assert.equal(resolvePostAuthScreen({ returnScreen: '   ' }, 'beds'), 'beds')
})

test('shouldCloseLoginModalAfterAuth closes only after successful auth results', () => {
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: true }), true)
  assert.equal(shouldCloseLoginModalAfterAuth({ ok: false }), false)
  assert.equal(shouldCloseLoginModalAfterAuth(null), false)
})
