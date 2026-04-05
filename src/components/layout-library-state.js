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
