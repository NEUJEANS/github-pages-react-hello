function buildGuestDraftSavePayload(guestDraftSnapshot = null, intent = null) {
  if (!guestDraftSnapshot) return null

  const draftLabel = intent?.draftLabel ?? guestDraftSnapshot.continuity?.apartmentLabel ?? null
  const apartmentLabel = guestDraftSnapshot.continuity?.apartmentLabel ?? null
  const recommendationDraft = guestDraftSnapshot.recommendationDraft ?? null
  const recommendationRoom = recommendationDraft?.room ?? null
  const apartmentSelectionId = guestDraftSnapshot.spaceProfile?.apartmentSelectionId ?? null
  const selectedSpaceIds = guestDraftSnapshot.spaceProfile?.spaces ?? []
  const layoutItems = guestDraftSnapshot.continuity?.layoutItems ?? []
  const layoutTrayItems = guestDraftSnapshot.continuity?.layoutTrayItems ?? []

  if (!draftLabel && !apartmentLabel && !apartmentSelectionId && !recommendationRoom && !selectedSpaceIds.length && !layoutItems.length && !layoutTrayItems.length) {
    return null
  }

  return {
    draftLabel,
    apartmentLabel,
    apartmentSelectionId,
    recommendationRoom,
    recommendationDraft,
    selectedSpaceIds,
    layoutItems,
    layoutTrayItems,
  }
}

export function buildAuthDraftSavePayload(loginFormDraftSave = null, authSessionDraftSave = null, guestDraftSnapshot = null, intent = null) {
  if (loginFormDraftSave) return loginFormDraftSave

  const guestDraftSave = buildGuestDraftSavePayload(guestDraftSnapshot, intent)
  if (!authSessionDraftSave) return guestDraftSave
  if (!guestDraftSave) return authSessionDraftSave

  return {
    ...authSessionDraftSave,
    ...guestDraftSave,
    draftLabel: guestDraftSave.draftLabel ?? authSessionDraftSave.draftLabel ?? null,
    apartmentLabel: guestDraftSave.apartmentLabel ?? authSessionDraftSave.apartmentLabel ?? null,
    apartmentSelectionId: guestDraftSave.apartmentSelectionId ?? authSessionDraftSave.apartmentSelectionId ?? null,
    recommendationRoom: guestDraftSave.recommendationRoom ?? authSessionDraftSave.recommendationRoom ?? null,
    recommendationDraft: guestDraftSave.recommendationDraft ?? authSessionDraftSave.recommendationDraft ?? null,
    selectedSpaceIds: guestDraftSave.selectedSpaceIds ?? authSessionDraftSave.selectedSpaceIds ?? [],
    layoutItems: guestDraftSave.layoutItems ?? authSessionDraftSave.layoutItems ?? [],
    layoutTrayItems: guestDraftSave.layoutTrayItems ?? authSessionDraftSave.layoutTrayItems ?? [],
  }
}
