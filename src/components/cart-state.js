export function addCartItem(currentItems, product) {
  const existing = currentItems.find((item) => item.id === product.id)

  if (existing) {
    return currentItems.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
  }

  return [...currentItems, { ...product, qty: 1 }]
}

export function updateCartItemQty(currentItems, id, delta) {
  return currentItems.flatMap((item) => {
    if (item.id !== id) return [item]

    const nextQty = item.qty + delta
    return nextQty <= 0 ? [] : [{ ...item, qty: nextQty }]
  })
}

export function buildCartTotals(items) {
  return {
    count: items.reduce((sum, item) => sum + item.qty, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.qty, 0),
  }
}
