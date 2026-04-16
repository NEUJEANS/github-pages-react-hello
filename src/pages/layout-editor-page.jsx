import React from 'react'

export function LayoutEditorPage({
  navigate,
  openOverlay,
  openCart,
  cartCount,
  editor,
  addToCart,
  addressSummary,
  onOpenLogin,
  onAddProductToLayout,
  authSession,
  libraryItems,
  aiProducts,
  layoutTrayItems,
  onLayoutTrayDropToRoom,
  onLayoutTrayAbandon,
  onSaveLayoutToAccount,
  onRestoreSavedLayout,
  layoutAuthPanelState,
  isAuthBootstrapPending = false,
  buildVisibleLibrary,
  buildLibraryEmptyState,
  layoutLibraryCategoryTabs,
  buildLayoutEditorToolbarButtons,
  buildLayoutEditorInfoPills,
  buildLayoutEditorPropertyPanelState,
  buildLayoutEditorHint,
  findLibraryItemMeta,
  resolveRoomClickTarget,
  createLayoutEditorToolbarHandlers,
  createLayoutEditorActionHandlers,
  buildLayoutEditorToolbarCommands,
  buildLayoutEditorActionCommands,
  runLayoutEditorCommands,
  buildPlacedItemClassName,
  buildPlacedItemStyle,
}) {
  const selectedMeta = React.useMemo(
    () => findLibraryItemMeta(libraryItems, editor.selected?.sourceId),
    [editor.selected?.sourceId, findLibraryItemMeta, libraryItems],
  )
  const [activeCategory, setActiveCategory] = React.useState('전체')
  const [librarySearch, setLibrarySearch] = React.useState('')
  const roomFrameRef = React.useRef(null)
  const [trayDragItemId, setTrayDragItemId] = React.useState(null)

  const visibleLibrary = React.useMemo(
    () => buildVisibleLibrary(libraryItems, activeCategory, librarySearch),
    [activeCategory, buildVisibleLibrary, libraryItems, librarySearch],
  )
  const libraryEmptyState = React.useMemo(
    () => buildLibraryEmptyState(activeCategory, librarySearch),
    [activeCategory, buildLibraryEmptyState, librarySearch],
  )
  const toolbarButtons = React.useMemo(
    () => buildLayoutEditorToolbarButtons(editor.activeTool, { canUndo: editor.canUndo }),
    [buildLayoutEditorToolbarButtons, editor.activeTool, editor.canUndo],
  )
  const infoPills = React.useMemo(
    () => buildLayoutEditorInfoPills({
      snapOn: editor.snapOn,
      itemCount: editor.items.length,
    }),
    [buildLayoutEditorInfoPills, editor.items.length, editor.snapOn],
  )
  const propertyPanelState = React.useMemo(
    () => buildLayoutEditorPropertyPanelState(editor.selected, selectedMeta),
    [buildLayoutEditorPropertyPanelState, editor.selected, selectedMeta],
  )
  const editorHint = React.useMemo(
    () => buildLayoutEditorHint({ snapOn: editor.snapOn }),
    [buildLayoutEditorHint, editor.snapOn],
  )

  const handlePointerMove = React.useCallback((event) => {
    editor.updateDrag(event)
  }, [editor])

  const handlePointerUp = React.useCallback((event) => {
    if (editor.dragState && event?.pointerId === editor.dragState.pointerId) {
      roomFrameRef.current?.releasePointerCapture?.(event.pointerId)
    }
    editor.endDrag()
  }, [editor])

  const handleRoomClick = React.useCallback((event) => {
    if (event.target !== event.currentTarget) return
    if (editor.activeTool !== 'move' || editor.dragState || !editor.selected) return

    const bounds = roomFrameRef.current?.getBoundingClientRect()
    if (!bounds?.width || !bounds?.height) return

    const percentX = ((event.clientX - bounds.left) / bounds.width) * 100
    const percentY = ((event.clientY - bounds.top) / bounds.height) * 100
    const target = resolveRoomClickTarget(percentX, percentY, editor.selected)
    editor.moveSelectedTo(target.x, target.y)
  }, [editor, resolveRoomClickTarget])

  const toolbarCommandHandlers = React.useMemo(
    () => createLayoutEditorToolbarHandlers(editor),
    [createLayoutEditorToolbarHandlers, editor],
  )
  const actionCommandHandlers = React.useMemo(
    () => createLayoutEditorActionHandlers({ navigate, openOverlay, addToCart, editor, selectedMeta }),
    [addToCart, createLayoutEditorActionHandlers, editor, navigate, openOverlay, selectedMeta],
  )

  const handleTrayPointerDown = React.useCallback((product, event) => {
    if (event.button !== 0) return
    setTrayDragItemId(product.id)
  }, [])

  const handleTrayPointerUp = React.useCallback((product, event) => {
    if (trayDragItemId !== product.id) return
    setTrayDragItemId(null)
    const bounds = roomFrameRef.current?.getBoundingClientRect()
    const insideRoom = bounds
      && event.clientX >= bounds.left
      && event.clientX <= bounds.right
      && event.clientY >= bounds.top
      && event.clientY <= bounds.bottom

    if (insideRoom) {
      onLayoutTrayDropToRoom(product)
      return
    }

    onLayoutTrayAbandon(product)
  }, [onLayoutTrayAbandon, onLayoutTrayDropToRoom, trayDragItemId])

  const handleToolbarAction = React.useCallback((toolId) => {
    runLayoutEditorCommands(buildLayoutEditorToolbarCommands(toolId), toolbarCommandHandlers)
  }, [buildLayoutEditorToolbarCommands, runLayoutEditorCommands, toolbarCommandHandlers])

  const handleActionButton = React.useCallback((action) => {
    runLayoutEditorCommands(buildLayoutEditorActionCommands(action), actionCommandHandlers)
  }, [actionCommandHandlers, buildLayoutEditorActionCommands, runLayoutEditorCommands])

  const boardSummary = addressSummary?.trim() || '프로젝트 레이아웃 보드'

  const guestLayoutAuthAction = React.useMemo(() => {
    if (authSession) {
      return null
    }

    if (isAuthBootstrapPending) {
      return {
        label: '로그인 준비 중…',
        helper: '계정 연결 상태를 확인한 뒤 보드 저장 흐름을 열어드릴게요.',
        disabled: true,
        onClick: null,
      }
    }

    return {
      label: '로그인 후 보드 저장',
      helper: null,
      disabled: false,
      onClick: () => onOpenLogin({
        source: 'layout-editor',
        action: 'save-layout-draft',
        label: '로그인 후 보드 저장',
        draftLabel: boardSummary,
        returnScreen: 'layout',
      }),
    }
  }, [authSession, boardSummary, isAuthBootstrapPending, onOpenLogin])

  return (
    <div className="screenCanvas editorBg">
      <section className="heroBanner">
        <div>
          <div className="eyebrow darkEyebrow">LAYOUT EDITOR</div>
          <h2>프로젝트 레이아웃 보드</h2>
          <p>아파트 탐색/브라우징 UI를 걷어내고 실제 진행 가능한 레이아웃 편집과 계정 저장 흐름만 남겼어요.</p>
          <div className="heroActions">
            <button className="cta" onClick={() => navigate('layout')}>편집 유지</button>
            <button className="ghost" onClick={openCart}>장바구니 ({cartCount})</button>
            <button
              className="ghost"
              onClick={() => onOpenLogin({
                source: 'layout-editor-header',
                action: authSession ? 'resume-authenticated-flow' : 'save-layout-draft',
                label: authSession ? '계정 상태 확인' : '로그인 후 보드 저장',
                draftLabel: boardSummary,
                returnScreen: 'layout',
              })}
            >
              {authSession ? '계정 보기' : '로그인 / 회원가입'}
            </button>
          </div>
        </div>
      </section>
      <section className="editorLayout">
        <aside className="editorSide left">
          <div className="sideHead"><h3>가구 라이브러리</h3><input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="가구 검색" /></div>
          <div className="tabRow">
            {layoutLibraryCategoryTabs.map((tab) => <button key={tab} className={`mini ${activeCategory === tab ? 'solid' : ''}`} onClick={() => setActiveCategory(tab)}>{tab}</button>)}
          </div>
          {visibleLibrary.length > 0 ? (
            <div className="dragGrid">
              {visibleLibrary.map((item) => (
                <button key={item.id} className="dragCard buttonCard" onClick={() => onAddProductToLayout(item)}>
                  <span>{item.emoji}</span><strong>{item.name}</strong><small>{item.size}</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="emptyState compact editorLibraryEmptyState">
              <div>
                <div className="emptyEmoji">{libraryEmptyState.emoji}</div>
                <strong>{libraryEmptyState.title}</strong>
                <p>{libraryEmptyState.description}</p>
              </div>
            </div>
          )}
        </aside>
        <div className="editorCenter">
          <div className="toolbar">
            {toolbarButtons.map((tool) => (
              <button
                key={tool.id}
                className={`tool ${tool.isActive ? 'active' : ''}`}
                disabled={tool.disabled}
                onClick={() => handleToolbarAction(tool.id)}
              >
                {tool.label}
              </button>
            ))}
          </div>
          <div className="editorCanvasShell">
            <div className="editorCanvasMeta">
              <span>{boardSummary}</span>
              <button className={`metaToggle ${editor.snapOn ? 'on' : ''}`} onClick={() => editor.setSnapOn((current) => !current)}>{editor.snapOn ? '스냅 ON' : '스냅 OFF'}</button>
              <span>{editor.notice}</span>
              <span>{editorHint.description}</span>
            </div>
            <div className="editorRoomFrame">
              <div className={`editorRoom ${editor.dragState ? 'is-dragging' : ''}`}>
                <div className="grid" />
                <div
                  ref={roomFrameRef}
                  className="roomFrame"
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onLostPointerCapture={handlePointerUp}
                  onClick={handleRoomClick}
                >
                  {editor.items.map((item) => {
                    const itemMeta = findLibraryItemMeta(libraryItems, item.sourceId)
                    const isDragging = editor.dragState?.itemId === item.id
                    return (
                      <button
                        key={item.id}
                        className={buildPlacedItemClassName({
                          isSelected: editor.selectedId === item.id,
                          isCircle: item.circle,
                          isDragging,
                        })}
                        style={buildPlacedItemStyle(item, itemMeta)}
                        onClick={() => editor.setSelectedId(item.id)}
                        onPointerDown={(event) => {
                          if (event.button !== 0) return
                          const bounds = roomFrameRef.current?.getBoundingClientRect()
                          if (!bounds) return
                          event.preventDefault()
                          roomFrameRef.current?.setPointerCapture?.(event.pointerId)
                          editor.beginDrag(item.id, event, bounds)
                        }}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="infoPills">{infoPills.map((pill) => <span key={pill}>{pill}</span>)}</div>
          <div className="recommendStrip">
            {(layoutTrayItems ?? aiProducts).map((item) => (
              <button
                key={item.id}
                className={`recommendCard buttonCard ${trayDragItemId === item.id ? 'trayDragging' : ''}`}
                onPointerDown={(event) => handleTrayPointerDown(item, event)}
                onPointerUp={(event) => handleTrayPointerUp(item, event)}
              >
                <div>{item.emoji}</div><strong>{item.name}</strong><small>{item.priceLabel}</small><span>드래그해서 배치 · 밖으로 놓으면 제외</span>
              </button>
            ))}
          </div>
        </div>
        <aside className="editorSide right">
          <div className="sideHead"><h3>속성 패널</h3></div>
          <div className="propBlock"><label>선택 오브젝트</label><strong>{propertyPanelState.selectionSnapshot.selectedName}</strong></div>
          <div className="propBlock"><label>위치</label><div className="split"><span>X {propertyPanelState.selectionSnapshot.position.x}</span><span>Y {propertyPanelState.selectionSnapshot.position.y}</span></div></div>
          <div className="propBlock"><label>컬러</label><div className="colorDots">{propertyPanelState.colorOptions.map((option) => <button key={option.color} className={`colorDot ${option.isActive ? 'active' : ''}`} style={{ background: option.color }} onClick={() => editor.setSelectedColor(option.index)} />)}</div><button className="ghost full" onClick={editor.cycleColor}>컬러 바꾸기</button></div>
          <div className="propBlock"><label>배치 메모</label><p>{propertyPanelState.selectionSnapshot.selectedBlurb}</p></div>
          <div className="propBlock">
            <label>계정 보드</label>
            {!layoutAuthPanelState?.isAuthenticated ? (
              <p>로그인하면 현재 배치를 계정 저장본으로 이어서 보관할 수 있어요.</p>
            ) : (
              <>
                {layoutAuthPanelState.savedBoardSummary && <strong>{layoutAuthPanelState.savedBoardSummary}</strong>}
                {layoutAuthPanelState.currentBoardSummary && layoutAuthPanelState.hasSavedBoard && (
                  <p>{layoutAuthPanelState.currentBoardSummary}</p>
                )}
                {layoutAuthPanelState.savedBoardContextCopy && (
                  <p>저장 기준 · {layoutAuthPanelState.savedBoardContextCopy}</p>
                )}
                {!layoutAuthPanelState.savedBoardContextCopy && layoutAuthPanelState.currentBoardContextCopy && (
                  <p>{layoutAuthPanelState.currentBoardContextCopy}</p>
                )}
                {layoutAuthPanelState.savedBoardContextCopy && layoutAuthPanelState.currentBoardContextCopy && !layoutAuthPanelState.boardContextMatches && (
                  <p>현재 기준 · {layoutAuthPanelState.currentBoardContextCopy}</p>
                )}
                {layoutAuthPanelState.boardComparisonCopy && <p>{layoutAuthPanelState.boardComparisonCopy}</p>}
                {layoutAuthPanelState.lastSavedAtLabel && <p>{layoutAuthPanelState.lastSavedAtLabel}</p>}
                {layoutAuthPanelState.message && <p>{layoutAuthPanelState.message}</p>}
              </>
            )}
          </div>
          <div className="propBlock actionBlock">
            {guestLayoutAuthAction && (
              <>
                <button
                  className="ghost"
                  disabled={guestLayoutAuthAction.disabled}
                  aria-disabled={guestLayoutAuthAction.disabled}
                  onClick={guestLayoutAuthAction.onClick ?? undefined}
                >
                  {guestLayoutAuthAction.label}
                </button>
                {guestLayoutAuthAction.helper && <p>{guestLayoutAuthAction.helper}</p>}
              </>
            )}
            {authSession && (
              <>
                <button className="cta" disabled={layoutAuthPanelState?.saveDisabled} onClick={onSaveLayoutToAccount}>
                  {layoutAuthPanelState?.saveButtonLabel ?? '현재 배치 계정에 저장'}
                </button>
                {layoutAuthPanelState?.restoreButtonLabel && (
                  <button className="ghost" disabled={layoutAuthPanelState.restoreDisabled} onClick={onRestoreSavedLayout}>
                    {layoutAuthPanelState.restoreButtonLabel}
                  </button>
                )}
              </>
            )}
            {propertyPanelState.actionButtons.map((button) => (
              <button
                key={button.id}
                className={button.tone}
                disabled={button.disabled}
                onClick={() => handleActionButton(button.action)}
              >
                {button.label}
              </button>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}
