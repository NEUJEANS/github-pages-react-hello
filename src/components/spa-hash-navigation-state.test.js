import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildNavigationHash,
  getDirectionalTransition,
  getScreenMeta,
  parseHashState,
} from './spa-hash-navigation-state.js'

test('parseHashState resolves default, overlay, and known screens', () => {
  assert.deepEqual(parseHashState(''), { screen: 'home', overlay: null })
  assert.deepEqual(parseHashState('#address'), { screen: 'layout', overlay: 'address' })
  assert.deepEqual(parseHashState('#beds'), { screen: 'beds', overlay: null })
  assert.deepEqual(parseHashState('#unknown'), { screen: 'home', overlay: null })
})

test('getScreenMeta falls back to home metadata for unknown screens', () => {
  assert.deepEqual(getScreenMeta('layout'), { column: 1, step: 0 })
  assert.deepEqual(getScreenMeta('unknown-screen'), { column: 2, step: 1 })
})

test('getDirectionalTransition reflects the current column-priority transition rules', () => {
  assert.equal(getDirectionalTransition('home', 'home'), 0)
  assert.equal(getDirectionalTransition('layout', 'space'), -1)
  assert.equal(getDirectionalTransition('layout', 'beds'), 1)
  assert.equal(getDirectionalTransition('ai', 'space'), -1)
  assert.equal(getDirectionalTransition('address', 'layout'), -1)
})

test('buildNavigationHash prefers address overlay over the underlying screen', () => {
  assert.equal(buildNavigationHash('layout', 'address'), 'address')
  assert.equal(buildNavigationHash('beds', null), 'beds')
})
