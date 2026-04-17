import React from 'react'

import {
  buildFurnitureBrowseCategories,
  buildFurnitureBrowseItems,
} from '../components/furniture-browse-state.js'

function ProductCard({
  item,
  isWishlisted,
  onToggleWishlist,
  addToCart,
  onAddProductToLayout,
  compact = false,
}) {
  return (
    <article className={compact ? 'scrollCard' : 'shopCard'}>
      <div className="shopVisual">
        {!compact && <span className="badgeTag">FIT {item.fitScore}%</span>}
        {onToggleWishlist && (
          <button
            className={`wish ${isWishlisted ? 'active' : ''}`}
            onClick={() => onToggleWishlist(item.id)}
            aria-label={isWishlisted ? `${item.name} 찜 해제` : `${item.name} 찜 추가`}
          >
            {isWishlisted ? '♥' : '♡'}
          </button>
        )}
        <div className="bigEmoji">{item.emoji}</div>
        {!compact && <div className="fitTag">{item.category}</div>}
      </div>
      <div className={compact ? '' : 'shopInfo'}>
        <small>HAVENLY SELECT</small>
        <strong>{item.name}</strong>
        <span>{item.priceLabel}</span>
        <p>{item.blurb}</p>
        <div className="cardActions">
          <button onClick={() => onAddProductToLayout(item)}>보드에 배치</button>
          <button className="ghost minor" onClick={() => addToCart(item)}>장바구니 담기</button>
        </div>
      </div>
    </article>
  )
}

function BrowseHeroCard({ item, actionLabel, onAction }) {
  return (
    <div className="floatingCard">
      <span>{item.emoji}</span>
      <strong>{item.name}</strong>
      <small>{item.category} · 적합도 {item.fitScore}%</small>
      <button className="ghost minor" onClick={onAction}>{actionLabel}</button>
    </div>
  )
}

export function FurnitureHomePage({
  navigate,
  openCart,
  cartCount,
  onOpenLogin,
  authSession,
  addToCart,
  onAddProductToLayout,
  libraryItems,
  aiProducts,
  wishlistedIds,
  onToggleWishlist,
}) {
  const categories = React.useMemo(() => buildFurnitureBrowseCategories(libraryItems), [libraryItems])
  const featuredProducts = React.useMemo(() => libraryItems.slice(0, 4), [libraryItems])
  const browseStripItems = React.useMemo(() => libraryItems.slice(0, 5), [libraryItems])
  const heroItems = React.useMemo(() => {
    const fallback = libraryItems.slice(0, 2)
    return [aiProducts?.[0] ?? fallback[0], aiProducts?.[1] ?? fallback[1]].filter(Boolean)
  }, [aiProducts, libraryItems])

  return (
    <div className="screenCanvas plainBg">
      <section className="heroBanner">
        <div>
          <div className="eyebrow darkEyebrow">FURNITURE FIRST</div>
          <h2>가구를 먼저 둘러보고, <em>바로 배치</em>하세요</h2>
          <p>아파트 평면도 탐색은 걷어내고, 가구 발견 → 선택 → 레이아웃 보드 배치 흐름만 다시 전면에 복구했습니다.</p>
          <div className="heroActions">
            <button className="cta" onClick={() => navigate('beds')}>가구 둘러보기</button>
            <button className="ghost" onClick={() => navigate('layout')}>레이아웃 보드 열기</button>
            <button className="ghost" onClick={openCart}>장바구니 보기 ({cartCount})</button>
            <button
              className="ghost"
              onClick={() => onOpenLogin({
                source: 'furniture-home-page',
                action: 'resume-authenticated-flow',
                label: '가구 탐색 이어가기',
                draftLabel: '가구 탐색 세션',
                returnScreen: 'home',
              })}
            >
              {authSession ? '계정 보기' : '로그인 / 회원가입'}
            </button>
          </div>
        </div>
        <div className="heroCards">
          {heroItems.map((item, index) => (
            <BrowseHeroCard
              key={item.id}
              item={item}
              actionLabel={index === 0 ? '보드에 배치' : '카탈로그 보기'}
              onAction={() => (index === 0 ? onAddProductToLayout(item) : navigate('beds'))}
            />
          ))}
        </div>
      </section>

      <section className="aiStrip">
        <div>
          <strong>복구된 핵심 흐름</strong>
          <span>가구 탐색, 찜/장바구니, 그리고 레이아웃 보드 배치만 유지합니다.</span>
        </div>
        <button className="ghost dark" onClick={() => navigate('layout')}>편집 보드로 이동</button>
      </section>

      <section className="iconCategories">
        {categories.map((category, index) => (
          <button
            key={category}
            className={`iconCat ${index === 0 ? 'active' : ''}`}
            onClick={() => navigate('beds')}
          >
            <div>{['🪄', '🛋️', '🪑', '🗄️', '💡', '🪴'][index % 6]}</div>
            <span>{category}</span>
          </button>
        ))}
      </section>

      <section className="collections">
        <button className="collection large buttonCard" onClick={() => navigate('beds')}>
          <div>🛍️</div>
          <div><strong>전체 가구 카탈로그</strong><span>{libraryItems.length} products</span></div>
        </button>
        <button className="collection buttonCard" onClick={() => navigate('layout')}>
          <div>🛠️</div>
          <div><strong>보드에서 바로 배치</strong></div>
        </button>
        <button
          className="collection buttonCard"
          onClick={() => onOpenLogin({
            source: 'furniture-home-page-collection',
            action: 'resume-authenticated-flow',
            label: '찜한 가구 이어보기',
            draftLabel: '가구 찜 컬렉션',
            returnScreen: 'home',
          })}
        >
          <div>♥</div>
          <div><strong>{authSession ? '계정 찜/상태 보기' : '로그인 후 찜 이어보기'}</strong></div>
        </button>
        <button className="collection buttonCard" onClick={openCart}>
          <div>🛒</div>
          <div><strong>장바구니 다시 보기</strong></div>
        </button>
      </section>

      <section className="productGrid3" style={{ padding: '0 32px 24px' }}>
        {featuredProducts.map((item) => (
          <ProductCard
            key={item.id}
            item={item}
            isWishlisted={wishlistedIds.includes(item.id)}
            onToggleWishlist={onToggleWishlist}
            addToCart={addToCart}
            onAddProductToLayout={onAddProductToLayout}
          />
        ))}
      </section>

      <section className="hScrollProducts">
        {browseStripItems.map((item) => (
          <ProductCard
            key={item.id}
            item={item}
            compact
            isWishlisted={wishlistedIds.includes(item.id)}
            onToggleWishlist={onToggleWishlist}
            addToCart={addToCart}
            onAddProductToLayout={onAddProductToLayout}
          />
        ))}
      </section>
    </div>
  )
}

