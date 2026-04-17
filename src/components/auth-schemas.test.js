import test from 'node:test'
import assert from 'node:assert/strict'

import {
  normalizeAuthConfigResult,
  normalizeAuthPayload,
  normalizeCredentialMode,
  normalizeEndpointOverride,
} from './auth-schemas.js'

test('normalizeCredentialMode and normalizeEndpointOverride keep auth overrides safe and predictable', () => {
  assert.equal(normalizeCredentialMode('same-origin'), 'same-origin')
  assert.equal(normalizeCredentialMode('invalid-mode', 'include'), 'include')
  assert.equal(normalizeEndpointOverride('v1/auth/login'), '/v1/auth/login')
  assert.equal(normalizeEndpointOverride('   ', '/api/auth/login'), '/api/auth/login')
})

test('normalizeAuthPayload trims decorated auth metadata and keeps structured connection data', () => {
  assert.deepEqual(
    normalizeAuthPayload({
      handoffId: ' handoff-123 ',
      nextAction: ' verify-email ',
      status: ' action-required ',
      statusLabel: ' 이메일 인증 필요 ',
      connection: {
        method: ' POST ',
        endpoint: ' /api/auth/login ',
        resolvedUrl: ' https://havenly.example.com/api/auth/login ',
        targetLabel: ' auth.havenly.example.com ',
        credentialsMode: ' include ',
        source: ' runtime ',
      },
      guestDraftSummary: {
        apartmentLabel: ' 한남 더현대 84A ',
        selectedRoomCount: 2,
        selectedRooms: ['거실', '침실'],
        selectedSpaceIds: ['living-room'],
        recommendationRoom: ' 거실 ',
        wishlistCount: 3,
        cartCount: 1,
        layoutItemCount: 4,
      },
    }),
    {
      handoffId: 'handoff-123',
      nextAction: 'verify-email',
      status: 'action-required',
      statusLabel: '이메일 인증 필요',
      connection: {
        method: 'POST',
        endpoint: '/api/auth/login',
        resolvedUrl: 'https://havenly.example.com/api/auth/login',
        targetLabel: 'auth.havenly.example.com',
        isExternal: true,
        isSameOriginScaffold: false,
        credentialsMode: 'include',
        source: 'runtime',
      },
      guestDraftSummary: {
        apartmentLabel: '한남 더현대 84A',
        selectedRoomCount: 2,
        selectedRooms: ['거실', '침실'],
        selectedSpaceIds: ['living-room'],
        recommendationRoom: '거실',
        wishlistCount: 3,
        cartCount: 1,
        layoutItemCount: 4,
      },
    },
  )
})

test('normalizeAuthConfigResult validates resolved runtime auth config shape', () => {
  assert.deepEqual(
    normalizeAuthConfigResult({
      apiBaseUrl: 'https://auth.example.com',
      currentOrigin: 'https://havenly.example.com',
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
    }),
    {
      apiBaseUrl: 'https://auth.example.com',
      currentOrigin: 'https://havenly.example.com',
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
})
