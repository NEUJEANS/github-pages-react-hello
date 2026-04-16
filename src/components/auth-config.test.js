import test from 'node:test'
import assert from 'node:assert/strict'

import { detectLocalPagesAuthConfig, resolveAuthConfig, shouldProbeLocalPagesAuthConfig } from './auth-config.js'

test('resolveAuthConfig always returns frontend scaffold auth wiring while preserving the app base path', () => {
  assert.deepEqual(
    resolveAuthConfig({
      env: {
        BASE_URL: '/github-pages-react-hello/',
        VITE_AUTH_API_BASE_URL: 'https://auth-env.example.com/',
        VITE_API_BASE_URL: 'https://api-env.example.com/',
      },
      runtimeConfig: { apiBaseUrl: 'https://runtime.example.com/' },
      locationSearch: '?authApiBaseUrl=https%3A%2F%2Fquery.example.com%2F',
      locationOrigin: 'https://neujeans.github.io',
    }),
    {
      appBasePath: '/github-pages-react-hello',
      loginEndpoint: '/api/auth/login',
      signupEndpoint: '/api/auth/signup',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
      continueEndpoint: '/api/auth/continue',
      logoutEndpoint: '/api/auth/logout',
      credentialsMode: 'include',
      source: 'frontend-scaffold',
      isConfigured: true,
    },
  )
})

test('shouldProbeLocalPagesAuthConfig stays disabled in frontend scaffold mode', () => {
  assert.equal(
    shouldProbeLocalPagesAuthConfig({
      currentOrigin: 'https://neujeans.github.io',
      appBasePath: '/github-pages-react-hello/',
      source: 'default',
      allowLoopbackProbe: true,
    }),
    false,
  )
})

test('detectLocalPagesAuthConfig does not attempt loopback discovery anymore', async () => {
  assert.equal(
    await detectLocalPagesAuthConfig({
      currentOrigin: 'https://neujeans.github.io',
      appBasePath: '/github-pages-react-hello/',
      source: 'default',
      allowLoopbackProbe: true,
    }),
    null,
  )
})
