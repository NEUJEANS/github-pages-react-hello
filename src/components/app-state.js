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

export function buildLayoutAddressSummary(spaceProfile) {
  return `${spaceProfile.apartmentType} · ${spaceProfile.spaces.length}개 공간 선택`
}
