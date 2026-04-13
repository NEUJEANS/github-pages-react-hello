import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildInputBrief,
  buildRecommendationSummary,
} from './ai-recommendation-state.js'

const styleOptions = [
  { id: 'minimal', label: '미니멀' },
  { id: 'natural', label: '내추럴' },
]

const priorityOptions = [
  { id: 'flow', label: '채광/동선 우선' },
  { id: 'storage', label: '수납 우선' },
]

const apartmentSearchResults = [
  {
    id: 'apt-84a',
    brand: '래미안',
    complex: '포레스트',
    unitLabel: '84A',
    areaLabel: '전용 84㎡',
    layoutLabel: '4Bay',
    variantLabel: '거실 확장형',
  },
]

const formatApartmentOption = (option) => [option.brand, option.complex, option.unitLabel].filter(Boolean).join(' ')

test('buildRecommendationSummary uses configured labels and sensible fallbacks', () => {
  assert.equal(
    buildRecommendationSummary({
      apartmentType: '84A',
      room: '거실',
      style: 'natural',
      priority: 'storage',
      lifestyle: ['재택근무', '반려동물'],
      extraRequest: '수납 벽면을 늘리고 싶어요.',
      styleOptions,
      priorityOptions,
    }),
    '84A 거실 기준, 내추럴 톤을 유지하면서 수납 우선로 재택근무 · 반려동물 중심으로 수납 벽면을 늘리고 싶어요. 방향의 추천안입니다.',
  )

  assert.equal(
    buildRecommendationSummary({
      apartmentType: '59A',
      room: '침실',
      style: 'missing',
      priority: 'missing',
      lifestyle: [],
      extraRequest: '   ',
      styleOptions,
      priorityOptions,
    }),
    '59A 침실 기준, 미니멀 톤을 유지하면서 채광/동선 우선로 기본 생활 패턴 기준으로 웜 뉴트럴 톤과 패브릭 중심으로 정돈 방향의 추천안입니다.',
  )
})

test('buildInputBrief prefers selected apartment metadata and trims the extra request', () => {
  assert.deepEqual(
    buildInputBrief({
      form: {
        style: 'natural',
        priority: 'storage',
        lifestyle: ['재택근무', '반려동물'],
        extraRequest: '  수납을 넉넉하게 확보하고 싶어요.  ',
      },
      spaceProfile: {
        query: '서울 성동구 성수동',
        apartmentType: '84A',
        apartmentSelectionId: 'apt-84a',
      },
      apartmentSearchResults,
      formatApartmentOption,
      styleOptions,
      priorityOptions,
    }),
    {
      apartmentLabel: '래미안 포레스트 84A',
      apartmentMeta: '전용 84㎡ · 84A · 4Bay · 거실 확장형',
      styleLabel: '내추럴',
      priorityLabel: '수납 우선',
      lifestyleLabel: '재택근무, 반려동물',
      requestLabel: '수납을 넉넉하게 확보하고 싶어요.',
    },
  )
})

test('buildInputBrief falls back to typed query and default labels when no apartment is selected', () => {
  assert.deepEqual(
    buildInputBrief({
      form: {
        style: 'missing',
        priority: 'missing',
        lifestyle: [],
        extraRequest: '',
      },
      spaceProfile: {
        query: '서울 성동구 성수동 트리마제',
        apartmentType: '59A',
        apartmentSelectionId: '',
      },
      apartmentSearchResults,
      formatApartmentOption,
      styleOptions,
      priorityOptions,
    }),
    {
      apartmentLabel: '서울 성동구 성수동 트리마제',
      apartmentMeta: '59A · 공간 정보 확인 필요',
      styleLabel: '미니멀',
      priorityLabel: '채광/동선 우선',
      lifestyleLabel: '기본',
      requestLabel: '추가 요청 없음',
    },
  )
})
