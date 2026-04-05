export const defaultEditorColors = ['#eee2d1', '#d4c0a7', '#bda488', '#8b7355']
export const defaultPlacedItemColor = '#e6d7bf'

export function findLibraryItemMeta(items, sourceId) {
  return items.find((item) => item.id === sourceId)
}

export function buildEditorPalette(itemMeta) {
  return (itemMeta?.colors ?? defaultEditorColors).slice(0, 4)
}

export function resolvePlacedItemColor(item, itemMeta) {
  return itemMeta?.colors?.[item.colorIndex ?? 0] ?? defaultPlacedItemColor
}
