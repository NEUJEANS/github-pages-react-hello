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
      loginEndpoint: '/api/auth/login',
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
      loginEndpoint: '/api/auth/login',
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
      loginEndpoint: '/api/auth/login',
      credentialsMode: 'include',
      source: 'env:VITE_API_BASE_URL',
      isConfigured: true,
    },
  )

  assert.deepEqual(
    resolveAuthConfig({ env: {}, runtimeConfig: null, locationSearch: '' }),
    {
      apiBaseUrl: '',
      loginEndpoint: '/api/auth/login',
      credentialsMode: 'include',
      source: 'default',
      isConfigured: false,
    },
  )
})

test('resolveAuthConfig carries login endpoint and credential mode overrides for backend wiring', () => {
  assert.deepEqual(
    resolveAuthConfig({
      env: {
        VITE_AUTH_LOGIN_ENDPOINT: 'v1/session/login',
        VITE_AUTH_CREDENTIALS: 'same-origin',
      },
      runtimeConfig: {
        loginEndpoint: '/internal/auth/login',
        credentialsMode: 'omit',
      },
      locationSearch: '?authLoginEndpoint=%2Fquery-login&authCredentials=include',
    }),
    {
      apiBaseUrl: '',
      loginEndpoint: '/internal/auth/login',
      credentialsMode: 'omit',
      source: 'default',
      isConfigured: false,
    },
  )
})
