import test from 'node:test'
import assert from 'node:assert/strict'

import { buildAuthWiringState } from './auth-wiring-state.js'

test('buildAuthWiringState resolves same-origin auth endpoints under an app base path', () => {
  assert.deepEqual(
    buildAuthWiringState({
      loginEndpoint: '/api/auth/login',
      signupEndpoint: '/api/auth/signup',
      sessionEndpoint: '/api/auth/session',
      pendingEndpoint: '/api/auth/pending',
      continueEndpoint: '/api/auth/continue',
      logoutEndpoint: '/api/auth/logout',
      appBasePath: '/github-pages-react-hello/',
      currentOrigin: 'https://havenly.example.com',
      credentialsMode: 'include',
      source: 'default',
      isConfigured: false,
    }),
    {
      source: 'default',
      credentialsMode: 'include',
      apiBaseUrl: null,
      appBasePath: '/github-pages-react-hello/',
      isConfigured: false,
      targets: {
        login: {
          endpoint: '/api/auth/login',
          resolvedUrl: '/github-pages-react-hello/api/auth/login',
          mode: 'same-origin',
        },
        signup: {
          endpoint: '/api/auth/signup',
          resolvedUrl: '/github-pages-react-hello/api/auth/signup',
          mode: 'same-origin',
        },
        session: {
          endpoint: '/api/auth/session',
          resolvedUrl: '/github-pages-react-hello/api/auth/session',
          mode: 'same-origin',
        },
        pending: {
          endpoint: '/api/auth/pending',
          resolvedUrl: '/github-pages-react-hello/api/auth/pending',
          mode: 'same-origin',
        },
        continue: {
          endpoint: '/api/auth/continue',
          resolvedUrl: '/github-pages-react-hello/api/auth/continue',
          mode: 'same-origin',
        },
        logout: {
          endpoint: '/api/auth/logout',
          resolvedUrl: '/github-pages-react-hello/api/auth/logout',
          mode: 'same-origin',
        },
      },
    },
  )
})

test('buildAuthWiringState resolves remote auth targets from configured api base urls', () => {
  assert.deepEqual(
    buildAuthWiringState({
      apiBaseUrl: 'https://auth-runtime.example.com',
      loginEndpoint: '/v2/runtime/login',
      signupEndpoint: '/v2/runtime/signup',
      sessionEndpoint: '/v2/runtime/session',
      pendingEndpoint: '/v2/runtime/pending',
      continueEndpoint: '/v2/runtime/continue',
      logoutEndpoint: '/v2/runtime/logout',
      credentialsMode: 'omit',
      source: 'runtime',
      isConfigured: true,
    }),
    {
      source: 'runtime',
      credentialsMode: 'omit',
      apiBaseUrl: 'https://auth-runtime.example.com',
      appBasePath: '/',
      isConfigured: true,
      targets: {
        login: {
          endpoint: '/v2/runtime/login',
          resolvedUrl: 'https://auth-runtime.example.com/v2/runtime/login',
          mode: 'remote',
        },
        signup: {
          endpoint: '/v2/runtime/signup',
          resolvedUrl: 'https://auth-runtime.example.com/v2/runtime/signup',
          mode: 'remote',
        },
        session: {
          endpoint: '/v2/runtime/session',
          resolvedUrl: 'https://auth-runtime.example.com/v2/runtime/session',
          mode: 'remote',
        },
        pending: {
          endpoint: '/v2/runtime/pending',
          resolvedUrl: 'https://auth-runtime.example.com/v2/runtime/pending',
          mode: 'remote',
        },
        continue: {
          endpoint: '/v2/runtime/continue',
          resolvedUrl: 'https://auth-runtime.example.com/v2/runtime/continue',
          mode: 'remote',
        },
        logout: {
          endpoint: '/v2/runtime/logout',
          resolvedUrl: 'https://auth-runtime.example.com/v2/runtime/logout',
          mode: 'remote',
        },
      },
    },
  )
})
