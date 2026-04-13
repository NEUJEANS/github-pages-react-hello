export function buildRecommendationSummary({
  apartmentType,
  room,
  style,
  priority,
  lifestyle,
  extraRequest,
  styleOptions,
  priorityOptions,
}) {
  const styleLabel = styleOptions.find((item) => item.id === style)?.label ?? '미니멀'
  const priorityLabel = priorityOptions.find((item) => item.id === priority)?.label ?? '채광/동선 우선'
  const lifestyleLabel = lifestyle?.length ? `${lifestyle.join(' · ')} 중심으로` : '기본 생활 패턴 기준으로'
  const requestLabel = extraRequest?.trim() || '웜 뉴트럴 톤과 패브릭 중심으로 정돈'

  return `${apartmentType} ${room} 기준, ${styleLabel} 톤을 유지하면서 ${priorityLabel}로 ${lifestyleLabel} ${requestLabel} 방향의 추천안입니다.`
}

export function buildInputBrief({
  form,
  spaceProfile,
  apartmentSearchResults,
  formatApartmentOption,
  styleOptions,
  priorityOptions,
}) {
  const apartment = apartmentSearchResults.find((item) => item.id === spaceProfile.apartmentSelectionId)
  const apartmentLabel = apartment ? formatApartmentOption(apartment) : spaceProfile.query
  const styleLabel = styleOptions.find((item) => item.id === form.style)?.label ?? '미니멀'
  const priorityLabel = priorityOptions.find((item) => item.id === form.priority)?.label ?? '채광/동선 우선'
  const lifestyleLabel = form.lifestyle.length ? form.lifestyle.join(', ') : '기본'

  return {
    apartmentLabel,
    apartmentMeta: apartment
      ? [apartment.areaLabel, apartment.unitLabel, apartment.layoutLabel, apartment.variantLabel].join(' · ')
      : `${spaceProfile.apartmentType} · 공간 정보 확인 필요`,
    styleLabel,
    priorityLabel,
    lifestyleLabel,
    requestLabel: form.extraRequest?.trim() || '추가 요청 없음',
  }
}
