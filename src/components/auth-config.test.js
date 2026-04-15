import test from 'node:test'
import assert from 'node:assert/strict'

import { detectLocalPagesAuthConfig, resolveAuthConfig, shouldProbeLocalPagesAuthConfig } from './auth-config.js'

test('resolveAuthConfig prefers runtime overrides, then query params, then env fallbacks', () => {
  assert.deepEqual(
    resolveAuthConfig({
      env: {
        VITE_AUTH_API_BASE_URL: 'https://auth-env.example.com/',
        VITE_API_BASE_URL: 'https://api-env.example.com/',
      },
      runtimeConfig: { apiBaseUrl: 'https://runtime.example.com/' },
      locationSearch: '?authApiBaseUrl=https%3A%2F%2Fquery.example.com%2F',
    }),
    {
      apiBaseUrl: 'https://runtime.example.com',
      currentOrigin: '',
      appBasePath: '/',
      loginEndpoint: '/api/auth/login',
      signupEndpoint: '/api/auth/signup',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
      continueEndpoint: '/api/auth/continue',
      logoutEndpoint: '/api/auth/logout',
      credentialsMode: 'include',
      allowLoopbackProbe: false,
      loopbackProbeBlockedReason: '',
      source: 'runtime',
      isConfigured: true,
    },
  )

  assert.deepEqual(
    resolveAuthConfig({
      env: {
        VITE_AUTH_API_BASE_URL: 'https://auth-env.example.com/',
        VITE_API_BASE_URL: 'https://api-env.example.com/',
      },
      runtimeConfig: {},
      locationSearch: '?authApiBaseUrl=https%3A%2F%2Fquery.example.com%2F',
    }),
    {
      apiBaseUrl: 'https://query.example.com',
      currentOrigin: '',
      appBasePath: '/',
      loginEndpoint: '/api/auth/login',
      signupEndpoint: '/api/auth/signup',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
      continueEndpoint: '/api/auth/continue',
      logoutEndpoint: '/api/auth/logout',
      credentialsMode: 'include',
      allowLoopbackProbe: false,
      loopbackProbeBlockedReason: '',
      source: 'query',
      isConfigured: true,
    },
  )

  assert.deepEqual(
    resolveAuthConfig({
      env: { VITE_API_BASE_URL: 'https://api-env.example.com/' },
      runtimeConfig: null,
      locationSearch: '',
    }),
    {
      apiBaseUrl: 'https://api-env.example.com',
      currentOrigin: '',
      appBasePath: '/',
      loginEndpoint: '/api/auth/login',
      signupEndpoint: '/api/auth/signup',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
      continueEndpoint: '/api/auth/continue',
      logoutEndpoint: '/api/auth/logout',
      credentialsMode: 'include',
      allowLoopbackProbe: false,
      loopbackProbeBlockedReason: '',
      source: 'env:VITE_API_BASE_URL',
      isConfigured: true,
    },
  )

  assert.deepEqual(
    resolveAuthConfig({ env: {}, runtimeConfig: null, locationSearch: '' }),
    {
      apiBaseUrl: '',
      currentOrigin: '',
      appBasePath: '/',
      loginEndpoint: '/api/auth/login',
      signupEndpoint: '/api/auth/signup',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
      continueEndpoint: '/api/auth/continue',
      logoutEndpoint: '/api/auth/logout',
      credentialsMode: 'include',
      allowLoopbackProbe: false,
      loopbackProbeBlockedReason: '',
      source: 'default',
      isConfigured: false,
    },
  )
})

