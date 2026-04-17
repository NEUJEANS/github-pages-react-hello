export function buildFurnitureBrowseCategories(items = []) {
  const seen = new Set()
  const categories = []

  items.forEach((item) => {
    const category = typeof item?.category === 'string' ? item.category.trim() : ''
    if (!category || seen.has(category)) return
    seen.add(category)
    categories.push(category)
  })

  return ['전체', ...categories]
}

export function buildFurnitureBrowseItems(items = [], { activeCategory = '전체', query = '' } = {}) {
  const normalizedQuery = typeof query === 'string' ? query.trim().toLowerCase() : ''
  const normalizedCategory = typeof activeCategory === 'string' ? activeCategory.trim() : '전체'

  return items.filter((item) => {
    if (normalizedCategory && normalizedCategory !== '전체' && item.category !== normalizedCategory) {
      return false
    }

    if (!normalizedQuery) return true

    const haystack = [
      item.name,
      item.category,
      item.blurb,
      item.size,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })
}
