export const defaultEditorColors = ['#eee2d1', '#d4c0a7', '#bda488', '#8b7355']
export const defaultPlacedItemColor = '#e6d7bf'
export const defaultPlacedItemBlurb = '선택한 오브젝트의 활용 팁이 여기에 표시됩니다.'

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

export function buildLayoutEditorToolbarButtons(activeTool) {
  return [
    { id: 'select', label: '✥', isActive: activeTool === 'select' },
    { id: 'move', label: '✋', isActive: activeTool === 'move' },
    { id: 'color', label: '◉', isActive: activeTool === 'color' },
    { id: 'rotate', label: '⟲', isActive: activeTool === 'rotate' },
    { id: 'undo', label: '↶', isActive: false },
  ]
}

export function buildLayoutEditorInfoPills({ snapOn, itemCount }) {
  return [
    '거실 5400 x 3400',
    snapOn ? '스냅 ON' : '자유 이동',
    `배치 가구 ${itemCount}개`,
  ]
}

export function buildLayoutEditorSelectionSnapshot(selectedItem, selectedMeta) {
  return {
    selectedName: selectedItem?.name ?? '선택 없음',
    position: {
      x: Math.round(selectedItem?.x ?? 0),
      y: Math.round(selectedItem?.y ?? 0),
    },
    selectedColorIndex: selectedItem?.colorIndex ?? 0,
    selectedBlurb: selectedMeta?.blurb ?? defaultPlacedItemBlurb,
  }
}
