export function toggleWishlistId(currentIds, id) {
  return currentIds.includes(id)
    ? currentIds.filter((item) => item !== id)
    : [...currentIds, id]
}
