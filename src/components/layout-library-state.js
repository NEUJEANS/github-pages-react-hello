export const layoutLibraryCategoryTabs = ['전체', '소파', '테이블', '수납', '소품', '조명']

export function buildVisibleLibrary(items, activeCategory, searchQuery) {
  const normalizedQuery = (searchQuery ?? '').trim().toLowerCase()

  return items.filter((item) => {
    const matchesCategory = activeCategory === '전체' || item.category === activeCategory
    const matchesSearch = !normalizedQuery
      || `${item.name} ${item.category}`.toLowerCase().includes(normalizedQuery)

    return matchesCategory && matchesSearch
  })
}

export function buildLibraryEmptyState(activeCategory, searchQuery) {
  const normalizedQuery = (searchQuery ?? '').trim()
  const categoryLabel = activeCategory === '전체' ? '전체 가구' : `${activeCategory} 가구`
  const categoryGuide = activeCategory === '전체'
    ? '지금 조건에서는 표시할 가구가 아직 없어요. 검색어를 지우거나 다른 카테고리를 선택해보세요.'
    : `${activeCategory} 카테고리에 표시할 가구가 아직 없어요. 다른 카테고리를 선택해보세요.`

  if (normalizedQuery) {
    return {
      emoji: '🪄',
      title: '검색 결과가 없어요',
      description: `“${normalizedQuery}”와 일치하는 ${categoryLabel}가 아직 없어요. 다른 키워드나 카테고리로 다시 찾아보세요.`,
    }
  }

  return {
    emoji: '🪑',
    title: '표시할 가구가 없어요',
    description: categoryGuide,
  }
}
