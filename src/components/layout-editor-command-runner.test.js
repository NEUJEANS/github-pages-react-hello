import test from 'node:test'
import assert from 'node:assert/strict'

import { runLayoutEditorCommands } from './layout-editor-command-runner.js'

test('runLayoutEditorCommands dispatches commands to matching handlers in order', () => {
  const seen = []

  runLayoutEditorCommands(
    [
      { type: 'set-active-tool', value: 'move' },
      { type: 'rotate-selected' },
      { type: 'cycle-color' },
    ],
    {
      'set-active-tool': (command) => seen.push(['set-active-tool', command.value]),
      'rotate-selected': () => seen.push(['rotate-selected']),
      'cycle-color': () => seen.push(['cycle-color']),
    },
  )

  assert.deepEqual(seen, [
    ['set-active-tool', 'move'],
    ['rotate-selected'],
    ['cycle-color'],
  ])
})

test('runLayoutEditorCommands skips unknown command types', () => {
  const seen = []

  runLayoutEditorCommands(
    [
      { type: 'navigate', value: 'beds' },
      { type: 'unknown-command' },
      { type: 'reset-layout' },
    ],
    {
      navigate: (command) => seen.push(['navigate', command.value]),
      'reset-layout': () => seen.push(['reset-layout']),
    },
  )

  assert.deepEqual(seen, [
    ['navigate', 'beds'],
    ['reset-layout'],
  ])
})
