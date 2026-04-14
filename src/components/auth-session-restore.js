function normalizeSelectedSpaceIds(selectedSpaceIds = []) {
  return Array.isArray(selectedSpaceIds)
    ? selectedSpaceIds.filter((value, index, array) => typeof value === 'string' && value && array.indexOf(value) === index)
    : []
}

function buildRoomAliasMap(spaceZones = [], roomOptions = []) {
  const aliases = new Map([
    ['거실', 'living'],
    ['리빙', 'living'],
    ['주방', 'kitchen'],
    ['부엌', 'kitchen'],
    ['침실', 'bed1'],
    ['안방', 'bed1'],
    ['서재', 'bed2'],
    ['침실/서재', 'bed2'],
  ])

  spaceZones.forEach((zone) => {
    if (!zone?.id) return
    if (typeof zone.name === 'string' && zone.name.trim()) aliases.set(zone.name.trim(), zone.id)
  })

  roomOptions.forEach((room) => {
    if (!aliases.has(room)) {
      if (room === '거실') aliases.set(room, 'living')
      if (room === '주방') aliases.set(room, 'kitchen')
      if (room === '침실') aliases.set(room, 'bed1')
      if (room === '서재') aliases.set(room, 'bed2')
    }
  })

  return aliases
}

export function shouldApplyPostAuthSessionRestore(session, lastAppliedSavedAt = null) {
  if (!session?.savedAt) return false
  return session.savedAt !== lastAppliedSavedAt
}

export function buildPostAuthSessionRestorePatch(session, { spaceZones = [], roomOptions = [], fallbackRoom = '거실' } = {}) {
  const summary = session?.guestDraftSummary ?? null
  if (!summary) return null

  const normalizedSelectedSpaceIds = normalizeSelectedSpaceIds(summary.selectedSpaceIds)
  const aliases = buildRoomAliasMap(spaceZones, roomOptions)
  const selectedSpaceIds = normalizedSelectedSpaceIds.length
    ? normalizedSelectedSpaceIds
    : (summary.selectedRooms ?? [])
      .map((room) => aliases.get(room) ?? null)
      .filter((value, index, array) => typeof value === 'string' && value && array.indexOf(value) === index)

  const recommendationRoom = typeof summary.recommendationRoom === 'string' && roomOptions.includes(summary.recommendationRoom)
    ? summary.recommendationRoom
    : fallbackRoom

  if (!selectedSpaceIds.length && recommendationRoom === fallbackRoom) return null

  const apartmentSelectionId = typeof session?.draftSave?.apartmentSelectionId === 'string' && session.draftSave.apartmentSelectionId.trim()
    ? session.draftSave.apartmentSelectionId.trim()
    : (typeof summary.apartmentSelectionId === 'string' && summary.apartmentSelectionId.trim()
      ? summary.apartmentSelectionId.trim()
      : null)

  return {
    ...(apartmentSelectionId ? { apartmentSelectionId } : {}),
    selectedSpaceIds,
    recommendationRoom,
  }
}
