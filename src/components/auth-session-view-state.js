export function buildAuthSessionNotice(session) {
  if (!session?.accountLabel) return null

  const restoredBits = []
  if ((session.restoredWishlistCount ?? 0) > 0) restoredBits.push(`찜 ${session.restoredWishlistCount}개`)
  if ((session.restoredCartCount ?? 0) > 0) restoredBits.push(`장바구니 ${session.restoredCartCount}개`)
  if ((session.restoredLayoutItemCount ?? 0) > 0) restoredBits.push(`배치 ${session.restoredLayoutItemCount}개`)
  if (session.restoredRecommendationDraft) restoredBits.push('추천 초안')

  const mergeLabel = session.mergeMode === 'merged'
    ? '게스트 초안을 계정에 이어붙였어요.'
    : session.mergeMode === 'replaced'
      ? '계정 상태로 전환했어요.'
      : session.mergeMode
        ? `병합 상태 ${session.mergeMode}로 연결했어요.`
        : '계정 연결이 준비됐어요.'

  return {
    title: `${session.accountLabel} 계정 연결됨`,
    body: restoredBits.length
      ? `${mergeLabel} ${restoredBits.join(' · ')} 복원 내용을 이번 세션에 반영했어요.`
      : mergeLabel,
    restoredBits,
  }
}
