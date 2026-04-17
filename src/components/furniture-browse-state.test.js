import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildFurnitureBrowseCategories,
  buildFurnitureBrowseItems,
} from './furniture-browse-state.js'

const libraryItems = [
  { id: 'sofa-001', category: '소파', name: '코튼베이지 모듈 소파', blurb: '웜 톤 거실 추천', size: '2200 x 900' },
  { id: 'table-001', category: '테이블', name: '오벌 우드 테이블', blurb: '다이닝 겸용', size: '1200 x 800' },
  { id: 'lamp-001', category: '조명', name: '포인트 플로어 램프', blurb: '코너 무드 조명', size: '420 x 420' },
  { id: 'mirror-001', category: '소품', name: '아치형 스탠드 미러', blurb: '채광 반사', size: '700 x 60' },
  { id: 'sofa-002', category: '소파', name: '클라우드 패브릭 소파', blurb: '부드러운 좌방석', size: '2400 x 980' },
]

test('buildFurnitureBrowseCategories keeps a stable unique category order', () => {
  assert.deepEqual(buildFurnitureBrowseCategories(libraryItems), ['전체', '소파', '테이블', '조명', '소품'])
})

test('buildFurnitureBrowseItems filters by active category', () => {
  const items = buildFurnitureBrowseItems(libraryItems, { activeCategory: '소파' })
  assert.deepEqual(items.map((item) => item.id), ['sofa-001', 'sofa-002'])
})

test('buildFurnitureBrowseItems matches query across name, category, blurb, and size', () => {
  assert.deepEqual(
    buildFurnitureBrowseItems(libraryItems, { query: '무드' }).map((item) => item.id),
    ['lamp-001'],
  )
  assert.deepEqual(
    buildFurnitureBrowseItems(libraryItems, { query: '테이블' }).map((item) => item.id),
    ['table-001'],
  )
  assert.deepEqual(
    buildFurnitureBrowseItems(libraryItems, { query: '2400' }).map((item) => item.id),
    ['sofa-002'],
  )
})
