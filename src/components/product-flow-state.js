export function resolveSearchPickMode(product) {
  return product?.material ? 'quickView' : 'cart'
}

export function resolveQuickViewProduct(bedProducts, product) {
  if (!product) return null
  return bedProducts.find((item) => item.id === product.id) ?? product
}

export function buildLayoutProduct(product) {
  if (!product) return product
  return {
    ...product,
    category: product.material ? '침대' : product.category,
  }
}
