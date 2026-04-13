import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createLayoutEditorActionHandlers,
  createLayoutEditorToolbarHandlers,
} from './layout-editor-command-handlers.js'

test('createLayoutEditorToolbarHandlers maps toolbar commands onto editor actions', () => {
  const seen = []
  const editor = {
    undo: () => seen.push(['undo']),
    cycleColor: () => seen.push(['cycle-color']),
    rotateSelected: () => seen.push(['rotate-selected']),
    setActiveTool: (value) => seen.push(['set-active-tool', value]),
  }

  const handlers = createLayoutEditorToolbarHandlers(editor)
  handlers.undo()
  handlers['cycle-color']()
  handlers['rotate-selected']()
  handlers['set-active-tool']({ value: 'move' })

  assert.deepEqual(seen, [
    ['undo'],
    ['cycle-color'],
    ['rotate-selected'],
    ['set-active-tool', 'move'],
  ])
})

test('createLayoutEditorActionHandlers maps action commands and guards add-to-cart without a selection', () => {
  const seen = []
  const selectedMeta = { id: 'sofa-1', name: 'Sofa' }
  const handlers = createLayoutEditorActionHandlers({
    navigate: (value) => seen.push(['navigate', value]),
    openOverlay: (value) => seen.push(['open-overlay', value]),
    addToCart: (item) => seen.push(['add-selected-to-cart', item.id]),
    editor: { reset: () => seen.push(['reset-layout']) },
    selectedMeta,
  })

  handlers.navigate({ value: 'beds' })
  handlers['open-overlay']({ value: 'address' })
  handlers['add-selected-to-cart']()
  handlers['reset-layout']()

  assert.deepEqual(seen, [
    ['navigate', 'beds'],
    ['open-overlay', 'address'],
    ['add-selected-to-cart', 'sofa-1'],
    ['reset-layout'],
  ])
})

test('createLayoutEditorActionHandlers skips add-to-cart when nothing is selected', () => {
  const seen = []
  const handlers = createLayoutEditorActionHandlers({
    navigate: () => seen.push(['navigate']),
    openOverlay: () => seen.push(['open-overlay']),
    addToCart: () => seen.push(['add-selected-to-cart']),
    editor: { reset: () => seen.push(['reset-layout']) },
    selectedMeta: undefined,
  })

  handlers['add-selected-to-cart']()

  assert.deepEqual(seen, [])
})
