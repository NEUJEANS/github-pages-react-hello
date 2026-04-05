export function buildLoginGuardSnapshot({ engagement, wishlistCount = 0, cartCount = 0 }) {
  const metrics = {
    aiRequests: engagement?.aiRequests ?? 0,
    furniturePlacements: engagement?.furniturePlacements ?? 0,
    draftBoards: engagement?.draftBoards ?? 0,
    wishlistCount,
    cartCount,
  }

  const reasons = []
  if (metrics.aiRequests > 0) reasons.push(`AI 추천 요청 ${metrics.aiRequests}회`)
  if (metrics.furniturePlacements > 0) reasons.push(`가구 배치 ${metrics.furniturePlacements}회`)
  if (metrics.draftBoards > 0) reasons.push(`진행 중 보드 ${metrics.draftBoards}개`)
  if (metrics.wishlistCount > 0) reasons.push(`찜 ${metrics.wishlistCount}개`)
  if (metrics.cartCount > 0) reasons.push(`장바구니 ${metrics.cartCount}개`)

  return {
    metrics,
    reasons,
    hasLoginGuard: reasons.length > 0,
  }
}
