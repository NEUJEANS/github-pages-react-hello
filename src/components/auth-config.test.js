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
      source: 'env:VITE_API_BASE_URL',
      isConfigured: true,
    },
  )

  assert.deepEqual(
    resolveAuthConfig({ env: {}, runtimeConfig: null, locationSearch: '' }),
    {
      apiBaseUrl: '',
      source: 'default',
      isConfigured: false,
    },
  )
})
