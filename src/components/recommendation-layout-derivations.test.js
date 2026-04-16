import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildLayoutAddressSummary,
  buildRecommendationContext,
  buildSelectedApartment,
  resolveAiRoomSelection,
} from './recommendation-layout-derivations.js'

test('buildSelectedApartment returns the matching apartment option', () => {
  const apartment = buildSelectedApartment([
    { id: 'a', brand: '래미안' },
    { id: 'b', brand: '자이' },
  ], 'b')

  assert.deepEqual(apartment, { id: 'b', brand: '자이' })
})

test('buildSelectedApartment falls back to null for unknown selections', () => {
  assert.equal(buildSelectedApartment([{ id: 'a' }], 'missing'), null)
})

test('buildRecommendationContext prefers the selected apartment label', () => {
  const context = buildRecommendationContext({
    aiForm: { room: '거실', style: 'minimal' },
    spaceProfile: {
      apartmentType: '84A',
      apartmentSelectionId: 'apt-1',
      query: '서울 성동구',
    },
    selectedApartment: { id: 'apt-1', brand: '래미안', complex: '포레스트', unitLabel: '84A' },
    formatApartmentOption: (option) => [option.brand, option.complex, option.unitLabel].join(' '),
  })

  assert.deepEqual(context, {
    room: '거실',
    style: 'minimal',
    apartmentType: '84A',
    apartmentQuery: '래미안 포레스트 84A',
    apartmentSelectionId: 'apt-1',
  })
})

test('buildRecommendationContext falls back to the typed query without a selected apartment', () => {
  const context = buildRecommendationContext({
    aiForm: { room: '침실' },
    spaceProfile: {
      apartmentType: '59A',
      apartmentSelectionId: null,
      query: '서울 강남구',
    },
    selectedApartment: null,
    formatApartmentOption: () => 'unused',
  })

  assert.deepEqual(context, {
    room: '침실',
    apartmentType: '59A',
    apartmentQuery: '서울 강남구',
    apartmentSelectionId: null,
  })
})

test('resolveAiRoomSelection keeps the current room when it is still available', () => {
  assert.equal(resolveAiRoomSelection('거실', {
    chips: ['거실', '안방'],
    availableRooms: ['거실', '침실'],
    primaryRoom: '침실',
  }), '거실')
})

test('resolveAiRoomSelection switches to the primary room when the current room is no longer available', () => {
  assert.equal(resolveAiRoomSelection('주방', {
    chips: ['안방'],
    availableRooms: ['침실'],
    primaryRoom: '침실',
  }), '침실')
})

test('resolveAiRoomSelection leaves the room untouched when no spaces are selected', () => {
  assert.equal(resolveAiRoomSelection('거실', {
    chips: [],
    availableRooms: ['침실'],
    primaryRoom: '침실',
  }), '거실')
})

test('buildLayoutAddressSummary reflects the selected apartment type and space count', () => {
  assert.equal(buildLayoutAddressSummary({ apartmentType: '101A', spaces: ['living', 'bed1', 'entry'] }), '101A · 3개 공간 선택')
})

test('buildLayoutAddressSummary prefers the hydrated apartment label when available', () => {
  assert.equal(
    buildLayoutAddressSummary(
      { apartmentType: '101A', spaces: ['living', 'bed1', 'entry'] },
      {
        selectedApartment: { brand: '아크로', complex: '리버뷰', unitLabel: '101A' },
        formatApartmentOption: (option) => [option.brand, option.complex, option.unitLabel].join(' '),
      },
    ),
    '아크로 리버뷰 101A · 3개 공간 선택',
  )
})
