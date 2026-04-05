export function toggleRequiredSelection(values, nextValue) {
  if (values.includes(nextValue)) {
    return values.length === 1 ? values : values.filter((value) => value !== nextValue)
  }

  return [...values, nextValue]
}

export function buildApartmentSelectionSnapshot({
  spaceProfile,
  apartmentSearchResults,
  formatApartmentOption,
}) {
  const selectedApartment = apartmentSearchResults.find((item) => item.id === spaceProfile.apartmentSelectionId)
  const apartmentLabel = selectedApartment ? formatApartmentOption(selectedApartment) : (spaceProfile.query || '주소를 입력해보세요')
  const apartmentMeta = selectedApartment
    ? [selectedApartment.areaLabel, selectedApartment.unitLabel, selectedApartment.layoutLabel, selectedApartment.variantLabel].join(' · ')
    : '실측 평면도 · 거실/침실/주방 데이터 제공'

  return {
    selectedApartment,
    apartmentLabel,
    apartmentMeta,
  }
}

export function applyApartmentSelection(current, option, formatApartmentOption) {
  return {
    ...current,
    query: formatApartmentOption(option),
    apartmentType: option.unitLabel,
    apartmentSelectionId: option.id,
  }
}

export function updateSpaceProfileQuery(current, query) {
  return {
    ...current,
    query,
  }
}

export function updateSpaceProfileApartmentType(current, apartmentType) {
  return {
    ...current,
    apartmentType,
  }
}

export function toggleSpaceProfileZone(current, zoneId) {
  return {
    ...current,
    spaces: toggleRequiredSelection(current.spaces, zoneId),
  }
}

export function getAddressOverlayZones(baseZones) {
  return baseZones.filter((zone) => ['living', 'kitchen', 'bed1', 'bed2'].includes(zone.id))
}
