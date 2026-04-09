import test from 'node:test'
import assert from 'node:assert/strict'

import { shouldPreservePersistedAuthSessionOnBootstrapFailure } from './auth-bootstrap-state.js'

test('shouldPreservePersistedAuthSessionOnBootstrapFailure keeps same-origin scaffold sessions when bootstrap read fails', () => {
  const persistedSession = {
    authMode: 'scaffold',
    connection: {
      targetLabel: 'same-origin /api auth scaffold',
      endpoint: '/api/auth/login',
    },
  }

  assert.equal(
    shouldPreservePersistedAuthSessionOnBootstrapFailure({ ok: false, status: 401, meta: { authMode: 'scaffold' } }, persistedSession),
    true,
  )
  assert.equal(
    shouldPreservePersistedAuthSessionOnBootstrapFailure({ ok: false, status: 503, meta: { authMode: 'remote' } }, persistedSession),
    true,
  )
})

test('shouldPreservePersistedAuthSessionOnBootstrapFailure does not keep remote backend sessions on auth failure', () => {
  const persistedSession = {
    authMode: 'remote',
    connection: {
      targetLabel: 'api.example.com',
      endpoint: '/api/auth/login',
    },
  }

  assert.equal(
    shouldPreservePersistedAuthSessionOnBootstrapFailure({ ok: false, status: 401, meta: { authMode: 'remote' } }, persistedSession),
    false,
  )
})
