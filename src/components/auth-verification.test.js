import test from 'node:test'
import assert from 'node:assert/strict'

import { openIdentityVerificationWindow, resolveVerificationCallbackUrl } from './auth-verification.js'

test('resolveVerificationCallbackUrl prefixes the app base path for same-origin auth callback routes', () => {
  assert.equal(
    resolveVerificationCallbackUrl('/api/auth/verification/callback?verificationId=verify_123&status=verified', {
      apiBaseUrl: 'http://127.0.0.1:4174',
      appBasePath: '/github-pages-react-hello/',
      currentOrigin: 'http://127.0.0.1:4174',
    }),
    'http://127.0.0.1:4174/github-pages-react-hello/api/auth/verification/callback?verificationId=verify_123&status=verified',
  )
})

test('openIdentityVerificationWindow opens the resolved callback URL', () => {
  const calls = []
  const previousWindow = globalThis.window
  globalThis.window = {
    open: (...args) => {
      calls.push(args)
      return { closed: false }
    },
  }

  try {
    openIdentityVerificationWindow('/api/auth/verification/callback?verificationId=verify_123&status=verified', {
      apiBaseUrl: 'http://127.0.0.1:4174',
      appBasePath: '/github-pages-react-hello/',
      currentOrigin: 'http://127.0.0.1:4174',
    })
  } finally {
    globalThis.window = previousWindow
  }

  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], 'http://127.0.0.1:4174/github-pages-react-hello/api/auth/verification/callback?verificationId=verify_123&status=verified')
  assert.equal(calls[0][1], 'havenly-identity-verification')
})
