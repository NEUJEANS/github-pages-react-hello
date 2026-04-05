import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildEditorPalette,
  buildLayoutEditorActionButtons,
  buildLayoutEditorActionCommands,
  buildLayoutEditorColorOptions,
  buildLayoutEditorHint,
  buildLayoutEditorInfoPills,
  buildLayoutEditorMovementNote,
  buildLayoutEditorSelectionSnapshot,
  buildLayoutEditorToolbarButtons,
  buildLayoutEditorToolbarCommands,
  buildPlacedItemClassName,
  buildPlacedItemStyle,
  defaultEditorColors,
  defaultLayoutEditorHintBadge,
  defaultLayoutEditorMovementNote,
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

test('buildLayoutEditorToolbarButtons exposes a stable tool order with active-state and undo availability metadata', () => {
  assert.deepEqual(buildLayoutEditorToolbarButtons('move'), [
    { id: 'select', label: '✥', isActive: false, disabled: false },
    { id: 'move', label: '✋', isActive: true, disabled: false },
    { id: 'color', label: '◉', isActive: false, disabled: false },
    { id: 'rotate', label: '⟲', isActive: false, disabled: false },
    { id: 'undo', label: '↶', isActive: false, disabled: true },
  ])

  assert.equal(buildLayoutEditorToolbarButtons('select', { canUndo: true })[4].disabled, false)
})

test('buildLayoutEditorToolbarCommands exposes stable command sequences for each toolbar control', () => {
  assert.deepEqual(buildLayoutEditorToolbarCommands('select'), [
    { type: 'set-active-tool', value: 'select' },
  ])

  assert.deepEqual(buildLayoutEditorToolbarCommands('color'), [
    { type: 'set-active-tool', value: 'color' },
    { type: 'cycle-color' },
  ])

  assert.deepEqual(buildLayoutEditorToolbarCommands('rotate'), [
    { type: 'set-active-tool', value: 'rotate' },
    { type: 'rotate-selected' },
  ])

  assert.deepEqual(buildLayoutEditorToolbarCommands('undo'), [
    { type: 'undo' },
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

test('buildLayoutEditorHint adjusts the helper copy for snap mode', () => {
  assert.deepEqual(buildLayoutEditorHint({ snapOn: true }), {
    badge: defaultLayoutEditorHintBadge,
    description: '가구를 누른 채 바로 끌어도 되고, ✋ 이동 툴에서 빈 공간을 클릭하면 선택한 가구가 부드럽게 이동해요. 스냅을 끄면 더 자유롭게 배치할 수 있어요.',
  })

  assert.deepEqual(buildLayoutEditorHint({ snapOn: false }), {
    badge: defaultLayoutEditorHintBadge,
    description: '가구를 누른 채 바로 끌거나 ✋ 이동 툴에서 빈 공간을 클릭해 움직일 수 있어요. 지금은 스냅이 꺼져 있어서 더 자유롭게 배치됩니다.',
  })
})

test('buildLayoutEditorColorOptions exposes palette swatches with active-state metadata', () => {
  assert.deepEqual(
    buildLayoutEditorColorOptions({ colors: ['#111111', '#222222', '#333333'] }, 1),
    [
      { color: '#111111', index: 0, isActive: false },
      { color: '#222222', index: 1, isActive: true },
      { color: '#333333', index: 2, isActive: false },
    ],
  )

  assert.equal(buildLayoutEditorColorOptions(undefined, 0)[0].isActive, true)
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


test('buildLayoutEditorActionButtons exposes action metadata and disables add-to-cart until a selection exists', () => {
  assert.deepEqual(buildLayoutEditorActionButtons(true), [
    { id: 'browse-more', label: '가구 더 보기', tone: 'cta', action: 'navigate-beds', disabled: false },
    { id: 'reselect-space', label: '공간 다시 선택', tone: 'ghost', action: 'open-address-overlay', disabled: false },
    { id: 'add-selected-to-cart', label: '선택 가구 담기', tone: 'ghost', action: 'add-selected-to-cart', disabled: false },
    { id: 'reset-layout', label: '초기 배치 복원', tone: 'ghost', action: 'reset-layout', disabled: false },
  ])

  assert.equal(buildLayoutEditorActionButtons(false)[2].disabled, true)
})


test('buildLayoutEditorActionCommands exposes stable property-panel command sequences', () => {
  assert.deepEqual(buildLayoutEditorActionCommands('navigate-beds'), [
    { type: 'navigate', value: 'beds' },
  ])

  assert.deepEqual(buildLayoutEditorActionCommands('open-address-overlay'), [
    { type: 'open-overlay', value: 'address' },
  ])

  assert.deepEqual(buildLayoutEditorActionCommands('add-selected-to-cart'), [
    { type: 'add-selected-to-cart' },
  ])

  assert.deepEqual(buildLayoutEditorActionCommands('reset-layout'), [
    { type: 'reset-layout' },
  ])

  assert.deepEqual(buildLayoutEditorActionCommands('unknown'), [])
})

test('buildLayoutEditorMovementNote returns the stable movement guidance copy', () => {
  assert.equal(buildLayoutEditorMovementNote(), defaultLayoutEditorMovementNote)
})
