export function buildFilteredBedProducts(bedProducts, bedFilters) {
  let items = [...bedProducts]
  const query = bedFilters.search.trim().toLowerCase()

  if (query) {
    items = items.filter((item) => `${item.name} ${item.color} ${item.material}`.toLowerCase().includes(query))
  }

  if (bedFilters.size !== '전체') items = items.filter((item) => item.size === bedFilters.size)
  if (bedFilters.color !== '전체') items = items.filter((item) => item.color === bedFilters.color)
  if (bedFilters.material !== '전체') items = items.filter((item) => item.material === bedFilters.material)

  if (bedFilters.fit !== '전체') {
    items = items.filter((item) => item.fitScore >= Number(bedFilters.fit))
  }

  if (bedFilters.sorts === 'priceLow') items.sort((a, b) => a.price - b.price)
  if (bedFilters.sorts === 'fit') items.sort((a, b) => b.fitScore - a.fitScore)

  return items
}
