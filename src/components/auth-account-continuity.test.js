import test from 'node:test'
import assert from 'node:assert/strict'

import { buildAccountContinuityPatch, buildRestoredRecommendationDraft } from './auth-account-continuity.js'

test('buildAccountContinuityPatch clones persisted account continuity state', () => {
  assert.deepEqual(buildAccountContinuityPatch({
    wishlistIds: ['wish-account-1'],
    cartItems: [{ id: 'cart-account-1', qty: 2 }],
    layoutItems: [{ id: 'layout-account-1', x: 12, y: 16 }],
    recommendationDraft: {
      room: '침실',
      style: 'natural',
      priority: 'storage',
      lifestyle: ['재택근무'],
      extraRequest: '붙박이장 중심으로',
    },
  }), {
    wishlistIds: ['wish-account-1'],
    cartItems: [{ id: 'cart-account-1', qty: 2 }],
    layoutItems: [{ id: 'layout-account-1', x: 12, y: 16 }],
    recommendationDraft: {
      room: '침실',
      style: 'natural',
      priority: 'storage',
      lifestyle: ['재택근무'],
      extraRequest: '붙박이장 중심으로',
    },
  })
})

test('buildAccountContinuityPatch preserves explicit empty tray state', () => {
  assert.deepEqual(buildAccountContinuityPatch({
    wishlistIds: [],
    cartItems: [],
    layoutItems: [],
    layoutTrayItems: [],
    recommendationDraft: null,
  })?.layoutTrayItems, [])
})

test('buildAccountContinuityPatch omits tray state when none was persisted', () => {
  assert.equal(Object.hasOwn(buildAccountContinuityPatch({
    wishlistIds: [],
    cartItems: [],
    layoutItems: [],
    recommendationDraft: null,
  }), 'layoutTrayItems'), false)
})

test('buildRestoredRecommendationDraft falls back to the provided base draft when the account has no saved recommendation context', () => {
  assert.deepEqual(buildRestoredRecommendationDraft({
    recommendationDraft: null,
  }, {
    room: '거실',
    style: 'minimal',
    priority: 'flow',
    lifestyle: ['기본'],
    extraRequest: '',
  }), {
    room: '거실',
    style: 'minimal',
    priority: 'flow',
    lifestyle: ['기본'],
    extraRequest: '',
  })
})

test('buildRestoredRecommendationDraft prefers the saved account recommendation context when present', () => {
  assert.deepEqual(buildRestoredRecommendationDraft({
    recommendationDraft: {
      room: '침실',
      style: 'natural',
      priority: 'storage',
      lifestyle: ['재택근무'],
      extraRequest: '붙박이장 중심으로',
    },
  }, {
    room: '거실',
    style: 'minimal',
    priority: 'flow',
    lifestyle: ['기본'],
    extraRequest: '',
  }), {
    room: '침실',
    style: 'natural',
    priority: 'storage',
    lifestyle: ['재택근무'],
    extraRequest: '붙박이장 중심으로',
  })
})
