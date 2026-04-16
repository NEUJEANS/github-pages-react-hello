import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyApartmentSelection,
  buildApartmentSelectionSnapshot,
  getAddressOverlayZones,
  toggleRequiredSelection,
  toggleSpaceProfileZone,
  updateSpaceProfileApartmentType,
  updateSpaceProfileQuery,
} from './address-and-space-selection-state.js'

const apartmentSearchResults = [
  {
    id: 'apt-84a',
    areaLabel: '84㎡',
    unitLabel: '84A',
    layoutLabel: '4Bay',
    variantLabel: '확장형',
    name: '센트럴 파크 101동',
  },
]

const formatApartmentOption = (option) => `${option.name} ${option.unitLabel}`

test('toggleRequiredSelection keeps at least one zone selected', () => {
  assert.deepEqual(toggleRequiredSelection(['living'], 'living'), ['living'])
  assert.deepEqual(toggleRequiredSelection(['living', 'kitchen'], 'living'), ['kitchen'])
  assert.deepEqual(toggleRequiredSelection(['living'], 'bed1'), ['living', 'bed1'])
})

test('buildApartmentSelectionSnapshot prefers the selected apartment labels and metadata', () => {
  const snapshot = buildApartmentSelectionSnapshot({
    spaceProfile: {
      query: '서울 성수동',
      apartmentSelectionId: 'apt-84a',
    },
    apartmentSearchResults,
    formatApartmentOption,
  })

  assert.equal(snapshot.apartmentLabel, '센트럴 파크 101동 84A')
  assert.equal(snapshot.apartmentMeta, '84㎡ · 84A · 4Bay · 확장형')
  assert.equal(snapshot.selectedApartment?.id, 'apt-84a')
})

test('buildApartmentSelectionSnapshot falls back to the typed query and default meta copy', () => {
  const snapshot = buildApartmentSelectionSnapshot({
    spaceProfile: {
      query: '서울 성수동 트리마제',
      apartmentSelectionId: '',
    },
    apartmentSearchResults,
    formatApartmentOption,
  })

  assert.equal(snapshot.apartmentLabel, '서울 성수동 트리마제')
  assert.equal(snapshot.apartmentMeta, '실측 평면도 · 거실/침실/주방 데이터 제공')
  assert.equal(snapshot.selectedApartment, undefined)
})

test('space profile state helpers keep apartment search, type, and zone updates focused', () => {
  const baseProfile = {
    query: '',
    apartmentType: '59A',
    apartmentSelectionId: '',
    spaces: ['living', 'kitchen'],
  }

  const selectedProfile = applyApartmentSelection(baseProfile, apartmentSearchResults[0], formatApartmentOption)
  assert.deepEqual(selectedProfile, {
    query: '센트럴 파크 101동 84A',
    apartmentType: '84A',
    apartmentSelectionId: 'apt-84a',
    spaces: ['living', 'kitchen'],
  })

  assert.deepEqual(updateSpaceProfileQuery(baseProfile, '압구정 현대'), {
    ...baseProfile,
    query: '압구정 현대',
  })

  assert.deepEqual(updateSpaceProfileApartmentType(baseProfile, '84A'), {
    ...baseProfile,
    apartmentType: '84A',
  })

  assert.deepEqual(toggleSpaceProfileZone(baseProfile, 'living'), {
    ...baseProfile,
    spaces: ['kitchen'],
  })
})

test('getAddressOverlayZones keeps only the editor-relevant base rooms', () => {
  const zones = [
    { id: 'living' },
    { id: 'kitchen' },
    { id: 'bed1' },
    { id: 'bed2' },
    { id: 'bath' },
    { id: 'study' },
  ]

  assert.deepEqual(getAddressOverlayZones(zones).map((zone) => zone.id), ['living', 'kitchen', 'bed1', 'bed2'])
})