test('resolveAuthConfig carries login/session/pending/continue endpoint and credential mode overrides for backend wiring', () => {
  assert.deepEqual(
    resolveAuthConfig({
      env: {
        VITE_AUTH_LOGIN_ENDPOINT: 'v1/session/login',
        VITE_AUTH_SESSION_ENDPOINT: 'v1/session/me',
        VITE_AUTH_PENDING_ENDPOINT: 'v1/session/pending',
        VITE_AUTH_CONTINUE_ENDPOINT: 'v1/session/continue',
        VITE_AUTH_LOGOUT_ENDPOINT: 'v1/session/logout',
        VITE_AUTH_CREDENTIALS: 'same-origin',
      },
      runtimeConfig: {
        loginEndpoint: '/internal/auth/login',
        sessionEndpoint: '/internal/auth/session',
        pendingEndpoint: '/internal/auth/pending',
        continueEndpoint: '/internal/auth/continue',
        logoutEndpoint: '/internal/auth/logout',
        credentialsMode: 'omit',
      },
      locationSearch: '?authLoginEndpoint=%2Fquery-login&authSessionEndpoint=%2Fquery-session&authPendingEndpoint=%2Fquery-pending&authContinueEndpoint=%2Fquery-continue&authLogoutEndpoint=%2Fquery-logout&authCredentials=include',
    }),
    {
      apiBaseUrl: '',
      currentOrigin: '',
      appBasePath: '/',
      loginEndpoint: '/internal/auth/login',
      signupEndpoint: '/api/auth/signup',
      sessionEndpoint: '/internal/auth/session',
      pendingEndpoint: '/internal/auth/pending',
      continueEndpoint: '/internal/auth/continue',
      logoutEndpoint: '/internal/auth/logout',
      credentialsMode: 'omit',
      allowLoopbackProbe: false,
      loopbackProbeBlockedReason: '',
      source: 'runtime',
      isConfigured: true,
    },
  )
})

test('resolveAuthConfig marks query and env endpoint-only overrides as configured auth wiring', () => {
  assert.deepEqual(
    resolveAuthConfig({
      env: {},
      runtimeConfig: null,
      locationSearch: '?authLoginEndpoint=%2Fquery-login&authContinueEndpoint=%2Fquery-continue&authCredentials=same-origin',
    }),
    {
      apiBaseUrl: '',
      currentOrigin: '',
      appBasePath: '/',
      loginEndpoint: '/query-login',
      signupEndpoint: '/api/auth/signup',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
      continueEndpoint: '/query-continue',
      logoutEndpoint: '/api/auth/logout',
      credentialsMode: 'same-origin',
      allowLoopbackProbe: false,
      loopbackProbeBlockedReason: '',
      source: 'query',
      isConfigured: true,
    },
  )

  assert.deepEqual(
    resolveAuthConfig({
      env: {
        VITE_AUTH_LOGIN_ENDPOINT: '/env-login',
        VITE_AUTH_CONTINUE_ENDPOINT: '/env-continue',
      },
      runtimeConfig: null,
      locationSearch: '',
    }),
    {
      apiBaseUrl: '',
      currentOrigin: '',
      appBasePath: '/',
      loginEndpoint: '/env-login',
      signupEndpoint: '/api/auth/signup',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
      continueEndpoint: '/env-continue',
      logoutEndpoint: '/api/auth/logout',
      credentialsMode: 'include',
      allowLoopbackProbe: false,
      loopbackProbeBlockedReason: '',
      source: 'env:auth-endpoint',
      isConfigured: true,
    },
  )
})


test('resolveAuthConfig ignores an external runtime apiBaseUrl on loopback previews', () => {
  assert.deepEqual(
    resolveAuthConfig({
      env: { BASE_URL: '/github-pages-react-hello/' },
      runtimeConfig: { apiBaseUrl: 'https://auth-runtime.example.com/' },
      locationOrigin: 'http://127.0.0.1:4176',
    }),
    {
      apiBaseUrl: '',
      currentOrigin: 'http://127.0.0.1:4176',
      appBasePath: '/github-pages-react-hello/',
      loginEndpoint: '/api/auth/login',
      signupEndpoint: '/api/auth/signup',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
      continueEndpoint: '/api/auth/continue',
      logoutEndpoint: '/api/auth/logout',
      credentialsMode: 'include',
      allowLoopbackProbe: false,
      loopbackProbeBlockedReason: '',
      source: 'default',
      isConfigured: false,
    },
  )
})

test('resolveAuthConfig carries the Vite base path for same-origin scaffold routing under subpath deploys', () => {
  assert.deepEqual(
    resolveAuthConfig({
      env: { BASE_URL: '/github-pages-react-hello/' },
      runtimeConfig: null,
      locationSearch: '',
      locationOrigin: 'https://neujeans.github.io',
    }),
    {
      apiBaseUrl: '',
      currentOrigin: 'https://neujeans.github.io',
      appBasePath: '/github-pages-react-hello/',
      loginEndpoint: '/api/auth/login',
      signupEndpoint: '/api/auth/signup',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
      continueEndpoint: '/api/auth/continue',
      logoutEndpoint: '/api/auth/logout',
      credentialsMode: 'include',
      allowLoopbackProbe: false,
      loopbackProbeBlockedReason: '',
      source: 'default',
      isConfigured: false,
    },
  )
})

