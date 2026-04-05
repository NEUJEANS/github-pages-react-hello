import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildLibraryEmptyState,
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

test('buildLibraryEmptyState explains zero-result search states', () => {
  assert.deepEqual(buildLibraryEmptyState('조명', '  벽등 '), {
    emoji: '🪄',
    title: '검색 결과가 없어요',
    description: '“벽등”와 일치하는 조명 가구가 아직 없어요. 다른 키워드나 카테고리로 다시 찾아보세요.',
  })
})

test('buildLibraryEmptyState falls back to category guidance when no search query is active', () => {
  assert.deepEqual(buildLibraryEmptyState('전체', ''), {
    emoji: '🪑',
    title: '표시할 가구가 없어요',
    description: '지금 조건에서는 표시할 가구가 아직 없어요. 검색어를 지우거나 다른 카테고리를 선택해보세요.',
  })

  assert.deepEqual(buildLibraryEmptyState('테이블', undefined), {
    emoji: '🪑',
    title: '표시할 가구가 없어요',
    description: '테이블 카테고리에 표시할 가구가 아직 없어요. 다른 카테고리를 선택해보세요.',
  })
})
