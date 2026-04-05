import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildEditorPalette,
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
