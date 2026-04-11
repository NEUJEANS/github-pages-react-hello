import React from 'react'

export function BedsCategoryPage({ Header, navigate, openOverlay, openCart, cartCount, onSearchOpen, quickViewOpen, addToCart, filters, setFilters, items, wishlistedIds, toggleWishlist, onOpenLogin, authSession }) {
  const filterGroups = {
    size: ['전체', '슈퍼싱글', '퀸', '킹'],
    color: ['전체', '아이보리', '베이지', '우드', '그레이'],
    material: ['전체', '패브릭', '원목', '리넨', '합성패브릭'],
    fit: ['전체', '85', '90'],
  }

  return (
    <div className="screenCanvas plainBg">
      <Header active="가구 먼저 찾기" onNavigate={navigate} onOpenOverlay={openOverlay} onOpenCart={openCart} cartCount={cartCount} onSearchOpen={onSearchOpen} onOpenLogin={onOpenLogin} authSession={authSession} />
      <div className="subnav">전체 · 소파 · 테이블 · 수납 · <b>침대</b> · 조명 · 패브릭</div>
      <section className="catalogWrap">
        <aside className="filterCol">
          <h3>필터</h3>
          <div className="inputWrap compactInput">🔎<input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="제품명/색상 검색" /></div>
          {Object.entries(filterGroups).map(([key, options]) => (
            <div key={key} className="filterBox">
              <strong>{key === 'fit' ? 'AI 적합도' : key === 'size' ? '사이즈' : key === 'color' ? '색상' : '소재'}</strong>
              <div className="filterChips">
                {options.map((option) => (
                  <button key={option} className={filters[key] === option ? 'solid mini' : 'mini'} onClick={() => setFilters((current) => ({ ...current, [key]: option }))}>{key === 'fit' && option !== '전체' ? `${option}%+` : option}</button>
                ))}
              </div>
            </div>
          ))}
          <button className="ghost full" onClick={() => setFilters({ search: '', sorts: 'recommended', size: '전체', color: '전체', material: '전체', fit: '전체' })}>필터 초기화</button>
        </aside>
        <div className="catalogMain">
          <div className="catalogHero">
            <div><p className="breadcrumb">가구 먼저 찾기 / 침실 / 침대</p><h2>침대 <em>{items.length}개</em></h2><p className="muted">검색, 필터, 정렬, 찜, 빠른 보기까지 프론트 상태로 연결해 두었습니다.</p></div>
            <div className="sorts"><button className={`mini ${filters.sorts === 'recommended' ? 'solid' : ''}`} onClick={() => setFilters((current) => ({ ...current, sorts: 'recommended' }))}>추천순</button><button className={`mini ${filters.sorts === 'priceLow' ? 'solid' : ''}`} onClick={() => setFilters((current) => ({ ...current, sorts: 'priceLow' }))}>낮은 가격순</button><button className={`mini ${filters.sorts === 'fit' ? 'solid' : ''}`} onClick={() => setFilters((current) => ({ ...current, sorts: 'fit' }))}>AI 적합도</button></div>
          </div>
          <div className="productGrid3">
            {items.map((item) => (
              <article key={item.id} className="shopCard">
                <div className="shopVisual"><span className="badgeTag">{item.badge}</span><button className={`wish ${wishlistedIds.includes(item.id) ? 'active' : ''}`} onClick={() => toggleWishlist(item.id)}>{wishlistedIds.includes(item.id) ? '♥' : '♡'}</button><div className="bigEmoji">{item.emoji}</div><div className="fitTag">{item.fit}</div></div>
                <div className="shopInfo"><small>HAVENLY SELECT</small><h4>{item.name}</h4><p>{item.review} · {item.color} · {item.material}</p><div className="priceLine"><strong>{item.priceLabel}</strong></div><div className="cardActions"><button onClick={() => quickViewOpen(item)}>빠른 보기</button><button className="ghost minor" onClick={() => addToCart(item)}>담기</button></div></div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export function FurnitureHomePage({ Header, navigate, openOverlay, openCart, cartCount, onSearchOpen, addToCart, onOpenLogin, trackBoardProgress, authSession, aiProducts, bedProducts }) {
  return (
    <div className="screenCanvas plainBg">
      <Header active="가구 먼저 찾기" onNavigate={navigate} onOpenOverlay={openOverlay} onOpenCart={openCart} cartCount={cartCount} onSearchOpen={onSearchOpen} onOpenLogin={onOpenLogin} authSession={authSession} />
      <section className="heroBanner">
        <div>
          <div className="eyebrow darkEyebrow">FURNITURE FIRST</div>
          <h2>먼저 가구를 찾고, <em>내 공간 적합도</em>를 확인하세요</h2>
          <p>가구를 먼저 둘러보고 내 공간에 바로 연결해보세요.</p>
          <div className="heroActions"><button className="cta" onClick={() => navigate('beds')}>지금 둘러보기</button><button className="ghost" onClick={() => { trackBoardProgress(); openOverlay('address') }}>내 공간 연결</button></div>
        </div>
        <div className="heroCards">
          <div className="floatingCard"><span>🛋️</span><strong>웜 베이지 소파</strong><small>AI 적합도 96%</small><button className="ghost minor" onClick={() => addToCart(aiProducts[0])}>담기</button></div>
          <div className="floatingCard lifted"><span>🛏️</span><strong>패브릭 침대</strong><small>침실 추천</small><button className="ghost minor" onClick={() => navigate('beds')}>보러가기</button></div>
        </div>
      </section>
      <section className="aiStrip"><div><strong>AI 매칭</strong><span>내 공간 정보로 가구 사이즈/동선 적합도를 바로 확인</span></div><button className="ghost dark" onClick={() => navigate('ai')}>AI 추천 시작</button></section>
      <section className="iconCategories">
        {['소파','침대','테이블','수납','조명','패브릭'].map((name, i) => <button key={name} className={`iconCat ${i===1?'active':''}`} onClick={() => navigate(i === 1 ? 'beds' : 'home')}><div>{['🛋️','🛏️','🪑','🗄️','💡','🧺'][i]}</div><span>{name}</span></button>)}
      </section>
      <section className="collections">
        <button className="collection large buttonCard" onClick={() => navigate('ai')}><div>🏡</div><div><strong>내추럴 리빙 컬렉션</strong><span>24 products</span></div></button>
        <button className="collection buttonCard" onClick={() => navigate('beds')}><div>🌙</div><div><strong>호텔라이크 침실</strong></div></button>
        <button className="collection buttonCard" onClick={() => { trackBoardProgress(); openOverlay('address') }}><div>☁️</div><div><strong>소프트 모노톤</strong></div></button>
        <button className="collection buttonCard" onClick={() => navigate('layout')}><div>🌿</div><div><strong>우드 & 플랜트</strong></div></button>
      </section>
      <section className="hScrollProducts">
        {bedProducts.slice(0,5).map((item) => <article key={item.id} className="scrollCard"><div className="bigEmoji">{item.emoji}</div><small>HAVENLY SELECT</small><strong>{item.name}</strong><span>{item.priceLabel}</span><button onClick={() => addToCart(item)}>장바구니 담기</button></article>)}
      </section>
    </div>
  )
}
