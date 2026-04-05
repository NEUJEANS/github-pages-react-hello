import test from 'node:test'
import assert from 'node:assert/strict'
import { buildFilteredBedProducts } from './bed-filter-state.js'

const bedProducts = [
  { id: 'a', name: '헤이븐 패브릭 침대', color: '아이보리', material: '패브릭', size: '퀸', fitScore: 94, price: 890000 },
  { id: 'b', name: '월넛 프레임 침대', color: '우드', material: '원목', size: '킹', fitScore: 88, price: 760000 },
  { id: 'c', name: '웜그레이 플랫폼 침대', color: '그레이', material: '합성패브릭', size: '퀸', fitScore: 85, price: 690000 },
]

const baseFilters = {
  search: '',
  sorts: 'recommended',
  size: '전체',
  color: '전체',
  material: '전체',
  fit: '전체',
}

test('buildFilteredBedProducts filters across search and facet fields', () => {
  assert.deepEqual(
    buildFilteredBedProducts(bedProducts, {
      ...baseFilters,
      search: '패브릭',
      size: '퀸',
      color: '아이보리',
      material: '패브릭',
    }).map((item) => item.id),
    ['a'],
  )
})

test('buildFilteredBedProducts applies fit threshold and price sorting', () => {
  assert.deepEqual(
    buildFilteredBedProducts(bedProducts, {
      ...baseFilters,
      fit: '86',
      sorts: 'priceLow',
    }).map((item) => item.id),
    ['b', 'a'],
  )
})

test('buildFilteredBedProducts sorts by fit score when requested', () => {
  assert.deepEqual(
    buildFilteredBedProducts(bedProducts, {
      ...baseFilters,
      sorts: 'fit',
    }).map((item) => item.id),
    ['a', 'b', 'c'],
  )
})

test('buildFilteredBedProducts returns a cloned list for default recommended ordering', () => {
  const result = buildFilteredBedProducts(bedProducts, baseFilters)

  assert.notEqual(result, bedProducts)
  assert.deepEqual(result.map((item) => item.id), ['a', 'b', 'c'])
})