test('shouldProbeLocalPagesAuthConfig only enables loopback probing for explicit opt-in on default GitHub Pages subpath deploys', () => {
  assert.equal(
    shouldProbeLocalPagesAuthConfig({
      currentOrigin: 'https://neujeans.github.io',
      appBasePath: '/github-pages-react-hello/',
      source: 'default',
      allowLoopbackProbe: true,
    }),
    true,
  )

  assert.equal(
    shouldProbeLocalPagesAuthConfig({
      currentOrigin: 'https://neujeans.github.io',
      appBasePath: '/',
      source: 'default',
      allowLoopbackProbe: true,
    }),
    false,
  )

  assert.equal(
    shouldProbeLocalPagesAuthConfig({
      currentOrigin: 'https://neujeans.github.io',
      appBasePath: '/github-pages-react-hello/',
      source: 'runtime',
      allowLoopbackProbe: true,
    }),
    false,
  )
})

test('detectLocalPagesAuthConfig resolves the local standalone auth backend when explicit loopback probing is enabled', async () => {
  const calls = []
  const result = await detectLocalPagesAuthConfig({
    currentOrigin: 'https://neujeans.github.io',
    appBasePath: '/github-pages-react-hello/',
    source: 'default',
    allowLoopbackProbe: true,
    candidates: ['http://127.0.0.1:4175'],
    fetchImpl: async (url) => {
      calls.push(url)
      return {
        ok: true,
        json: async () => ({ ok: true, storage: 'sqlite' }),
      }
    },
  })

  assert.deepEqual(calls, ['http://127.0.0.1:4175/api/auth/health'])
  assert.deepEqual(result, {
    apiBaseUrl: 'http://127.0.0.1:4175',
    currentOrigin: 'https://neujeans.github.io',
    appBasePath: '/github-pages-react-hello/',
    loginEndpoint: '/api/auth/login',
    signupEndpoint: '/api/auth/signup',
    sessionEndpoint: '/api/auth/session',
    pendingEndpoint: '/api/auth/pending',
    continueEndpoint: '/api/auth/continue',
    logoutEndpoint: '/api/auth/logout',
    credentialsMode: 'include',
    source: 'runtime',
    isConfigured: true,
  })
})

test('resolveAuthConfig preserves a loopback probe blocker hint from runtime config', () => {
  assert.deepEqual(
    resolveAuthConfig({
      env: { BASE_URL: '/github-pages-react-hello/' },
      runtimeConfig: { loopbackProbeBlockedReason: 'loopback-address-space-denied' },
      locationOrigin: 'https://neujeans.github.io',
    }),
    {
      apiBaseUrl: '',
      currentOrigin: 'https://neujeans.github.io',
      appBasePath: '/github-pages-react-hello/',
      loginEndpoint: '/api/auth/login',
      signupEndpoint: '/api/auth/signup',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
      continueEndpoint: '/api/auth/continue',
      logoutEndpoint: '/api/auth/logout',
      credentialsMode: 'include',
      allowLoopbackProbe: false,
      loopbackProbeBlockedReason: 'loopback-address-space-denied',
      source: 'default',
      isConfigured: false,
    },
  )
})

test('resolveAuthConfig exposes explicit query opt-in for loopback probing', () => {
  assert.deepEqual(
    resolveAuthConfig({
      env: { BASE_URL: '/github-pages-react-hello/' },
      runtimeConfig: null,
      locationSearch: '?authLoopbackProbe=1',
      locationOrigin: 'https://neujeans.github.io',
    }),
    {
      apiBaseUrl: '',
      currentOrigin: 'https://neujeans.github.io',
      appBasePath: '/github-pages-react-hello/',
      loginEndpoint: '/api/auth/login',
      signupEndpoint: '/api/auth/signup',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
      continueEndpoint: '/api/auth/continue',
      logoutEndpoint: '/api/auth/logout',
      credentialsMode: 'include',
      allowLoopbackProbe: true,
      loopbackProbeBlockedReason: '',
      source: 'default',
      isConfigured: false,
    },
  )
})
