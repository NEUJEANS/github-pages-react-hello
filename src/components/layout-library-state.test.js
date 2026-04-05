import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildVisibleLibrary,
  layoutLibraryCategoryTabs,
} from './layout-library-state.js'

const libraryItems = [
  { id: 'sofa-1', name: '코튼 소파', category: '소파' },
  { id: 'table-1', name: '오벌 테이블', category: '테이블' },
  { id: 'lamp-1', name: '포인트 램프', category: '조명' },
]

test('layoutLibraryCategoryTabs exposes the expected editor tabs', () => {
  assert.deepEqual(layoutLibraryCategoryTabs, ['전체', '소파', '테이블', '수납', '소품', '조명'])
})

test('buildVisibleLibrary returns all items when filters are empty', () => {
  assert.deepEqual(buildVisibleLibrary(libraryItems, '전체', ''), libraryItems)
})

test('buildVisibleLibrary filters by active category', () => {
  assert.deepEqual(buildVisibleLibrary(libraryItems, '테이블', ''), [libraryItems[1]])
})

test('buildVisibleLibrary filters by normalized search query across name and category', () => {
  assert.deepEqual(buildVisibleLibrary(libraryItems, '전체', '  램프 '), [libraryItems[2]])
  assert.deepEqual(buildVisibleLibrary(libraryItems, '전체', '소파'), [libraryItems[0]])
})

test('buildVisibleLibrary combines category and search constraints', () => {
  assert.deepEqual(buildVisibleLibrary(libraryItems, '조명', '포인트'), [libraryItems[2]])
  assert.deepEqual(buildVisibleLibrary(libraryItems, '조명', '소파'), [])
})
