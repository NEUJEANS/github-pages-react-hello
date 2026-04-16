import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildLayoutProduct,
  resolveQuickViewProduct,
  resolveSearchPickMode,
} from './catalog-product-selection-state.js'

const bedProducts = [
  { id: 'bed-001', name: '헤이븐 패브릭 침대', material: '패브릭', category: '침대' },
  { id: 'bed-002', name: '클라우드 쿠션 침대', material: '패브릭', category: '침대' },
]

test('resolveSearchPickMode opens quick view for bed-like products', () => {
  assert.equal(resolveSearchPickMode({ id: 'bed-001', material: '패브릭' }), 'quickView')
  assert.equal(resolveSearchPickMode({ id: 'sofa-001', category: '소파' }), 'cart')
})

test('resolveQuickViewProduct prefers the canonical bed product when available', () => {
  const picked = { id: 'bed-002', name: 'temporary result', material: '패브릭' }
  assert.equal(resolveQuickViewProduct(bedProducts, picked), bedProducts[1])
  assert.equal(resolveQuickViewProduct(bedProducts, { id: 'lamp-001', category: '조명' }).id, 'lamp-001')
  assert.equal(resolveQuickViewProduct(bedProducts, null), null)
})

test('buildLayoutProduct normalizes bed products for the editor without mutating input', () => {
  const bed = { id: 'bed-001', material: '패브릭', category: '침대' }
  const decor = { id: 'lamp-001', category: '조명' }

  const normalizedBed = buildLayoutProduct(bed)
  const normalizedDecor = buildLayoutProduct(decor)

  assert.deepEqual(normalizedBed, { ...bed, category: '침대' })
  assert.deepEqual(normalizedDecor, decor)
  assert.notEqual(normalizedBed, bed)
})
