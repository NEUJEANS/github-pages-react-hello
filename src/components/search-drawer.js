function buildSearchHaystack(item) {
  return [item.name, item.category, item.material, item.color, item.fit, item.size]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function buildSearchMeta(item) {
  return [item.category, item.material, item.color]
    .filter(Boolean)
    .join(' · ')
}

export function buildSearchDrawerState({ query = '', libraryItems = [], bedProducts = [] }) {
  const normalizedQuery = query.trim().toLowerCase()
  const uniqueItems = [...libraryItems, ...bedProducts].filter((item, index, all) => {
    return all.findIndex((candidate) => candidate.id === item.id) === index
  })

  const matchedItems = normalizedQuery
    ? uniqueItems.filter((item) => buildSearchHaystack(item).includes(normalizedQuery))
    : uniqueItems.slice(0, 6)

  return {
    normalizedQuery,
    queryLabel: query.trim(),
    results: matchedItems.slice(0, normalizedQuery ? 8 : 6).map((item) => ({
      ...item,
      searchMeta: buildSearchMeta(item),
    })),
    isEmpty: matchedItems.length === 0,
  }
}
