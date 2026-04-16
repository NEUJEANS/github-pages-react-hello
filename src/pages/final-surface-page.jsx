import React from 'react'

function FinalSurfacePage({
  title,
  body,
  navigate,
  openCart,
  cartCount,
  onOpenLogin,
  authSession,
}) {
  return (
    <div className="screenCanvas plainBg">
      <section className="heroBanner">
        <div>
          <div className="eyebrow darkEyebrow">FINAL SURFACE</div>
          <h2>{title}</h2>
          <p>{body}</p>
          <div className="heroActions">
            <button className="cta" onClick={() => navigate('layout')}>레이아웃 보드 열기</button>
            <button
              className="ghost"
              onClick={() => onOpenLogin({
                source: 'final-surface-page',
                action: 'resume-authenticated-flow',
                label: '레이아웃 작업 이어가기',
                draftLabel: '프로젝트 레이아웃 보드',
                returnScreen: 'layout',
              })}
            >
              {authSession ? '계정 보기' : '로그인 / 회원가입'}
            </button>
            <button className="ghost" onClick={openCart}>장바구니 보기 ({cartCount})</button>
          </div>
        </div>
        <div className="heroCards">
          <div className="floatingCard">
            <span>🧹</span>
            <strong>탐색 UI 제거</strong>
            <small>가구 탐색/검색/브라우징 화면은 정리했습니다</small>
          </div>
          <div className="floatingCard lifted">
            <span>🛠️</span>
            <strong>실행 가능한 범위 유지</strong>
            <small>편집 보드와 인증 연속성만 남겼어요</small>
          </div>
        </div>
      </section>
      <section className="aiStrip">
        <div>
          <strong>현재 남은 핵심 흐름</strong>
          <span>레이아웃 편집, 저장/복원, 로그인/회원가입 연동에 집중합니다.</span>
        </div>
        <button className="ghost dark" onClick={() => navigate('layout')}>편집으로 이동</button>
      </section>
    </div>
  )
}

export function BedsCategoryPage(props) {
  return (
    <FinalSurfacePage
      title="가구 브라우징 카탈로그는 프로젝트 범위에서 제외됐어요"
      body="대규모 상품 탐색/필터/빠른 보기 UI는 더 이상 유지하지 않습니다. 실제 사용자 가치가 남는 레이아웃 보드와 인증 연속성 중심으로 화면을 정리했습니다."
      {...props}
    />
  )
}

export function FurnitureHomePage(props) {
  return (
    <FinalSurfacePage
      title="남은 제품 표면은 정리되고 보드 중심 진입만 남았어요"
      body="홈/컬렉션/브라우징 진입은 제거하고, 진행 가능한 작업인 레이아웃 편집과 계정 흐름으로 바로 이어지도록 단순화했습니다."
      {...props}
    />
  )
}
