import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'

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

function Header({ dark = false, active = 'AI 추천' }) {
  return (
    <header className={`topbar ${dark ? 'dark' : ''}`}>
      <div className="logo">HAVENLY</div>
      <nav className="navlinks">
        {['AI 추천', '내가 배치하기', '가구 먼저 찾기'].map((item) => (
          <a key={item} className={active === item ? 'active' : ''}>{item}</a>
        ))}
      </nav>
      <div className="topActions">
        {!dark && <div className="searchPill">🔎 스타일 또는 가구 검색</div>}
        {dark && <button className="miniBtn secondary">되돌리기</button>}
        {dark && <button className="miniBtn primary">AI 추천</button>}
        <div className="cart">🛒<span>3</span></div>
      </div>
    </header>
  )
}

function App() {
  const [screen, setScreen] = React.useState('home')

  return (
    <main className="appShell">
      <section className="introHero">
        <div>
          <p className="eyebrow">HAVENLY React Conversion</p>
          <h1>HTML 레퍼런스를 React 화면들로 재구성</h1>
          <p className="subcopy">원본 HTML의 분위기와 구조를 유지하면서, GitHub Pages에 올릴 수 있는 단일 React 앱으로 정리했습니다.</p>
        </div>
        <div className="sourceNotes">
          <strong>적용한 마이그레이션 원칙</strong>
          <ul>
            <li>공통 헤더/카드/제품 UI를 컴포넌트화</li>
            <li>레이아웃 구조는 유지하고 상호작용 상태만 React state로 이동</li>
            <li>반복 제품/공간 데이터는 배열 기반 렌더링</li>
            <li>색상/간격/타이포는 CSS 토큰으로 일관화</li>
          </ul>
        </div>
      </section>

      <section className="screenNav">
        {screens.map((item) => (
          <button key={item.id} className={`screenChip ${screen === item.id ? 'active' : ''}`} onClick={() => setScreen(item.id)}>
            <span>{item.badge}</span>{item.label}
          </button>
        ))}
      </section>

      <section className="screenStage">
        {screen === 'ai' && <AiRecommendScreen />}
        {screen === 'space' && <SpaceSelectScreen />}
        {screen === 'layout' && <LayoutEditorScreen />}
        {screen === 'address' && <AddressSetupScreen />}
        {screen === 'beds' && <BedsCategoryScreen />}
        {screen === 'home' && <FurnitureHomeScreen />}
      </section>
    </main>
  )
}

function AiRecommendScreen() {
  return (
    <div className="screenCanvas warmBg">
      <Header active="AI 추천" />
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
          <button className="cta">추천받기</button>
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
                <button>담기</button>
              </article>
            ))}
          </div>
          <div className="reasonBox"><strong>AI 코멘트</strong> 채광이 좋은 거실이라 밝은 패브릭 소파와 원형 테이블을 중심으로 동선을 열어두고, 우드/베이지 톤으로 정리했습니다.</div>
        </div>
      </div>
    </div>
  )
}

function SpaceSelectScreen() {
  const items = [
    ['🛋️', '거실', '23.4㎡'], ['🍳', '주방', '11.2㎡'], ['🛏️', '안방', '14.8㎡'], ['📚', '침실/서재', '9.1㎡'], ['🛁', '욕실', '4.1㎡'], ['🚪', '현관', '3.7㎡']
  ]
  return (
    <div className="screenCanvas sandBg">
      <Header active="AI 추천" />
      <section className="cardStage">
        <div className="cardSurface">
          <div className="progressBar"><span className="fill wide" /></div>
          <p className="tinyPill">평면도 기반 선택</p>
          <h2>어떤 공간을 먼저 꾸밀까요?</h2>
          <p className="muted">원본 HTML의 평면도 선택 레이아웃을 React 카드 형태로 재구성했습니다.</p>
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
          <div className="footerButtons"><button className="ghost">이전</button><button className="cta small">다음 단계 →</button></div>
        </div>
      </section>
    </div>
  )
}

function LayoutEditorScreen() {
  return (
    <div className="screenCanvas editorBg">
      <Header dark active="내가 배치하기" />
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
        </aside>
      </section>
    </div>
  )
}

