import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'

const screenOrder = ['home', 'ai', 'space', 'layout', 'beds']

const screens = [
  { id: 'ai', label: 'AI 추천 입력', badge: '01', title: 'AI 전문가 추천 입력 화면' },
  { id: 'space', label: '공간 선택', badge: '02', title: '꾸밀 공간 선택 화면' },
  { id: 'layout', label: '내가 배치하기', badge: '03', title: '내가 배치하기 에디터' },
  { id: 'address', label: '주소 입력', badge: '03A', title: '배치하기 시작 전 주소/공간 설정' },
  { id: 'beds', label: '침대 카테고리', badge: '04', title: '침대 카테고리 상품 탐색' },
  { id: 'home', label: '가구 먼저 찾기', badge: '05', title: '가구 먼저 찾기 홈페이지' },
]

const aiProducts = [
  { emoji: '🛋️', name: '코튼베이지 모듈 소파', price: '₩1,290,000' },
  { emoji: '🪑', name: '오벌 우드 테이블', price: '₩389,000' },
  { emoji: '🪴', name: '세라믹 플로어 플랜트', price: '₩89,000' },
]

const bedProducts = [
  { badge: 'BEST', emoji: '🛏️', name: '헤이븐 패브릭 침대', fit: 'AI 추천 94%', price: '₩890,000', review: '4.9 · 182' },
  { badge: 'NEW', emoji: '🛌', name: '클라우드 쿠션 침대', fit: '중형 침실 적합', price: '₩1,120,000', review: '4.8 · 74' },
  { badge: 'SALE', emoji: '🪵', name: '월넛 프레임 침대', fit: 'AI 추천 88%', price: '₩760,000', review: '4.7 · 58' },
  { badge: 'HOT', emoji: '✨', name: '리넨 헤드보드 침대', fit: '원룸 배치 적합', price: '₩940,000', review: '4.8 · 101' },
  { badge: 'BEST', emoji: '🌙', name: '소프트 아이보리 침대', fit: 'AI 추천 91%', price: '₩830,000', review: '4.9 · 133' },
  { badge: 'NEW', emoji: '🧸', name: '웜그레이 플랫폼 침대', fit: '패브릭 룩', price: '₩690,000', review: '4.6 · 45' },
]

function getStateFromHash() {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return { screen: 'home', overlay: null }
  if (hash === 'address') return { screen: 'layout', overlay: 'address' }
  if (screenOrder.includes(hash)) return { screen: hash, overlay: null }
  return { screen: 'home', overlay: null }
}

function useSpaNavigation() {
  const [{ screen, overlay }, setState] = React.useState(() => getStateFromHash())
  const [direction, setDirection] = React.useState(1)

  React.useEffect(() => {
    const onHashChange = () => {
      const next = getStateFromHash()
      setDirection(screenOrder.indexOf(next.screen) >= screenOrder.indexOf(screen) ? 1 : -1)
      setState(next)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [screen])

  const syncHash = React.useCallback((nextScreen, nextOverlay) => {
    const nextHash = nextOverlay === 'address' ? 'address' : nextScreen
    if (window.location.hash.replace(/^#/, '') === nextHash) return
    window.history.pushState(null, '', `#${nextHash}`)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }, [])

  const navigate = React.useCallback((nextScreen) => {
    const currentIndex = screenOrder.indexOf(screen)
    const nextIndex = screenOrder.indexOf(nextScreen)
    setDirection(nextIndex >= currentIndex ? 1 : -1)

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setState({ screen: nextScreen, overlay: null })
      })
    } else {
      setState({ screen: nextScreen, overlay: null })
    }

    syncHash(nextScreen, null)
  }, [screen, syncHash])

  const openOverlay = React.useCallback((nextOverlay = 'address') => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setState((current) => ({ ...current, overlay: nextOverlay }))
      })
    } else {
      setState((current) => ({ ...current, overlay: nextOverlay }))
    }
    syncHash(screen, nextOverlay)
  }, [screen, syncHash])

  const closeOverlay = React.useCallback(() => {
    setState((current) => ({ ...current, overlay: null }))
    syncHash(screen, null)
  }, [screen, syncHash])

  return { screen, overlay, direction, navigate, openOverlay, closeOverlay }
}

