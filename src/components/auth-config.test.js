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
      loginEndpoint: '/api/auth/login',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
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
      loginEndpoint: '/api/auth/login',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
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
      loginEndpoint: '/api/auth/login',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
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
      loginEndpoint: '/api/auth/login',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
      logoutEndpoint: '/api/auth/logout',
      credentialsMode: 'include',
      source: 'default',
      isConfigured: false,
    },
  )
})

test('resolveAuthConfig carries login/session/pending endpoint and credential mode overrides for backend wiring', () => {
  assert.deepEqual(
    resolveAuthConfig({
      env: {
        VITE_AUTH_LOGIN_ENDPOINT: 'v1/session/login',
        VITE_AUTH_SESSION_ENDPOINT: 'v1/session/me',
        VITE_AUTH_PENDING_ENDPOINT: 'v1/session/pending',
        VITE_AUTH_LOGOUT_ENDPOINT: 'v1/session/logout',
        VITE_AUTH_CREDENTIALS: 'same-origin',
      },
      runtimeConfig: {
        loginEndpoint: '/internal/auth/login',
        sessionEndpoint: '/internal/auth/session',
        pendingEndpoint: '/internal/auth/pending',
        logoutEndpoint: '/internal/auth/logout',
        credentialsMode: 'omit',
      },
      locationSearch: '?authLoginEndpoint=%2Fquery-login&authSessionEndpoint=%2Fquery-session&authPendingEndpoint=%2Fquery-pending&authLogoutEndpoint=%2Fquery-logout&authCredentials=include',
    }),
    {
      apiBaseUrl: '',
      currentOrigin: '',
      loginEndpoint: '/internal/auth/login',
      sessionEndpoint: '/internal/auth/session',
      pendingEndpoint: '/internal/auth/pending',
      logoutEndpoint: '/internal/auth/logout',
      credentialsMode: 'omit',
      source: 'default',
      isConfigured: false,
    },
  )
})
