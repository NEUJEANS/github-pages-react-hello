export const editorBounds = {
  minX: 2,
  maxX: 88,
  minY: 2,
  maxY: 82,
  snapStep: 4,
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function clampEditorPoint(x, y) {
  return {
    x: clamp(x, editorBounds.minX, editorBounds.maxX),
    y: clamp(y, editorBounds.minY, editorBounds.maxY),
  }
}

export function resolveMovedItemPosition(item, dx, dy, snapOn) {
  const step = snapOn ? editorBounds.snapStep : 2
  return clampEditorPoint(item.x + dx * step, item.y + dy * step)
}

export function resolveAnimatedTarget(targetX, targetY, snapOn) {
  if (!snapOn) return clampEditorPoint(targetX, targetY)

  return clampEditorPoint(
    Math.round(targetX / editorBounds.snapStep) * editorBounds.snapStep,
    Math.round(targetY / editorBounds.snapStep) * editorBounds.snapStep,
  )
}

export function stepToward(value, target, step = 1) {
  if (Math.abs(target - value) <= step) return target
  return value + Math.sign(target - value) * step
}

export function resolveDragPosition(dragState, pointer, snapOn) {
  const deltaX = ((pointer.clientX - dragState.startClientX) / dragState.roomWidth) * 100
  const deltaY = ((pointer.clientY - dragState.startClientY) / dragState.roomHeight) * 100
  const rawPoint = clampEditorPoint(dragState.originX + deltaX, dragState.originY + deltaY)
  const point = snapOn
    ? resolveAnimatedTarget(rawPoint.x, rawPoint.y, true)
    : rawPoint

  return {
    point,
    moved: Math.abs(deltaX) > 0.2 || Math.abs(deltaY) > 0.2,
  }
}

export function buildPlacedLibraryItem(product, id) {
  return {
    id,
    sourceId: product.id,
    name: product.name,
    label: product.category === '소품' ? product.emoji : product.category.toUpperCase(),
    x: 34,
    y: 32,
    w: product.category === '소품' ? 8 : 18,
    h: product.category === '테이블' ? 14 : 12,
    rotation: 0,
    colorIndex: 0,
    circle: product.category === '테이블',
  }
}

export function resolveRoomClickTarget(percentX, percentY, selected) {
  return clampEditorPoint(
    percentX - ((selected?.w ?? 0) / 2),
    percentY - ((selected?.h ?? 0) / 2),
  )
}