function Header({ dark = false, active = 'AI 추천', onNavigate, onOpenOverlay }) {
  return (
    <header className={`topbar ${dark ? 'dark' : ''}`}>
      <button className="logo logoBtn" onClick={() => onNavigate('home')}>HAVENLY</button>
      <nav className="navlinks">
        {[
          ['AI 추천', 'ai'],
          ['내가 배치하기', 'layout'],
          ['가구 먼저 찾기', 'home'],
        ].map(([label, id]) => (
          <button key={label} className={active === label ? 'active' : ''} onClick={() => onNavigate(id)}>{label}</button>
        ))}
      </nav>
      <div className="topActions">
        {!dark && <button className="searchPill">🔎 스타일 또는 가구 검색</button>}
        {dark && <button className="miniBtn secondary" onClick={() => onOpenOverlay('address')}>공간 정보</button>}
        {dark && <button className="miniBtn primary" onClick={() => onNavigate('ai')}>AI 추천</button>}
        <button className="cart">🛒<span>3</span></button>
      </div>
    </header>
  )
}

function StageTransition({ screen, direction, children }) {
  const [displayScreen, setDisplayScreen] = React.useState(screen)
  const [phase, setPhase] = React.useState('enter')

  React.useEffect(() => {
    if (screen === displayScreen) return
    setPhase('exit')
    const outTimer = window.setTimeout(() => {
      setDisplayScreen(screen)
      setPhase('enter')
    }, 180)
    return () => window.clearTimeout(outTimer)
  }, [screen, displayScreen])

  React.useEffect(() => {
    if (phase !== 'enter') return
    const settleTimer = window.setTimeout(() => setPhase('idle'), 280)
    return () => window.clearTimeout(settleTimer)
  }, [phase, displayScreen])

  return (
    <div className={`stageViewport ${phase === 'exit' ? 'is-exiting' : ''}`}>
      <div key={`${displayScreen}-${phase}`} className={`stageSlide phase-${phase} ${direction >= 0 ? 'dir-forward' : 'dir-back'}`}>
        {children(displayScreen)}
      </div>
    </div>
  )
}

