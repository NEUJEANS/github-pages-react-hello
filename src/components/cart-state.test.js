import test from 'node:test'
import assert from 'node:assert/strict'

import {
  addCartItem,
  buildCartTotals,
  updateCartItemQty,
} from './cart-state.js'

test('addCartItem appends a new product with qty 1', () => {
  assert.deepEqual(addCartItem([
    { id: 'sofa-001', price: 1000, qty: 1 },
  ], {
    id: 'lamp-001',
    price: 200,
    name: '램프',
  }), [
    { id: 'sofa-001', price: 1000, qty: 1 },
    { id: 'lamp-001', price: 200, name: '램프', qty: 1 },
  ])
})

test('addCartItem increments qty for an existing product without mutating input', () => {
  const currentItems = [{ id: 'sofa-001', price: 1000, qty: 1 }]
  const result = addCartItem(currentItems, { id: 'sofa-001', price: 1000 })

  assert.notEqual(result, currentItems)
  assert.deepEqual(result, [{ id: 'sofa-001', price: 1000, qty: 2 }])
  assert.deepEqual(currentItems, [{ id: 'sofa-001', price: 1000, qty: 1 }])
})

test('updateCartItemQty decrements matching items and removes empty ones', () => {
  assert.deepEqual(updateCartItemQty([
    { id: 'sofa-001', price: 1000, qty: 2 },
    { id: 'lamp-001', price: 200, qty: 1 },
  ], 'sofa-001', -1), [
    { id: 'sofa-001', price: 1000, qty: 1 },
    { id: 'lamp-001', price: 200, qty: 1 },
  ])

  assert.deepEqual(updateCartItemQty([
    { id: 'sofa-001', price: 1000, qty: 1 },
    { id: 'lamp-001', price: 200, qty: 1 },
  ], 'lamp-001', -1), [
    { id: 'sofa-001', price: 1000, qty: 1 },
  ])
})

test('buildCartTotals summarizes count and subtotal from qty values', () => {
  assert.deepEqual(buildCartTotals([
    { id: 'sofa-001', price: 1000, qty: 2 },
    { id: 'lamp-001', price: 200, qty: 3 },
  ]), {
    count: 5,
    subtotal: 2600,
  })
})
