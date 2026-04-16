export function buildSelectedApartment(apartmentSearchResults, apartmentSelectionId) {
  return apartmentSearchResults.find((item) => item.id === apartmentSelectionId) ?? null
}

export function buildRecommendationContext({ aiForm, spaceProfile, selectedApartment, formatApartmentOption }) {
  return {
    ...aiForm,
    apartmentType: spaceProfile.apartmentType,
    apartmentQuery: selectedApartment ? formatApartmentOption(selectedApartment) : spaceProfile.query,
    apartmentSelectionId: spaceProfile.apartmentSelectionId,
  }
}

export function resolveAiRoomSelection(currentRoom, selectedSpaceSummary) {
  if (!selectedSpaceSummary.chips.length) return currentRoom
  return selectedSpaceSummary.availableRooms.includes(currentRoom)
    ? currentRoom
    : selectedSpaceSummary.primaryRoom
}

export function buildLayoutAddressSummary(spaceProfile, { selectedApartment = null, formatApartmentOption = null } = {}) {
  const apartmentLabel = selectedApartment && typeof formatApartmentOption === 'function'
    ? formatApartmentOption(selectedApartment)
    : (spaceProfile?.apartmentType || spaceProfile?.query || '프로젝트 레이아웃 보드')

  return `${apartmentLabel} · ${spaceProfile?.spaces?.length ?? 0}개 공간 선택`
}
