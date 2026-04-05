import {
  applyApartmentSelection,
  buildApartmentSelectionSnapshot,
  getAddressOverlayZones,
  toggleSpaceProfileZone,
  updateSpaceProfileApartmentType,
  updateSpaceProfileQuery,
} from './space-profile-state.js'

export function SpaceSelectionBoard({ zones, selectedIds, onToggle, compact = false, panelTitle = '선택된 공간' }) {
  const chosenZones = zones.filter((zone) => selectedIds.includes(zone.id))

  return (
    <div className={`spaceLayout ${compact ? 'compact' : ''}`}>
      <div className={`planBoard ${compact ? 'small' : ''}`}>
        {!compact && <div className="compass">N</div>}
        {zones.map((zone) => (
          <button
            key={zone.id}
            className={`zone ${zone.className} ${selectedIds.includes(zone.id) ? 'selected' : ''}`}
            onClick={() => onToggle(zone.id)}
          >
            <b>{zone.icon}</b><span>{zone.name}</span>
          </button>
        ))}
      </div>
      <aside className={`selectionPanel ${compact ? 'narrow' : ''}`}>
        <h3>{panelTitle}</h3>
        {chosenZones.map((zone) => (
          <div className="selectionItem" key={zone.id}><span>{zone.icon}</span><div><strong>{zone.name}</strong><small>{zone.size}</small></div></div>
        ))}
        {!compact && <div className="selectionTotal"><span>총 선택</span><b>{chosenZones.length}개</b></div>}
      </aside>
    </div>
  )
}

export function SpaceProfileFields({
  spaceProfile,
  setSpaceProfile,
  spaceZones,
  trackBoardProgress,
  apartmentSearchResults,
  apartmentTypes,
  formatApartmentOption,
}) {
  const { apartmentLabel, apartmentMeta } = buildApartmentSelectionSnapshot({
    spaceProfile,
    apartmentSearchResults,
    formatApartmentOption,
  })

  const selectApartment = (option) => {
    setSpaceProfile((current) => applyApartmentSelection(current, option, formatApartmentOption))
  }

  const toggleZone = (zoneId) => {
    trackBoardProgress()
    setSpaceProfile((current) => toggleSpaceProfileZone(current, zoneId))
  }

  return (
    <>
      <label>아파트 또는 주소 검색</label>
      <div className="inputWrap big">🔎<input value={spaceProfile.query} onChange={(event) => setSpaceProfile((current) => updateSpaceProfileQuery(current, event.target.value))} /></div>
      <div className="chipRow preferenceRow">
        {apartmentSearchResults.map((option) => (
          <button
            key={option.id}
            className={spaceProfile.apartmentSelectionId === option.id ? 'solid' : ''}
            onClick={() => selectApartment(option)}
          >
            {formatApartmentOption(option)}
          </button>
        ))}
      </div>
      <div className="resultCard selected"><strong>{apartmentLabel}</strong><span>{apartmentMeta}</span></div>
      <div className="typeStrip">{apartmentTypes.map((type) => <button key={type} className={spaceProfile.apartmentType === type ? 'solid' : ''} onClick={() => setSpaceProfile((current) => updateSpaceProfileApartmentType(current, type))}>{type}</button>)}</div>
      <SpaceSelectionBoard
        zones={spaceZones}
        selectedIds={spaceProfile.spaces}
        onToggle={toggleZone}
        compact
        panelTitle="시작할 공간"
      />
    </>
  )
}

export function AddressSetupScreen({
  navigate,
  closeOverlay,
  spaceProfile,
  setSpaceProfile,
  trackBoardProgress,
  baseZones,
  apartmentSearchResults,
  apartmentTypes,
  formatApartmentOption,
}) {
  const overlayZones = getAddressOverlayZones(baseZones)

  return (
    <div className="setupCard">
      <div className="overlayHeader"><span>공간 정보 연결</span><button className="overlayClose" onClick={closeOverlay}>✕</button></div>
      <div className="setupInner">
        <div className="progressBar"><span className="fill half" /></div>
        <h2>배치하기 전에 공간 정보를 불러올게요</h2>
        <p className="muted">AI 추천 화면과 같은 아파트/공간 상태를 여기서 바로 바꾸면 배치 화면에도 즉시 반영됩니다.</p>
        <SpaceProfileFields
          spaceProfile={spaceProfile}
          setSpaceProfile={setSpaceProfile}
          spaceZones={overlayZones}
          trackBoardProgress={trackBoardProgress}
          apartmentSearchResults={apartmentSearchResults}
          apartmentTypes={apartmentTypes}
          formatApartmentOption={formatApartmentOption}
        />
        <div className="footerButtons"><button className="ghost" onClick={closeOverlay}>닫기</button><button className="cta small" onClick={() => { trackBoardProgress(); closeOverlay(); navigate('layout') }}>에디터 열기</button></div>
      </div>
    </div>
  )
}