function AddressSetupScreen() {
  return (
    <div className="screenCanvas warmBg">
      <div className="overlayWrap">
        <div className="setupCard">
          <Header active="내가 배치하기" />
          <div className="setupInner">
            <div className="progressBar"><span className="fill half" /></div>
            <h2>배치하기 전에 공간 정보를 불러올게요</h2>
            <p className="muted">원본의 setup-overlay/address entry variant를 반영해 주소 검색과 평면도 섹션 선택을 분리된 오버레이 카드로 표현했습니다.</p>
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
            <div className="footerButtons"><button className="ghost">건너뛰기</button><button className="cta small">에디터 열기</button></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BedsCategoryScreen() {
  return (
    <div className="screenCanvas plainBg">
      <Header active="가구 먼저 찾기" />
      <div className="subnav">전체 · 소파 · 테이블 · 수납 · <b>침대</b> · 조명 · 패브릭</div>
      <section className="catalogWrap">
        <aside className="filterCol">
          <h3>필터</h3>
          {['사이즈', '색상', '가격대', '소재', 'AI 적합도'].map((f) => <div key={f} className="filterBox"><strong>{f}</strong><span>옵션 선택</span></div>)}
          <button className="ghost full">필터 초기화</button>
        </aside>
        <div className="catalogMain">
          <div className="catalogHero">
            <div><p className="breadcrumb">가구 먼저 찾기 / 침실 / 침대</p><h2>침대 <em>326개</em></h2><p className="muted">원본 HTML의 sticky header + 왼쪽 필터 + 3열 상품 그리드 구성을 React 버전으로 정리했습니다.</p></div>
            <div className="sorts"><button className="mini solid">추천순</button><button className="mini">낮은 가격순</button><button className="mini">AI 적합도</button></div>
          </div>
          <div className="productGrid3">
            {bedProducts.map((item) => (
              <article key={item.name} className="shopCard">
                <div className="shopVisual"><span className="badgeTag">{item.badge}</span><div className="wish">♡</div><div className="bigEmoji">{item.emoji}</div><div className="fitTag">{item.fit}</div></div>
                <div className="shopInfo"><small>HAVENLY SELECT</small><h4>{item.name}</h4><p>{item.review}</p><div className="priceLine"><strong>{item.price}</strong></div><button>빠른 보기</button></div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function FurnitureHomeScreen() {
  return (
    <div className="screenCanvas plainBg">
      <Header active="가구 먼저 찾기" />
      <section className="heroBanner">
        <div>
          <div className="eyebrow darkEyebrow">FURNITURE FIRST</div>
          <h2>먼저 가구를 찾고, <em>내 공간 적합도</em>를 확인하세요</h2>
          <p>원본 홈페이지 시안의 배너, AI 매칭 강조 바, 카테고리 아이콘, 큐레이션 카드 흐름을 하나의 React 홈 화면으로 재구성했습니다.</p>
          <button className="cta">지금 둘러보기</button>
        </div>
        <div className="heroCards">
          <div className="floatingCard"><span>🛋️</span><strong>웜 베이지 소파</strong><small>AI 적합도 96%</small></div>
          <div className="floatingCard lifted"><span>🛏️</span><strong>패브릭 침대</strong><small>침실 추천</small></div>
        </div>
      </section>
      <section className="aiStrip"><div><strong>AI 매칭</strong><span>내 공간 정보로 가구 사이즈/동선 적합도를 바로 확인</span></div><button className="ghost dark">내 공간 연결</button></section>
      <section className="iconCategories">
        {['소파','침대','테이블','수납','조명','패브릭'].map((name, i) => <div key={name} className={`iconCat ${i===1?'active':''}`}><div>{['🛋️','🛏️','🪑','🗄️','💡','🧺'][i]}</div><span>{name}</span></div>)}
      </section>
      <section className="collections">
        <div className="collection large"><div>🏡</div><div><strong>내추럴 리빙 컬렉션</strong><span>24 products</span></div></div>
        <div className="collection"><div>🌙</div><div><strong>호텔라이크 침실</strong></div></div>
        <div className="collection"><div>☁️</div><div><strong>소프트 모노톤</strong></div></div>
        <div className="collection"><div>🌿</div><div><strong>우드 & 플랜트</strong></div></div>
      </section>
      <section className="hScrollProducts">
        {bedProducts.slice(0,5).map((item) => <article key={item.name} className="scrollCard"><div className="bigEmoji">{item.emoji}</div><small>HAVENLY SELECT</small><strong>{item.name}</strong><span>{item.price}</span><button>AI 적합도 보기</button></article>)}
      </section>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
