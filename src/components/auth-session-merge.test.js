import test from 'node:test'
import assert from 'node:assert/strict'

import { buildPostAuthContinuityPatch } from './auth-session-merge.js'

test('buildPostAuthContinuityPatch returns null for merged guest draft sessions', () => {
  assert.equal(buildPostAuthContinuityPatch({
    data: {
      mergedGuestDraft: {
        mode: 'merged',
      },
    },
  }), null)
})

test('buildPostAuthContinuityPatch extracts replacement account state for client hydration', () => {
  assert.deepEqual(buildPostAuthContinuityPatch({
    data: {
      mergedGuestDraft: {
        mode: 'replaced',
      },
      accountState: {
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
      },
    },
  }), {
    mergeMode: 'replaced',
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
