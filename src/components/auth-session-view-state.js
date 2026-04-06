function buildDraftContextBits(summary = null) {
  if (!summary) return []

  const bits = []
  if (summary.apartmentLabel) bits.push(summary.apartmentLabel)
  if (summary.selectedRoomCount > 0) bits.push(`공간 ${summary.selectedRoomCount}개`)
  if (summary.recommendationRoom) bits.push(`${summary.recommendationRoom} 추천`)
  return bits
}

function buildIntentCopy(intent) {
  if (!intent?.label && !intent?.draftLabel) return ''

  const label = intent.label ?? '로그인 이후 작업'
  const draftCopy = intent.draftLabel ? ` (${intent.draftLabel})` : ''
  return ` ${label}${draftCopy} 단계까지 이어서 진행할 수 있어요.`
}

export function buildAuthSessionNotice(session) {
  if (!session?.accountLabel) return null

  const restoredBits = []
  if ((session.restoredWishlistCount ?? 0) > 0) restoredBits.push(`찜 ${session.restoredWishlistCount}개`)
  if ((session.restoredCartCount ?? 0) > 0) restoredBits.push(`장바구니 ${session.restoredCartCount}개`)
  if ((session.restoredLayoutItemCount ?? 0) > 0) restoredBits.push(`배치 ${session.restoredLayoutItemCount}개`)
  if (session.restoredRecommendationDraft) restoredBits.push('추천 초안')

  const draftContextBits = buildDraftContextBits(session.guestDraftSummary)

  const mergeLabel = session.mergeMode === 'merged'
    ? '게스트 초안을 계정에 이어붙였어요.'
    : session.mergeMode === 'replaced'
      ? '계정 상태로 전환했어요.'
      : session.mergeMode
        ? `병합 상태 ${session.mergeMode}로 연결했어요.`
        : '계정 연결이 준비됐어요.'

  const draftContextCopy = draftContextBits.length
    ? ` ${draftContextBits.join(' · ')} 기준으로 이어졌어요.`
    : ''
  const handoffCopy = session.handoffId ? ` handoff ${session.handoffId} 기준으로 이어졌어요.` : ''
  const transportCopy = session.authMode === 'scaffold'
    ? ` ${session.authTransport === 'same-origin-middleware' ? '현재는 same-origin scaffold 응답으로 연결 상태를 확인 중이에요.' : '현재는 local scaffold로 연결 흐름을 유지하고 있어요.'}`
    : ''
  const connectionCopy = session.connection?.targetLabel
    ? ` 로그인 요청 대상은 ${session.connection.targetLabel}${session.connection.endpoint ? ` (${session.connection.endpoint})` : ''}로 기록해뒀어요.`
    : ''
  const intentCopy = buildIntentCopy(session.intent)

  return {
    title: `${session.accountLabel} 계정 연결됨`,
    body: restoredBits.length
      ? `${mergeLabel}${draftContextCopy}${handoffCopy}${transportCopy}${connectionCopy}${intentCopy} ${restoredBits.join(' · ')} 복원 내용을 이번 세션에 반영했어요.`.trim()
      : `${mergeLabel}${draftContextCopy}${handoffCopy}${transportCopy}${connectionCopy}${intentCopy}`.trim(),
    restoredBits,
    draftContextBits,
  }
}
