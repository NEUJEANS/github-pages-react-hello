import React from 'react'

export function AiRecommendPage({
  Header,
  navigate,
  openOverlay,
  openCart,
  cartCount,
  onSearchOpen,
  addToCart,
  form,
  setForm,
  brief,
  summary,
  selectedSpaceSummary,
  onRecommend,
  onApplyToLayout,
  onOpenLogin,
  authSession,
  roomOptions,
  styleOptions,
  priorityOptions,
  lifestyleOptions,
  apartmentSearchResults,
  aiProducts,
}) {
  const availableRooms = selectedSpaceSummary.availableRooms ?? roomOptions
  const unavailableRoomCount = roomOptions.length - availableRooms.length
  const roomHint = unavailableRoomCount > 0
    ? `연결된 공간 프로필에 맞춰 ${availableRooms.join(' · ')} 추천만 바로 선택할 수 있어요.`
    : '연결된 공간 프로필과 AI 추천 방 선택이 같은 상태로 유지돼요.'
  const currentStyle = styleOptions.find((item) => item.id === form.style)
  const selectedApartment = apartmentSearchResults.find((item) => item.id === form.apartmentSelectionId)
  const apartmentLabel = brief.apartmentLabel || '아파트명을 선택해보세요'
  const apartmentMeta = brief.apartmentMeta || `전용 84㎡ · ${form.apartmentType} · 4Bay · 거실 확장형`

  return (
    <div className="screenCanvas warmBg">
      <Header active="AI 추천" onNavigate={navigate} onOpenOverlay={openOverlay} onOpenCart={openCart} cartCount={cartCount} onSearchOpen={onSearchOpen} onOpenLogin={onOpenLogin} authSession={authSession} />
      <div className="twoCol">
        <aside className="panel leftPanel">
          <h2>AI가 공간에 맞는 가구를 추천해드릴게요</h2>
          <label>아파트 검색</label>
          <button
            type="button"
            className="searchSelectButton"
            onClick={() => openOverlay('address')}
          >
            <span className="searchSelectIcon" aria-hidden="true">🔎</span>
            <span className="searchSelectText">
              <strong>{apartmentLabel}</strong>
              <small>아파트명 또는 평면도를 선택해 공간 정보를 불러오세요</small>
            </span>
            <span className="searchSelectAction">불러오기</span>
          </button>
          <div className="resultCard">
            <strong>{selectedApartment ? (<><span className="apartmentBrand">{selectedApartment.brand}</span> <span>{selectedApartment.complex}</span></>) : apartmentLabel}</strong>
            <span>{apartmentMeta}</span>
          </div>
          <div className="spaceProfileCard">
            <div className="spaceProfileCardHead">
              <div>
                <strong>연결된 공간 프로필</strong>
                <p>{selectedSpaceSummary.caption}</p>
              </div>
              <button className="ghost minor" onClick={() => openOverlay('address')}>수정</button>
            </div>
            <div className="spaceProfileChips">
              {selectedSpaceSummary.chips.map((zone) => (
                <span key={zone.id} className="spaceProfileChip">{zone.icon} {zone.name}</span>
              ))}
            </div>
          </div>
          <label>공간 선택</label>
          <div className="chipRow roomChipRow">
            {roomOptions.map((room) => {
              const isAvailable = availableRooms.includes(room)
              return (
                <button
                  key={room}
                  className={form.room === room ? 'solid' : ''}
                  disabled={!isAvailable}
                  aria-disabled={!isAvailable}
                  title={isAvailable ? `${room} 추천 보기` : '현재 연결된 공간 프로필에 없는 공간이에요.'}
                  onClick={() => {
                    if (!isAvailable) return
                    setForm((current) => ({ ...current, room }))
                  }}
                >
                  {room}
                </button>
              )
            })}
          </div>
          <p className="muted">{roomHint}</p>
          <label>선호 스타일</label>
          <div className="styleGrid">
            {styleOptions.map((style) => (
              <button key={style.id} className={`styleBox ${form.style === style.id ? 'selected' : ''}`} onClick={() => setForm((current) => ({ ...current, style: style.id }))}>
                <span>{style.emoji}</span>{style.label}
              </button>
            ))}
          </div>
          <label>우선 기준</label>
          <div className="chipRow preferenceRow">
            {priorityOptions.map((option) => (
              <button
                key={option.id}
                className={form.priority === option.id ? 'solid' : ''}
                onClick={() => setForm((current) => ({ ...current, priority: option.id }))}
              >
                {option.label}
              </button>
            ))}
          </div>
          <label>라이프스타일</label>
          <div className="chipRow preferenceRow">
            {lifestyleOptions.map((item) => {
              const isSelected = form.lifestyle.includes(item)
              return (
                <button
                  key={item}
                  className={isSelected ? 'solid' : ''}
                  onClick={() => setForm((current) => {
                    if (item === '기본') {
                      return { ...current, lifestyle: ['기본'] }
                    }

                    const nextLifestyle = current.lifestyle.filter((value) => value !== '기본')
                    const updated = isSelected
                      ? nextLifestyle.filter((value) => value !== item)
                      : [...nextLifestyle, item]

                    return {
                      ...current,
                      lifestyle: updated.length ? updated : ['기본'],
                    }
                  })}
                >
                  {item}
                </button>
              )
            })}
          </div>
          <label>추가 요청</label>
          <textarea value={form.extraRequest} onChange={(event) => setForm((current) => ({ ...current, extraRequest: event.target.value }))} />
          <div className="footerButtons stackOnMobile aiFooterButtons">
            <button className="cta" onClick={onRecommend}>추천받기</button>
          </div>
        </aside>
        <div className="panel resultPanel">
          <div className="badge">AI 추천 결과</div>
          <h3>{form.room} 배치안 + 상품 추천</h3>
          <p className="resultSummary"><b>{currentStyle?.label}</b> 무드 기준 · {summary}</p>
          <div className="resultInputMeta">
            <span>{brief.priorityLabel}</span>
            <span>{brief.lifestyleLabel}</span>
            <span>{brief.apartmentMeta}</span>
          </div>
          <div className="floorplanViewport">
            <div className="floorplanFrame">
              <div className={`floorplan theme-${form.style}`}>
                <div className="grid" />
                <div className="roomBorder">
                  <div className="windowMark">창문</div>
                  <div className="doorMark">현관</div>
                  <div className="furn sofa">{form.room === '침실' ? '침대' : '3인 소파'}</div>
                  <div className="furn rug">러그</div>
                  <div className="furn table">테이블</div>
                  <div className="furn tv">TV장</div>
                </div>
              </div>
            </div>
          </div>
          <div className="productRow">
            {aiProducts.map((item) => (
              <article key={item.id} className="productMini">
                <div className="emojiCard">{item.emoji}</div>
                <strong>{item.name}</strong>
                <span>{item.priceLabel}</span>
                <small>적합도 {item.fitScore}%</small>
                <div className="cardActions two">
                  <button className="ghost minor" onClick={() => addToCart(item)}>담기</button>
                  <button onClick={() => onApplyToLayout(item)}>배치에 담기</button>
                </div>
              </article>
            ))}
          </div>
          <div className="reasonBox"><strong>AI 코멘트</strong> {summary}</div>
        </div>
      </div>
    </div>
  )
}

export function SpaceSelectPage({ Header, navigate, openOverlay, openCart, cartCount, onSearchOpen, selectedSpaces, setSelectedSpaces, onOpenLogin, authSession, SpaceSelectionBoard, baseZones, toggleRequiredSelection }) {
  return (
    <div className="screenCanvas sandBg">
      <Header active="AI 추천" onNavigate={navigate} onOpenOverlay={openOverlay} onOpenCart={openCart} cartCount={cartCount} onSearchOpen={onSearchOpen} onOpenLogin={onOpenLogin} authSession={authSession} />
      <section className="cardStage">
        <div className="cardSurface">
          <h2>어떤 공간을 먼저 꾸밀까요?</h2>
          <SpaceSelectionBoard
            zones={baseZones}
            selectedIds={selectedSpaces}
            onToggle={(zoneId) => setSelectedSpaces((current) => toggleRequiredSelection(current, zoneId))}
          />
          <div className="footerButtons">
            <button className="ghost" onClick={() => navigate('ai')}>이전</button>
            <button className="cta small" onClick={() => navigate('layout')}>다음 단계 →</button>
          </div>
        </div>
      </section>
    </div>
  )
}
