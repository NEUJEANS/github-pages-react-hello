export function buildSelectedSpaceSummary(baseZones, roomOptions, spaceIds) {
  const selectedZones = baseZones.filter((zone) => spaceIds.includes(zone.id))
  const primarySpace = selectedZones[0]?.name ?? '거실'
  const primaryRoom = selectedZones.find((zone) => ['living', 'kitchen'].includes(zone.id))?.name
    ?? (selectedZones.find((zone) => ['bed1', 'bed2'].includes(zone.id)) ? '침실' : '거실')
  const availableRooms = roomOptions.filter((room) => {
    if (room === '거실') return spaceIds.includes('living')
    if (room === '주방') return spaceIds.includes('kitchen')
    if (room === '침실') return spaceIds.some((id) => ['bed1', 'bed2'].includes(id))
    if (room === '서재') return spaceIds.includes('bed2')
    return false
  })

  return {
    chips: selectedZones.map((zone) => ({ id: zone.id, icon: zone.icon, name: zone.name })),
    caption: selectedZones.length
      ? `${primarySpace} 포함 ${selectedZones.length}개 공간이 현재 AI 추천과 배치 화면에 함께 연결돼 있어요.`
      : '아직 연결된 공간이 없어요.',
    primaryRoom,
    availableRooms: availableRooms.length ? availableRooms : ['거실'],
  }
}
