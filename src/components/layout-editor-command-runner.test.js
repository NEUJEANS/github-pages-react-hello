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

test('runLayoutEditorCommands skips unknown command types while reporting them through the unhandled callback', () => {
  const seen = []
  const unhandled = []

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
    {
      onUnhandledCommand: (command) => unhandled.push(command.type),
    },
  )

  assert.deepEqual(seen, [
    ['navigate', 'beds'],
    ['reset-layout'],
  ])
  assert.deepEqual(unhandled, ['unknown-command'])
})

test('runLayoutEditorCommands warns about unhandled commands outside production by default', () => {
  const originalWarn = console.warn
  const warnings = []
  console.warn = (message) => warnings.push(message)

  try {
    runLayoutEditorCommands(
      [{ type: 'missing-handler' }],
      {},
    )
  } finally {
    console.warn = originalWarn
  }

  assert.deepEqual(warnings, ['[layout-editor] Unhandled command: missing-handler'])
})
