import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSearchDrawerState } from './global-search-overlay-state.js'

const libraryItems = [
  { id: 'sofa-001', name: '코튼베이지 모듈 소파', category: '소파', material: '패브릭', price: 1000 },
  { id: 'lamp-001', name: '포인트 플로어 램프', category: '조명', material: '메탈', price: 200 },
]

const bedProducts = [
  { id: 'bed-001', name: '헤이븐 패브릭 침대', category: '침대', material: '패브릭', color: '아이보리', fit: 'AI 추천 94%', price: 3000 },
  { id: 'sofa-001', name: '코튼베이지 모듈 소파', category: '소파', material: '패브릭', price: 1000 },
]

test('buildSearchDrawerState returns a deduped default preview when the query is empty', () => {
  const state = buildSearchDrawerState({ query: '   ', libraryItems, bedProducts })

  assert.equal(state.queryLabel, '')
  assert.equal(state.isEmpty, false)
  assert.deepEqual(state.results.map((item) => item.id), ['sofa-001', 'lamp-001', 'bed-001'])
  assert.equal(state.results[0].searchMeta, '소파 · 패브릭')
  assert.equal(state.results[2].searchMeta, '침대 · 패브릭 · 아이보리')
})

test('buildSearchDrawerState filters across category, material, and color fields', () => {
  const byMaterial = buildSearchDrawerState({ query: '패브릭', libraryItems, bedProducts })
  assert.deepEqual(byMaterial.results.map((item) => item.id), ['sofa-001', 'bed-001'])

  const byColor = buildSearchDrawerState({ query: '아이보리', libraryItems, bedProducts })
  assert.deepEqual(byColor.results.map((item) => item.id), ['bed-001'])
})

test('buildSearchDrawerState exposes an empty state for unmatched queries', () => {
  const state = buildSearchDrawerState({ query: '대리석', libraryItems, bedProducts })

  assert.equal(state.isEmpty, true)
  assert.equal(state.results.length, 0)
  assert.equal(state.queryLabel, '대리석')
})
