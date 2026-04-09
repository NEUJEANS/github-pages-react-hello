import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveAuthConfig } from './auth-config.js'

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
    }),
    {
      apiBaseUrl: '',
      currentOrigin: '',
      appBasePath: '/github-pages-react-hello/',
      loginEndpoint: '/api/auth/login',
      signupEndpoint: '/api/auth/signup',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
      continueEndpoint: '/api/auth/continue',
      logoutEndpoint: '/api/auth/logout',
      credentialsMode: 'include',
      source: 'default',
      isConfigured: false,
    },
  )
})
