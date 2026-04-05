import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildEditorPalette,
  buildLayoutEditorInfoPills,
  buildLayoutEditorSelectionSnapshot,
  buildLayoutEditorToolbarButtons,
  buildPlacedItemClassName,
  buildPlacedItemStyle,
  defaultEditorColors,
  defaultPlacedItemBlurb,
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

test('buildLayoutEditorToolbarButtons exposes a stable tool order with active-state flags', () => {
  assert.deepEqual(buildLayoutEditorToolbarButtons('move'), [
    { id: 'select', label: '✥', isActive: false },
    { id: 'move', label: '✋', isActive: true },
    { id: 'color', label: '◉', isActive: false },
    { id: 'rotate', label: '⟲', isActive: false },
    { id: 'undo', label: '↶', isActive: false },
  ])
})

test('buildLayoutEditorInfoPills summarizes snap mode and placed item count', () => {
  assert.deepEqual(buildLayoutEditorInfoPills({ snapOn: true, itemCount: 3 }), [
    '거실 5400 x 3400',
    '스냅 ON',
    '배치 가구 3개',
  ])

  assert.deepEqual(buildLayoutEditorInfoPills({ snapOn: false, itemCount: 0 }), [
    '거실 5400 x 3400',
    '자유 이동',
    '배치 가구 0개',
  ])
})

test('buildLayoutEditorSelectionSnapshot exposes stable property-panel copy and fallbacks', () => {
  assert.deepEqual(
    buildLayoutEditorSelectionSnapshot(
      { name: '코튼베이지 모듈 소파', x: 43.6, y: 27.2, colorIndex: 2 },
      { blurb: '동선 확보가 쉬운 모듈형 구성이에요.' },
    ),
    {
      selectedName: '코튼베이지 모듈 소파',
      position: { x: 44, y: 27 },
      selectedColorIndex: 2,
      selectedBlurb: '동선 확보가 쉬운 모듈형 구성이에요.',
    },
  )

  assert.deepEqual(buildLayoutEditorSelectionSnapshot(undefined, undefined), {
    selectedName: '선택 없음',
    position: { x: 0, y: 0 },
    selectedColorIndex: 0,
    selectedBlurb: defaultPlacedItemBlurb,
  })
})
