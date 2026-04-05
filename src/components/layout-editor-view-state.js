export const defaultEditorColors = ['#eee2d1', '#d4c0a7', '#bda488', '#8b7355']
export const defaultPlacedItemColor = '#e6d7bf'
export const defaultPlacedItemBlurb = '선택한 오브젝트의 활용 팁이 여기에 표시됩니다.'
export const defaultLayoutEditorHintBadge = 'PRESS + DRAG / CLICK MOVE'
export const defaultLayoutEditorMovementNote =
  '직접 드래그는 그대로 유지하고, ✋ 이동 툴에서는 빈 공간 클릭 시 선택 가구가 부드럽게 이동합니다. Undo와 스냅 토글도 그대로 유지했어요.'

export function findLibraryItemMeta(items, sourceId) {
  return items.find((item) => item.id === sourceId)
}

export function buildEditorPalette(itemMeta) {
  return (itemMeta?.colors ?? defaultEditorColors).slice(0, 4)
}

export function buildLayoutEditorColorOptions(itemMeta, selectedColorIndex = 0) {
  return buildEditorPalette(itemMeta).map((color, index) => ({
    color,
    index,
    isActive: index === selectedColorIndex,
  }))
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

export function buildLayoutEditorToolbarButtons(activeTool, { canUndo = false } = {}) {
  return [
    { id: 'select', label: '✥', isActive: activeTool === 'select', disabled: false },
    { id: 'move', label: '✋', isActive: activeTool === 'move', disabled: false },
    { id: 'color', label: '◉', isActive: activeTool === 'color', disabled: false },
    { id: 'rotate', label: '⟲', isActive: activeTool === 'rotate', disabled: false },
    { id: 'undo', label: '↶', isActive: false, disabled: !canUndo },
  ]
}

export function buildLayoutEditorToolbarCommands(toolId) {
  if (toolId === 'undo') return [{ type: 'undo' }]
  if (toolId === 'color') return [{ type: 'set-active-tool', value: 'color' }, { type: 'cycle-color' }]
  if (toolId === 'rotate') return [{ type: 'set-active-tool', value: 'rotate' }, { type: 'rotate-selected' }]
  return [{ type: 'set-active-tool', value: toolId }]
}

export function buildLayoutEditorInfoPills({ snapOn, itemCount }) {
  return [
    '거실 5400 x 3400',
    snapOn ? '스냅 ON' : '자유 이동',
    `배치 가구 ${itemCount}개`,
  ]
}

export function buildLayoutEditorHint({ snapOn }) {
  return {
    badge: defaultLayoutEditorHintBadge,
    description: snapOn
      ? '가구를 누른 채 바로 끌어도 되고, ✋ 이동 툴에서 빈 공간을 클릭하면 선택한 가구가 부드럽게 이동해요. 스냅을 끄면 더 자유롭게 배치할 수 있어요.'
      : '가구를 누른 채 바로 끌거나 ✋ 이동 툴에서 빈 공간을 클릭해 움직일 수 있어요. 지금은 스냅이 꺼져 있어서 더 자유롭게 배치됩니다.',
  }
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

export function buildLayoutEditorActionButtons(hasSelectedMeta) {
  return [
    {
      id: 'browse-more',
      label: '가구 더 보기',
      tone: 'cta',
      action: 'navigate-beds',
      disabled: false,
    },
    {
      id: 'reselect-space',
      label: '공간 다시 선택',
      tone: 'ghost',
      action: 'open-address-overlay',
      disabled: false,
    },
    {
      id: 'add-selected-to-cart',
      label: '선택 가구 담기',
      tone: 'ghost',
      action: 'add-selected-to-cart',
      disabled: !hasSelectedMeta,
    },
    {
      id: 'reset-layout',
      label: '초기 배치 복원',
      tone: 'ghost',
      action: 'reset-layout',
      disabled: false,
    },
  ]
}

export function buildLayoutEditorActionCommands(action) {
  if (action === 'navigate-beds') return [{ type: 'navigate', value: 'beds' }]
  if (action === 'open-address-overlay') return [{ type: 'open-overlay', value: 'address' }]
  if (action === 'add-selected-to-cart') return [{ type: 'add-selected-to-cart' }]
  if (action === 'reset-layout') return [{ type: 'reset-layout' }]
  return []
}

export function buildLayoutEditorMovementNote() {
  return defaultLayoutEditorMovementNote
}