function App() {
  const { screen, overlay, direction, navigate, openOverlay, closeOverlay } = useSpaNavigation()

  const checklist = [
    '화면 전환이 브라우저 전체 새로고침 없이 앱 내부에서 이뤄질 것',
    '상위 화면 전환은 짧은 directional/fade 모션으로 연속성을 줄 것',
    '주소 입력은 별도 페이지 점프가 아니라 현재 화면 위 오버레이로 열릴 것',
    '즉시 가능한 전환에는 로딩 스피너/빈 화면을 노출하지 않을 것',
    '핵심 CTA와 상단 네비가 실제로 다른 화면/오버레이를 열도록 연결될 것',
    'URL hash로 현재 상태를 유지해 새 탭에서도 같은 화면을 열 수 있을 것',
  ]

  return (
    <main className="appShell">
      <section className="introHero">
        <div>
          <p className="eyebrow">HAVENLY React Conversion</p>
          <h1>화면을 “페이지 이동”이 아니라 앱 흐름처럼 바꿨습니다</h1>
          <p className="subcopy">Material의 fade-through/shared-axis, Motion의 keyed enter/exit, Carbon의 “즉시면 로더를 보이지 말 것” 패턴을 참고해 in-place SPA 전환으로 정리했습니다.</p>
        </div>
        <div className="sourceNotes">
          <strong>Transition refinement checklist</strong>
          <ul>
            {checklist.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>

      <section className="screenNav">
        {screens.map((item) => {
          const isOverlay = item.id === 'address'
          const active = isOverlay ? overlay === 'address' : screen === item.id
          return (
            <button
              key={item.id}
              className={`screenChip ${active ? 'active' : ''}`}
              onClick={() => (isOverlay ? openOverlay('address') : navigate(item.id))}
            >
              <span>{item.badge}</span>{item.label}
            </button>
          )
        })}
      </section>

      <section className={`screenStage ${overlay ? 'overlayOpen' : ''}`}>
        <StageTransition screen={screen} direction={direction}>
          {(visibleScreen) => renderScreen(visibleScreen, { navigate, openOverlay })}
        </StageTransition>

        {overlay === 'address' && (
          <div className="overlayLayer" role="dialog" aria-modal="true">
            <div className="overlayScrim" onClick={closeOverlay} />
            <div className="overlayPanel">
              <AddressSetupScreen navigate={navigate} closeOverlay={closeOverlay} />
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function renderScreen(screen, actions) {
  switch (screen) {
    case 'ai':
      return <AiRecommendScreen {...actions} />
    case 'space':
      return <SpaceSelectScreen {...actions} />
    case 'layout':
      return <LayoutEditorScreen {...actions} />
    case 'beds':
      return <BedsCategoryScreen {...actions} />
    case 'home':
    default:
      return <FurnitureHomeScreen {...actions} />
  }
}

function AiRecommendScreen({ navigate, openOverlay }) {
  return (
    <div className="screenCanvas warmBg">
      <Header active="AI 추천" onNavigate={navigate} onOpenOverlay={openOverlay} />
      <div className="twoCol">
        <aside className="panel leftPanel">
          <div className="stepDots"><b className="on">1</b><span /><b className="done">2</b><span /><b>3</b></div>
          <h2>AI가 공간에 맞는 가구를 추천해드릴게요</h2>
          <p className="muted">아파트 타입, 원하는 공간, 선호 스타일을 입력하면 HAVENLY 톤의 레이아웃과 상품을 제안합니다.</p>
          <label>아파트 검색</label>
          <div className="inputWrap">🔎<input value="래미안 포레스트 84A" readOnly /></div>
          <div className="resultCard">
            <strong>래미안 포레스트 84A</strong>
            <span>전용 84㎡ · 4Bay · 거실 확장형</span>
          </div>
          <label>공간 선택</label>
          <div className="chipRow"><button className="solid">거실</button><button>침실</button><button>주방</button><button>서재</button></div>
          <label>선호 스타일</label>
          <div className="styleGrid">
            <div className="styleBox selected"><span>🤍</span>미니멀</div>
            <div className="styleBox"><span>🌿</span>내추럴</div>
            <div className="styleBox"><span>✨</span>모던 럭스</div>
          </div>
          <label>추가 요청</label>
          <textarea readOnly value={'아이보리/우드 톤으로 따뜻하게, 반려식물과 패브릭 위주로 꾸미고 싶어요.'} />
          <div className="footerButtons stackOnMobile">
            <button className="ghost" onClick={() => openOverlay('address')}>평면도 불러오기</button>
            <button className="cta" onClick={() => navigate('space')}>추천받기</button>
          </div>
        </aside>
        <div className="panel resultPanel">
          <div className="badge">AI 추천 결과</div>
          <h3>거실 배치안 + 상품 추천</h3>
          <div className="floorplan">
            <div className="grid" />
            <div className="roomBorder">
              <div className="windowMark">창문</div>
              <div className="doorMark">현관</div>
              <div className="furn sofa">3인 소파</div>
              <div className="furn rug">러그</div>
              <div className="furn table">테이블</div>
              <div className="furn tv">TV장</div>
            </div>
          </div>
          <div className="productRow">
            {aiProducts.map((item) => (
              <article key={item.name} className="productMini">
                <div className="emojiCard">{item.emoji}</div>
                <strong>{item.name}</strong>
                <span>{item.price}</span>
                <button onClick={() => navigate('layout')}>배치에 담기</button>
              </article>
            ))}
          </div>
          <div className="reasonBox"><strong>AI 코멘트</strong> 채광이 좋은 거실이라 밝은 패브릭 소파와 원형 테이블을 중심으로 동선을 열어두고, 우드/베이지 톤으로 정리했습니다.</div>
        </div>
      </div>
    </div>
  )
}

function SpaceSelectScreen({ navigate, openOverlay }) {
  const items = [
    ['🛋️', '거실', '23.4㎡'], ['🍳', '주방', '11.2㎡'], ['🛏️', '안방', '14.8㎡'], ['📚', '침실/서재', '9.1㎡'], ['🛁', '욕실', '4.1㎡'], ['🚪', '현관', '3.7㎡']
  ]
  return (
    <div className="screenCanvas sandBg">
      <Header active="AI 추천" onNavigate={navigate} onOpenOverlay={openOverlay} />
      <section className="cardStage">
        <div className="cardSurface">
          <div className="progressBar"><span className="fill wide" /></div>
          <p className="tinyPill">평면도 기반 선택</p>
          <h2>어떤 공간을 먼저 꾸밀까요?</h2>
          <p className="muted">공간 선택은 같은 앱 컨텍스트 안에서 바로 다음 스테이지로 이어지도록 구성했습니다.</p>
          <div className="spaceLayout">
            <div className="planBoard">
              <div className="compass">N</div>
              <div className="zone living selected"><b>🛋️</b><span>거실</span></div>
              <div className="zone kitchen"><b>🍳</b><span>주방</span></div>
              <div className="zone bed1"><b>🛏️</b><span>안방</span></div>
              <div className="zone bed2"><b>📚</b><span>침실/서재</span></div>
              <div className="zone bath"><b>🛁</b><span>욕실</span></div>
              <div className="zone entry"><b>🚪</b><span>현관</span></div>
            </div>
            <aside className="selectionPanel">
              <h3>선택된 공간</h3>
              {items.slice(0, 3).map(([icon, name, size]) => (
                <div className="selectionItem" key={name}><span>{icon}</span><div><strong>{name}</strong><small>{size}</small></div></div>
              ))}
              <div className="selectionTotal"><span>총 선택</span><b>3개</b></div>
            </aside>
          </div>
          <div className="footerButtons">
            <button className="ghost" onClick={() => navigate('ai')}>이전</button>
            <button className="cta small" onClick={() => navigate('layout')}>다음 단계 →</button>
          </div>
        </div>
      </section>
    </div>
  )
}

function LayoutEditorScreen({ navigate, openOverlay }) {
  return (
    <div className="screenCanvas editorBg">
      <Header dark active="내가 배치하기" onNavigate={navigate} onOpenOverlay={openOverlay} />
      <section className="editorLayout">
        <aside className="editorSide left">
          <div className="sideHead"><h3>가구 라이브러리</h3><input value="가구 검색" readOnly /></div>
          <div className="tabRow"><button className="solid mini">소파</button><button className="mini">테이블</button><button className="mini">수납</button></div>
          <div className="dragGrid">
            {['🛋️','🪑','🪴','📺','🪞','💡'].map((e, i) => <div key={i} className="dragCard"><span>{e}</span><strong>드래그 아이템</strong><small>1200 x 800</small></div>)}
          </div>
        </aside>
        <div className="editorCenter">
          <div className="toolbar"> <button className="tool active">✥</button><button className="tool">↔</button><button className="tool">⊞</button><button className="tool">⟲</button></div>
          <div className="editorRoom">
            <div className="grid" />
            <div className="roomFrame">
              <div className="placed sofa sel">SOFA</div>
              <div className="placed table">TABLE</div>
              <div className="placed tv">TV</div>
              <div className="placed shelf">SHELF</div>
              <div className="placed plant">🌿</div>
            </div>
          </div>
          <div className="infoPills"><span>거실 5400 x 3400</span><span>스냅 ON</span><span>AI 제안 3개</span></div>
          <div className="recommendStrip">
            {aiProducts.map((item) => <div key={item.name} className="recommendCard"><div>{item.emoji}</div><strong>{item.name}</strong><small>{item.price}</small></div>)}
          </div>
        </div>
        <aside className="editorSide right">
          <div className="sideHead"><h3>속성 패널</h3></div>
          <div className="propBlock"><label>선택 오브젝트</label><strong>코튼베이지 모듈 소파</strong></div>
          <div className="propBlock"><label>크기</label><div className="split"><span>W 2200</span><span>D 900</span></div></div>
          <div className="propBlock"><label>컬러</label><div className="colorDots"><i className="c1"/><i className="c2"/><i className="c3 active"/><i className="c4"/></div></div>
          <div className="propBlock"><label>배치 메모</label><p>창가와 러그 축을 맞춰 안정적인 시선 흐름을 만들었습니다.</p></div>
          <div className="propBlock actionBlock"><button className="cta" onClick={() => navigate('beds')}>가구 더 보기</button><button className="ghost" onClick={() => openOverlay('address')}>공간 다시 선택</button></div>
        </aside>
      </section>
    </div>
  )
}

function AddressSetupScreen({ navigate, closeOverlay }) {
  return (
    <div className="setupCard">
      <div className="overlayHeader"><span>공간 정보 연결</span><button className="overlayClose" onClick={closeOverlay}>✕</button></div>
      <div className="setupInner">
        <div className="progressBar"><span className="fill half" /></div>
        <h2>배치하기 전에 공간 정보를 불러올게요</h2>
        <p className="muted">이 단계는 별도 페이지가 아니라 현재 흐름 위에서 바로 여는 설정 오버레이입니다.</p>
        <label>아파트 또는 주소 검색</label>
        <div className="inputWrap big">🔎<input value="서울 성동구 성수이로 123 HAVENLY Apartments" readOnly /></div>
        <div className="resultCard selected"><strong>HAVENLY Apartments 84A</strong><span>실측 평면도 · 거실/침실/주방 데이터 제공</span></div>
        <div className="typeStrip"><button className="solid">84A</button><button>84B</button><button>101A</button><button>59A</button></div>
        <div className="spaceLayout compact">
          <div className="planBoard small">
            <div className="zone living selected"><b>🛋️</b><span>거실</span></div>
            <div className="zone kitchen"><b>🍳</b><span>주방</span></div>
            <div className="zone bed1 selected"><b>🛏️</b><span>안방</span></div>
            <div className="zone bed2"><b>📚</b><span>침실2</span></div>
          </div>
          <aside className="selectionPanel narrow">
            <h3>시작할 공간</h3>
            <div className="selectionItem"><span>🛋️</span><div><strong>거실</strong><small>23.4㎡</small></div></div>
            <div className="selectionItem"><span>🛏️</span><div><strong>안방</strong><small>14.8㎡</small></div></div>
          </aside>
        </div>
        <div className="footerButtons"><button className="ghost" onClick={closeOverlay}>닫기</button><button className="cta small" onClick={() => { closeOverlay(); navigate('layout') }}>에디터 열기</button></div>
      </div>
    </div>
  )
}

function BedsCategoryScreen({ navigate, openOverlay }) {
  return (
    <div className="screenCanvas plainBg">
      <Header active="가구 먼저 찾기" onNavigate={navigate} onOpenOverlay={openOverlay} />
      <div className="subnav">전체 · 소파 · 테이블 · 수납 · <b>침대</b> · 조명 · 패브릭</div>
      <section className="catalogWrap">
        <aside className="filterCol">
          <h3>필터</h3>
          {['사이즈', '색상', '가격대', '소재', 'AI 적합도'].map((f) => <div key={f} className="filterBox"><strong>{f}</strong><span>옵션 선택</span></div>)}
          <button className="ghost full">필터 초기화</button>
        </aside>
        <div className="catalogMain">
          <div className="catalogHero">
            <div><p className="breadcrumb">가구 먼저 찾기 / 침실 / 침대</p><h2>침대 <em>326개</em></h2><p className="muted">카테고리 탐색은 앱 내부에서 바로 상세/배치 흐름으로 이어집니다.</p></div>
            <div className="sorts"><button className="mini solid">추천순</button><button className="mini">낮은 가격순</button><button className="mini">AI 적합도</button></div>
          </div>
          <div className="productGrid3">
            {bedProducts.map((item) => (
              <article key={item.name} className="shopCard">
                <div className="shopVisual"><span className="badgeTag">{item.badge}</span><div className="wish">♡</div><div className="bigEmoji">{item.emoji}</div><div className="fitTag">{item.fit}</div></div>
                <div className="shopInfo"><small>HAVENLY SELECT</small><h4>{item.name}</h4><p>{item.review}</p><div className="priceLine"><strong>{item.price}</strong></div><button onClick={() => openOverlay('address')}>빠른 보기</button></div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function FurnitureHomeScreen({ navigate, openOverlay }) {
  return (
    <div className="screenCanvas plainBg">
      <Header active="가구 먼저 찾기" onNavigate={navigate} onOpenOverlay={openOverlay} />
      <section className="heroBanner">
        <div>
          <div className="eyebrow darkEyebrow">FURNITURE FIRST</div>
          <h2>먼저 가구를 찾고, <em>내 공간 적합도</em>를 확인하세요</h2>
          <p>홈 → 카테고리 → 배치하기 흐름이 새 페이지 로딩처럼 느껴지지 않도록, 앱 안에서 바로 전환되게 다듬었습니다.</p>
          <div className="heroActions"><button className="cta" onClick={() => navigate('beds')}>지금 둘러보기</button><button className="ghost" onClick={() => openOverlay('address')}>내 공간 연결</button></div>
        </div>
        <div className="heroCards">
          <div className="floatingCard"><span>🛋️</span><strong>웜 베이지 소파</strong><small>AI 적합도 96%</small></div>
          <div className="floatingCard lifted"><span>🛏️</span><strong>패브릭 침대</strong><small>침실 추천</small></div>
        </div>
      </section>
      <section className="aiStrip"><div><strong>AI 매칭</strong><span>내 공간 정보로 가구 사이즈/동선 적합도를 바로 확인</span></div><button className="ghost dark" onClick={() => navigate('ai')}>AI 추천 시작</button></section>
      <section className="iconCategories">
        {['소파','침대','테이블','수납','조명','패브릭'].map((name, i) => <button key={name} className={`iconCat ${i===1?'active':''}`} onClick={() => navigate(i === 1 ? 'beds' : 'home')}><div>{['🛋️','🛏️','🪑','🗄️','💡','🧺'][i]}</div><span>{name}</span></button>)}
      </section>
      <section className="collections">
        <div className="collection large"><div>🏡</div><div><strong>내추럴 리빙 컬렉션</strong><span>24 products</span></div></div>
        <div className="collection"><div>🌙</div><div><strong>호텔라이크 침실</strong></div></div>
        <div className="collection"><div>☁️</div><div><strong>소프트 모노톤</strong></div></div>
        <div className="collection"><div>🌿</div><div><strong>우드 & 플랜트</strong></div></div>
      </section>
      <section className="hScrollProducts">
        {bedProducts.slice(0,5).map((item) => <article key={item.name} className="scrollCard"><div className="bigEmoji">{item.emoji}</div><small>HAVENLY SELECT</small><strong>{item.name}</strong><span>{item.price}</span><button onClick={() => openOverlay('address')}>AI 적합도 보기</button></article>)}
      </section>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
