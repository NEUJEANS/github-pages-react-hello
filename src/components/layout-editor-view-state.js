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

export function buildPlacedItemClassName({ isSelected = false, isCircle = false, isDragging = false } = {}) {
  return ['placed', isSelected && 'sel', isCircle && 'circle', isDragging && 'dragging']
    .filter(Boolean)
    .join(' ')
}

export function buildPlacedItemStyle(item, itemMeta) {
  return {
    left: `${item.x}%`,
    top: `${item.y}%`,
    width: `${item.w}%`,
    height: `${item.h}%`,
    transform: `rotate(${item.rotation}deg)`,
    background: resolvePlacedItemColor(item, itemMeta),
  }
}
