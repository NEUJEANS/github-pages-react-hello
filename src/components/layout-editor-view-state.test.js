import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildEditorPalette,
  buildPlacedItemClassName,
  buildPlacedItemStyle,
  defaultEditorColors,
  defaultPlacedItemColor,
  findLibraryItemMeta,
  resolvePlacedItemColor,
} from './layout-editor-view-state.js'

test('findLibraryItemMeta returns the matching library entry', () => {
  const items = [
    { id: 'sofa-001', name: 'Sofa' },
    { id: 'lamp-001', name: 'Lamp' },
  ]

  assert.deepEqual(findLibraryItemMeta(items, 'lamp-001'), { id: 'lamp-001', name: 'Lamp' })
  assert.equal(findLibraryItemMeta(items, 'missing'), undefined)
})

test('buildEditorPalette keeps at most four configured colors', () => {
  const palette = buildEditorPalette({
    colors: ['#111111', '#222222', '#333333', '#444444', '#555555'],
  })

  assert.deepEqual(palette, ['#111111', '#222222', '#333333', '#444444'])
})

test('buildEditorPalette falls back to the default editor colors', () => {
  assert.deepEqual(buildEditorPalette(undefined), defaultEditorColors)
})

test('resolvePlacedItemColor reads the selected swatch and falls back safely', () => {
  assert.equal(
    resolvePlacedItemColor({ colorIndex: 1 }, { colors: ['#aaaaaa', '#bbbbbb'] }),
    '#bbbbbb',
  )

  assert.equal(
    resolvePlacedItemColor({ colorIndex: 3 }, { colors: ['#aaaaaa'] }),
    defaultPlacedItemColor,
  )

  assert.equal(resolvePlacedItemColor({}, undefined), defaultPlacedItemColor)
})

test('buildPlacedItemClassName composes selected, circle, and dragging flags', () => {
  assert.equal(buildPlacedItemClassName(), 'placed')
  assert.equal(
    buildPlacedItemClassName({ isSelected: true, isCircle: true, isDragging: true }),
    'placed sel circle dragging',
  )
})

test('buildPlacedItemStyle returns percent-based geometry and background color', () => {
  assert.deepEqual(
    buildPlacedItemStyle(
      { x: 12, y: 24, w: 18, h: 9, rotation: 90, colorIndex: 1 },
      { colors: ['#111111', '#222222'] },
    ),
    {
      left: '12%',
      top: '24%',
      width: '18%',
      height: '9%',
      transform: 'rotate(90deg)',
      background: '#222222',
    },
  )
})
