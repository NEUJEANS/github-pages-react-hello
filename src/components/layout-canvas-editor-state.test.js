import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildPlacedLibraryItem,
  clampEditorPoint,
  editorBounds,
  resolveAnimatedTarget,
  resolveDragPosition,
  resolveMovedItemPosition,
  resolveRoomClickTarget,
  stepToward,
} from './layout-canvas-editor-state.js'

test('resolveMovedItemPosition applies snap-aware step sizes within editor bounds', () => {
  assert.deepEqual(resolveMovedItemPosition({ x: 10, y: 10 }, 1, -1, true), { x: 14, y: 6 })
  assert.deepEqual(resolveMovedItemPosition({ x: 10, y: 10 }, 1, -1, false), { x: 12, y: 8 })
  assert.deepEqual(resolveMovedItemPosition({ x: 87, y: 81 }, 1, 1, true), { x: editorBounds.maxX, y: editorBounds.maxY })
})

test('resolveAnimatedTarget snaps only when snap mode is enabled', () => {
  assert.deepEqual(resolveAnimatedTarget(13, 15, true), { x: 12, y: 16 })
  assert.deepEqual(resolveAnimatedTarget(13, 15, false), { x: 13, y: 15 })
  assert.deepEqual(resolveAnimatedTarget(-10, 100, true), { x: editorBounds.minX, y: editorBounds.maxY })
})

test('stepToward converges toward the target without overshooting', () => {
  assert.equal(stepToward(10, 13), 11)
  assert.equal(stepToward(10, 10.5), 10.5)
  assert.equal(stepToward(10, 7), 9)
})

test('resolveDragPosition returns clamped points and moved state', () => {
  const dragState = {
    startClientX: 10,
    startClientY: 20,
    originX: 40,
    originY: 44,
    roomWidth: 100,
    roomHeight: 200,
  }

  assert.deepEqual(resolveDragPosition(dragState, { clientX: 14, clientY: 24 }, true), {
    point: { x: 44, y: 48 },
    moved: true,
  })

  assert.deepEqual(resolveDragPosition(dragState, { clientX: 10.1, clientY: 20.1 }, false), {
    point: clampEditorPoint(40.1, 44.05),
    moved: false,
  })
})

test('buildPlacedLibraryItem derives labels and dimensions from category', () => {
  assert.deepEqual(buildPlacedLibraryItem({ id: 'plant-1', name: '식물', emoji: '🪴', category: '소품' }, 'plant-1-1'), {
    id: 'plant-1-1',
    sourceId: 'plant-1',
    name: '식물',
    label: '🪴',
    x: 34,
    y: 32,
    w: 8,
    h: 12,
    rotation: 0,
    colorIndex: 0,
    circle: false,
  })

  assert.deepEqual(buildPlacedLibraryItem({ id: 'table-1', name: '테이블', emoji: '🪑', category: '테이블' }, 'table-1-1'), {
    id: 'table-1-1',
    sourceId: 'table-1',
    name: '테이블',
    label: '테이블',
    x: 34,
    y: 32,
    w: 18,
    h: 14,
    rotation: 0,
    colorIndex: 0,
    circle: true,
  })
})

test('resolveRoomClickTarget centers the selected item and clamps to bounds', () => {
  assert.deepEqual(resolveRoomClickTarget(50, 50, { w: 20, h: 10 }), { x: 40, y: 45 })
  assert.deepEqual(resolveRoomClickTarget(0, 100, { w: 40, h: 40 }), { x: editorBounds.minX, y: 80 })
})