export function BedsCategoryPage({
  navigate,
  openCart,
  cartCount,
  addToCart,
  onAddProductToLayout,
  libraryItems,
  wishlistedIds,
  onToggleWishlist,
  onOpenLogin,
  authSession,
}) {
  const categories = React.useMemo(() => buildFurnitureBrowseCategories(libraryItems), [libraryItems])
  const [activeCategory, setActiveCategory] = React.useState('전체')
  const [query, setQuery] = React.useState('')

  const visibleItems = React.useMemo(
    () => buildFurnitureBrowseItems(libraryItems, { activeCategory, query }),
    [activeCategory, libraryItems, query],
  )

  return (
    <div className="screenCanvas plainBg">
      <div className="subnav">가구 둘러보기 · 검색 · 선택 · 보드 배치</div>
      <section className="catalogWrap">
        <aside className="filterCol">
          <h3>가구 탐색</h3>
          <div className="inputWrap compactInput">
            🔎
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="가구명/카테고리/설명 검색"
            />
          </div>
          <div className="filterBox">
            <strong>카테고리</strong>
            <div className="filterChips">
              {categories.map((category) => (
                <button
                  key={category}
                  className={activeCategory === category ? 'solid mini' : 'mini'}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="filterBox">
            <strong>바로가기</strong>
            <div className="filterChips">
              <button className="mini" onClick={() => navigate('home')}>홈</button>
              <button className="mini" onClick={() => navigate('layout')}>레이아웃 보드</button>
              <button className="mini" onClick={openCart}>장바구니 ({cartCount})</button>
            </div>
          </div>
          <button
            className="ghost full"
            onClick={() => {
              setActiveCategory('전체')
              setQuery('')
            }}
          >
            탐색 초기화
          </button>
          <button
            className="ghost full"
            onClick={() => onOpenLogin({
              source: 'furniture-catalog-page',
              action: 'resume-authenticated-flow',
              label: '가구 탐색 이어가기',
              draftLabel: activeCategory === '전체' ? '가구 카탈로그' : `${activeCategory} 탐색`,
              returnScreen: 'beds',
            })}
          >
            {authSession ? '계정 보기' : '로그인 / 회원가입'}
          </button>
        </aside>

        <div className="catalogMain">
          <div className="catalogHero">
            <div>
              <p className="breadcrumb">FURNITURE / CATALOG</p>
              <h2>가구 카탈로그 <em>{visibleItems.length}개</em></h2>
              <p className="muted">아파트 탐색 없이 가구만 고르고 바로 보드에 배치할 수 있어요.</p>
            </div>
            <div className="sorts">
              <button className="mini" onClick={() => navigate('home')}>홈으로</button>
              <button className="mini" onClick={() => navigate('layout')}>배치 보드 열기</button>
            </div>
          </div>

          {!visibleItems.length ? (
            <div className="emptyState">
              <div className="emptyEmoji">🪄</div>
              <strong>조건에 맞는 가구가 없어요</strong>
              <p>검색어를 비우거나 다른 카테고리를 선택해 보세요.</p>
            </div>
          ) : (
            <div className="productGrid3">
              {visibleItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  isWishlisted={wishlistedIds.includes(item.id)}
                  onToggleWishlist={onToggleWishlist}
                  addToCart={addToCart}
                  onAddProductToLayout={onAddProductToLayout}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
