import React from 'react'

function RetiredFlowSurface({
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
          <div className="eyebrow darkEyebrow">PRODUCT DIRECTION UPDATED</div>
          <h2>{title}</h2>
          <p>{body}</p>
          <div className="heroActions">
            <button className="cta" onClick={() => navigate('layout')}>레이아웃 에디터 열기</button>
            <button
              className="ghost"
              onClick={() => onOpenLogin({
                source: 'retired-flow-surface',
                action: 'resume-authenticated-flow',
                label: '레이아웃 작업 이어가기',
                draftLabel: '프로젝트 레이아웃 보드',
                returnScreen: 'layout',
              })}
            >
              {authSession ? '계정 상태 확인' : '로그인 / 회원가입'}
            </button>
            <button className="ghost" onClick={openCart}>장바구니 보기 ({cartCount})</button>
          </div>
        </div>
        <div className="heroCards">
          <div className="floatingCard">
            <span>📐</span>
            <strong>레이아웃 편집 집중</strong>
            <small>실제 진행 가능한 작업만 남겼어요</small>
          </div>
          <div className="floatingCard lifted">
            <span>🔐</span>
            <strong>계정 연속성 유지</strong>
            <small>로그인 후 저장/복원이 계속 동작합니다</small>
          </div>
        </div>
      </section>
      <section className="aiStrip">
        <div>
          <strong>정리된 범위</strong>
          <span>아파트 탐색·준비·추천 진입 화면은 제거하고 레이아웃 보드와 인증 흐름에 집중합니다.</span>
        </div>
        <button className="ghost dark" onClick={() => navigate('layout')}>바로 편집 계속</button>
      </section>
    </div>
  )
}

export function AiRecommendPage(props) {
  return (
    <RetiredFlowSurface
      title="AI 추천 진입 화면은 정리되고 레이아웃 편집 중심으로 전환됐어요"
      body="프로젝트 결정에 따라 아파트 탐색/추천 준비 플로우는 더 이상 전면에 두지 않습니다. 실제 진행 가능한 레이아웃 편집과 로그인 연속성만 남겨 빠르게 이어갈 수 있게 했어요."
      {...props}
    />
  )
}

export function SpaceSelectPage(props) {
  return (
    <RetiredFlowSurface
      title="공간 선택 준비 단계는 종료되고 바로 편집 흐름으로 연결돼요"
      body="실측 전제의 사전 공간 선택 단계는 제거했습니다. 남은 작업은 레이아웃 보드에서 바로 이어가고, 필요한 저장/복원은 계정 흐름으로 처리합니다."
      {...props}
    />
  )
}
