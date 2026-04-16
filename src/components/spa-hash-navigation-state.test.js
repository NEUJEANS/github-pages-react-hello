import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildNavigationHash,
  getDirectionalTransition,
  getScreenMeta,
  parseHashState,
} from './spa-hash-navigation-state.js'

test('parseHashState resolves default and known screens with address folded into layout', () => {
  assert.deepEqual(parseHashState(''), { screen: 'home', overlay: null })
  assert.deepEqual(parseHashState('#address'), { screen: 'layout', overlay: null })
  assert.deepEqual(parseHashState('#beds'), { screen: 'beds', overlay: null })
  assert.deepEqual(parseHashState('#unknown'), { screen: 'home', overlay: null })
})

test('getScreenMeta falls back to home metadata for unknown screens', () => {
  assert.deepEqual(getScreenMeta('layout'), { column: 1, step: 0 })
  assert.deepEqual(getScreenMeta('unknown-screen'), { column: 2, step: 1 })
})

test('getDirectionalTransition reflects the current simplified screen map rules', () => {
  assert.equal(getDirectionalTransition('home', 'home'), 0)
  assert.equal(getDirectionalTransition('layout', 'space'), 1)
  assert.equal(getDirectionalTransition('layout', 'beds'), 1)
  assert.equal(getDirectionalTransition('ai', 'space'), 1)
  assert.equal(getDirectionalTransition('address', 'layout'), -1)
})

test('buildNavigationHash keeps address folded into the layout hash', () => {
  assert.equal(buildNavigationHash('layout', 'address'), 'layout')
  assert.equal(buildNavigationHash('beds', null), 'beds')
})
