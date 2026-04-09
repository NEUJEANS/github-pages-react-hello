import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  AddressSetupScreen,
  SpaceSelectionBoard,
} from './components/space-profile.jsx'
import { toggleRequiredSelection } from './components/space-profile-state.js'
import {
  buildInputBrief,
  buildRecommendationSummary,
} from './components/ai-recommendation-state.js'
import { buildSelectedSpaceSummary } from './components/space-summary.js'
import { buildLoginGuardSnapshot } from './components/login-guard.js'
import { buildSearchDrawerState } from './components/search-drawer.js'
import {
  buildAuthContinuationPlan,
  buildAuthErrorSummary,
  buildAuthResultSummary,
  buildAuthStatusCopy,
  buildAuthSubmitPlan,
  buildGuestDraftSnapshot,
} from './components/auth-flow-state.js'
import { readAuthPending, readAuthSession, signOutAuthSession, submitAuthContinuationPlan, submitAuthLoginPlan, submitAuthSignupPlan } from './components/auth-submit.js'
import { resolveAuthConfig } from './components/auth-config.js'
import {
  buildAuthConnectionSummary,
  buildAuthReadyState,
  buildAuthResumeState,
  buildPersistedAuthHandoff,
  buildSerializableAuthContinuation,
  buildSerializableAuthContinuationFields,
  buildSerializableAuthIntent,
  buildPersistedAuthSession,
  clearPersistedAuthHandoff,
  clearPersistedAuthSession,
  createAuthHandoffId,
  persistAuthHandoff,
  persistAuthSession,
  readPersistedAuthHandoff,
  readPersistedAuthSession,
} from './components/auth-storage.js'
import { buildAuthGuardPanelState, buildAuthReadyPanelState, buildAuthSessionNotice, shouldAutoOpenAuthReadyPanel } from './components/auth-session-view-state.js'
import { buildPostAuthContinuityPatch } from './components/auth-session-merge.js'
import { buildPostAuthSessionRestorePatch, shouldApplyPostAuthSessionRestore } from './components/auth-session-restore.js'
import { shouldPreservePersistedAuthSessionOnBootstrapFailure } from './components/auth-bootstrap-state.js'
import {
  canResumePostAuthIntent,
  resolvePostAuthScreen,
  shouldAttachDraftSaveToAuthContinuation,
  shouldCloseLoginModalAfterAuth,
  shouldSubmitContinuationBeforeResume,
} from './components/auth-intent-state.js'
import { buildFilteredBedProducts } from './components/bed-filter-state.js'
import { toggleWishlistId } from './components/wishlist-state.js'
import {
  addCartItem,
  buildCartTotals,
  updateCartItemQty,
} from './components/cart-state.js'
import {
  buildLayoutAddressSummary,
  buildRecommendationContext,
  buildSelectedApartment,
  resolveAiRoomSelection,
} from './components/app-state.js'
import {
  buildPlacedLibraryItem,
  resolveAnimatedTarget,
  resolveDragPosition,
  resolveMovedItemPosition,
  resolveRoomClickTarget,
  stepToward,
} from './components/editor-state.js'
import {
  buildNavigationHash,
  getDirectionalTransition,
  parseHashState,
} from './components/navigation-state.js'
import {
  buildLayoutProduct,
  resolveQuickViewProduct,
  resolveSearchPickMode,
} from './components/product-flow-state.js'
import {
  buildLayoutEditorActionCommands,
  buildLayoutEditorHint,
  buildLayoutEditorInfoPills,
  buildLayoutEditorPropertyPanelState,
  buildLayoutEditorToolbarButtons,
  buildLayoutEditorToolbarCommands,
  buildPlacedItemClassName,
  buildPlacedItemStyle,
  findLibraryItemMeta,
} from './components/layout-editor-view-state.js'
import { runLayoutEditorCommands } from './components/layout-editor-command-runner.js'
import {
  createLayoutEditorActionHandlers,
  createLayoutEditorToolbarHandlers,
} from './components/layout-editor-command-handlers.js'
import {
  buildLibraryEmptyState,
  buildVisibleLibrary,
  layoutLibraryCategoryTabs,
} from './components/layout-library-state.js'
import './styles.css'

const initialEngagement = {
  aiRequests: 0,
  furniturePlacements: 0,
  draftBoards: 0,
}

const initialAiForm = {
  room: '거실',
  style: 'minimal',
  priority: 'flow',
  lifestyle: ['기본'],
  extraRequest: '',
}

const initialAuthContinuationFields = {
  displayName: '',
  phone: '',
  verificationCode: '',
}

function buildAuthContinuationFieldState(fields = null) {
  return {
    ...initialAuthContinuationFields,
    ...(buildSerializableAuthContinuationFields(fields) ?? {}),
  }
}

function pickPersistedAuthContinuationFields(continuation = null, fields = null) {
  const nextAction = typeof continuation?.nextAction === 'string' ? continuation.nextAction.trim() : ''
  if (nextAction !== 'complete-profile' && nextAction !== 'verify-email') return null
  return buildSerializableAuthContinuationFields(fields)
}

const roomOptions = ['거실', '침실', '주방', '서재']
const styleOptions = [
  { id: 'minimal', emoji: '🤍', label: '미니멀' },
  { id: 'natural', emoji: '🌿', label: '내추럴' },
  { id: 'lux', emoji: '✨', label: '모던 럭스' },
]

const priorityOptions = [
  { id: 'flow', label: '채광/동선 우선' },
  { id: 'storage', label: '수납 우선' },
  { id: 'hosting', label: '손님맞이 우선' },
]

const lifestyleOptions = ['기본', '재택근무', '반려동물', '수납 많이']

const aiProducts = [
  { id: 'sofa-001', category: '소파', emoji: '🛋️', name: '코튼베이지 모듈 소파', price: 1290000, priceLabel: '₩1,290,000', fitScore: 96, blurb: '동선 확보가 쉬운 모듈형 구성이에요.', size: '2200 x 900', colors: ['#eee2d1', '#d4c0a7', '#bda488', '#8b7355'] },
  { id: 'table-001', category: '테이블', emoji: '🪑', name: '오벌 우드 테이블', price: 389000, priceLabel: '₩389,000', fitScore: 92, blurb: '거실과 다이닝을 유연하게 연결해줘요.', size: '1200 x 800', colors: ['#efe4d5', '#d7c0a3', '#a88c68'] },
  { id: 'plant-001', category: '소품', emoji: '🪴', name: '세라믹 플로어 플랜트', price: 89000, priceLabel: '₩89,000', fitScore: 88, blurb: '밝은 톤 공간에 생기를 더하는 포인트예요.', size: '450 x 450', colors: ['#dfe7d8', '#c6d9b8', '#97b17e'] },
]

const libraryItems = [
  ...aiProducts,
  { id: 'tv-001', category: '수납', emoji: '📺', name: '슬림 TV 콘솔', price: 540000, priceLabel: '₩540,000', fitScore: 84, blurb: '벽면 배치에 안정적인 저상형 수납장.', size: '1800 x 400', colors: ['#f2ede5', '#d8ccb8', '#8c7354'] },
  { id: 'mirror-001', category: '소품', emoji: '🪞', name: '아치형 스탠드 미러', price: 219000, priceLabel: '₩219,000', fitScore: 79, blurb: '채광을 반사해 공간이 넓어 보여요.', size: '700 x 60', colors: ['#f6f0e7', '#d6c1a2', '#927151'] },
  { id: 'lamp-001', category: '조명', emoji: '💡', name: '포인트 플로어 램프', price: 179000, priceLabel: '₩179,000', fitScore: 83, blurb: '코너 무드 조명으로 분위기를 정리합니다.', size: '420 x 420', colors: ['#fff7dd', '#f4d38c', '#b8904e'] },
]

const bedProducts = [
  { id: 'bed-001', badge: 'BEST', emoji: '🛏️', name: '헤이븐 패브릭 침대', fit: 'AI 추천 94%', fitScore: 94, price: 890000, priceLabel: '₩890,000', review: '4.9 · 182', color: '아이보리', size: '퀸', material: '패브릭', blurb: '부드러운 헤드보드와 웜 톤 패브릭이 특징이에요.' },
  { id: 'bed-002', badge: 'NEW', emoji: '🛌', name: '클라우드 쿠션 침대', fit: '중형 침실 적합', fitScore: 87, price: 1120000, priceLabel: '₩1,120,000', review: '4.8 · 74', color: '베이지', size: '킹', material: '패브릭', blurb: '도톰한 쿠션 헤드보드로 호텔라이크 분위기를 줍니다.' },
  { id: 'bed-003', badge: 'SALE', emoji: '🪵', name: '월넛 프레임 침대', fit: 'AI 추천 88%', fitScore: 88, price: 760000, priceLabel: '₩760,000', review: '4.7 · 58', color: '우드', size: '퀸', material: '원목', blurb: '차분한 월넛 마감으로 공간을 안정감 있게 잡아줘요.' },
  { id: 'bed-004', badge: 'HOT', emoji: '✨', name: '리넨 헤드보드 침대', fit: '원룸 배치 적합', fitScore: 91, price: 940000, priceLabel: '₩940,000', review: '4.8 · 101', color: '그레이', size: '슈퍼싱글', material: '리넨', blurb: '작은 공간에도 답답하지 않게 들어가는 슬림 헤드 타입.' },
  { id: 'bed-005', badge: 'BEST', emoji: '🌙', name: '소프트 아이보리 침대', fit: 'AI 추천 91%', fitScore: 91, price: 830000, priceLabel: '₩830,000', review: '4.9 · 133', color: '아이보리', size: '퀸', material: '패브릭', blurb: '아이보리 톤으로 침실을 더 환하게 보이게 해줘요.' },
  { id: 'bed-006', badge: 'NEW', emoji: '🧸', name: '웜그레이 플랫폼 침대', fit: '패브릭 룩', fitScore: 85, price: 690000, priceLabel: '₩690,000', review: '4.6 · 45', color: '그레이', size: '퀸', material: '합성패브릭', blurb: '로우 플랫폼 구조로 천장이 낮아도 깔끔해 보여요.' },
]

const baseZones = [
  { id: 'living', icon: '🛋️', name: '거실', size: '23.4㎡', className: 'living', selected: true },
  { id: 'kitchen', icon: '🍳', name: '주방', size: '11.2㎡', className: 'kitchen', selected: false },
  { id: 'bed1', icon: '🛏️', name: '안방', size: '14.8㎡', className: 'bed1', selected: true },
  { id: 'bed2', icon: '📚', name: '침실/서재', size: '9.1㎡', className: 'bed2', selected: false },
  { id: 'bath', icon: '🛁', name: '욕실', size: '4.1㎡', className: 'bath', selected: false },
  { id: 'entry', icon: '🚪', name: '현관', size: '3.7㎡', className: 'entry', selected: true },
]

const apartmentTypes = ['84A', '84B', '101A', '59A']

const apartmentSearchResults = [
  { id: 'raemian-forest-84a', brand: '래미안', complex: '포레스트', unitLabel: '84A', areaLabel: '전용 84㎡', layoutLabel: '4Bay', variantLabel: '거실 확장형' },
  { id: 'acrovista-river-101a', brand: '아크로', complex: '리버뷰', unitLabel: '101A', areaLabel: '전용 101㎡', layoutLabel: '타워형', variantLabel: '주방 확장형' },
  { id: 'xi-central-59a', brand: '자이', complex: '센트럴', unitLabel: '59A', areaLabel: '전용 59㎡', layoutLabel: '판상형', variantLabel: '기본형' },
]

const initialEditorItems = [
  { id: 'placed-sofa', sourceId: 'sofa-001', name: '코튼베이지 모듈 소파', label: 'SOFA', x: 10, y: 16, w: 28, h: 18, rotation: 0, colorIndex: 2 },
  { id: 'placed-table', sourceId: 'table-001', name: '오벌 우드 테이블', label: 'TABLE', x: 16, y: 46, w: 13, h: 20, rotation: 0, colorIndex: 1, circle: true },
  { id: 'placed-tv', sourceId: 'tv-001', name: '슬림 TV 콘솔', label: 'TV', x: 67, y: 10, w: 24, h: 6, rotation: 0, colorIndex: 2 },
  { id: 'placed-shelf', sourceId: 'tv-001', name: '슬림 TV 콘솔', label: 'SHELF', x: 67, y: 18, w: 24, h: 12, rotation: 0, colorIndex: 1 },
  { id: 'placed-plant', sourceId: 'plant-001', name: '세라믹 플로어 플랜트', label: '🌿', x: 42, y: 14, w: 7, h: 10, rotation: 0, colorIndex: 2 },
]

function formatPrice(value) {
  return `₩${value.toLocaleString('ko-KR')}`
}

function formatApartmentOption(option) {
  return [option.brand, option.complex, option.unitLabel].filter(Boolean).join(' ')
}

function useSpaNavigation() {
  const [{ screen, overlay }, setState] = React.useState(() => parseHashState(window.location.hash))
  const [direction, setDirection] = React.useState(0)
  const currentScreenRef = React.useRef(screen)

  React.useEffect(() => {
    currentScreenRef.current = screen
  }, [screen])

  React.useEffect(() => {
    const syncFromLocation = () => {
      const next = parseHashState(window.location.hash)
      setDirection(getDirectionalTransition(currentScreenRef.current, next.screen))
      currentScreenRef.current = next.screen
      setState(next)
    }
    window.addEventListener('hashchange', syncFromLocation)
    window.addEventListener('popstate', syncFromLocation)
    return () => {
      window.removeEventListener('hashchange', syncFromLocation)
      window.removeEventListener('popstate', syncFromLocation)
    }
  }, [])

  const syncHash = React.useCallback((nextScreen, nextOverlay) => {
    const nextHash = buildNavigationHash(nextScreen, nextOverlay)
    if (window.location.hash.replace(/^#/, '') === nextHash) return
    window.history.pushState(null, '', `#${nextHash}`)
  }, [])

  const navigate = React.useCallback((nextScreen) => {
    const nextDirection = getDirectionalTransition(currentScreenRef.current, nextScreen)
    setDirection(nextDirection)

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setState({ screen: nextScreen, overlay: null })
      })
    } else {
      setState({ screen: nextScreen, overlay: null })
    }

    currentScreenRef.current = nextScreen
    syncHash(nextScreen, null)
  }, [syncHash])

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

function useCart() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [items, setItems] = React.useState([])

  const addItem = React.useCallback((product) => {
    setItems((current) => addCartItem(current, product))
    setIsOpen(true)
  }, [])

  const updateQty = React.useCallback((id, delta) => {
    setItems((current) => updateCartItemQty(current, id, delta))
  }, [])

  const replaceItems = React.useCallback((nextItems = []) => {
    setItems(Array.isArray(nextItems)
      ? nextItems.map((item) => ({ id: item.id, qty: item.qty ?? 1 }))
      : [])
  }, [])

  const clear = React.useCallback(() => setItems([]), [])
  const { count, subtotal } = buildCartTotals(items)

  return { isOpen, setIsOpen, items, addItem, updateQty, replaceItems, clear, count, subtotal }
}

function useQuickView() {
  const [product, setProduct] = React.useState(null)
  return {
    product,
    open: setProduct,
    close: () => setProduct(null),
  }
}

function useEditorState() {
  const [items, setItems] = React.useState(initialEditorItems)
  const [history, setHistory] = React.useState([])
  const [selectedId, setSelectedId] = React.useState(initialEditorItems[0].id)
  const [activeTool, setActiveTool] = React.useState('select')
  const [snapOn, setSnapOn] = React.useState(true)
  const [notice, setNotice] = React.useState('가구를 길게 누르거나 바로 드래그해서 원하는 위치로 옮겨보세요.')
  const [dragState, setDragState] = React.useState(null)
  const historyCommittedRef = React.useRef(false)
  const itemsRef = React.useRef(items)
  const clickMoveAnimationRef = React.useRef(null)

  React.useEffect(() => {
    itemsRef.current = items
  }, [items])

  React.useEffect(() => () => {
    if (clickMoveAnimationRef.current?.frame) {
      window.cancelAnimationFrame(clickMoveAnimationRef.current.frame)
    }
  }, [])

  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null

  const commit = React.useCallback((nextItems, nextNotice) => {
    setHistory((current) => [...current, items])
    setItems(nextItems)
    if (nextNotice) setNotice(nextNotice)
  }, [items])

  const updateSelected = React.useCallback((updater, nextNotice) => {
    if (!selectedId) return
    const nextItems = items.map((item) => item.id === selectedId ? updater(item) : item)
    commit(nextItems, nextNotice)
  }, [commit, items, selectedId])

  const stopClickMoveAnimation = React.useCallback(() => {
    if (clickMoveAnimationRef.current?.frame) {
      window.cancelAnimationFrame(clickMoveAnimationRef.current.frame)
    }
    clickMoveAnimationRef.current = null
  }, [])

  const moveSelected = React.useCallback((dx, dy) => {
    stopClickMoveAnimation()
    updateSelected((item) => ({
      ...item,
      ...resolveMovedItemPosition(item, dx, dy, snapOn),
    }), snapOn ? '스냅 단위로 가구를 이동했어요.' : '자유 이동으로 가구 위치를 조정했어요.')
  }, [snapOn, stopClickMoveAnimation, updateSelected])

  const moveSelectedTo = React.useCallback((targetX, targetY) => {
    if (!selectedId) return

    const currentItems = itemsRef.current
    const currentItem = currentItems.find((item) => item.id === selectedId)
    if (!currentItem) return

    stopClickMoveAnimation()
    historyCommittedRef.current = false
    setDragState(null)
    setActiveTool('move')

    const { x: snappedX, y: snappedY } = resolveAnimatedTarget(targetX, targetY, snapOn)

    if (Math.abs(currentItem.x - snappedX) < 0.01 && Math.abs(currentItem.y - snappedY) < 0.01) {
      setNotice('이미 그 위치에 가까워요. 다른 지점을 클릭하면 부드럽게 이동해요.')
      return
    }

    setHistory((current) => [...current, currentItems])
    setNotice(snapOn
      ? '클릭한 위치로 스냅 단위 애니메이션 이동 중이에요.'
      : '클릭한 위치로 부드럽게 이동 중이에요.')

    const tick = () => {
      const currentItemsForFrame = itemsRef.current
      const currentSelected = currentItemsForFrame.find((item) => item.id === selectedId)
      if (!currentSelected) {
        clickMoveAnimationRef.current = null
        return
      }

      const nextX = stepToward(currentSelected.x, snappedX)
      const nextY = stepToward(currentSelected.y, snappedY)
      const reached = Math.abs(nextX - snappedX) < 0.01 && Math.abs(nextY - snappedY) < 0.01

      setItems((current) => {
        const next = current.map((item) => item.id === selectedId ? { ...item, x: nextX, y: nextY } : item)
        itemsRef.current = next
        return next
      })

      if (reached) {
        clickMoveAnimationRef.current = null
        setNotice(snapOn
          ? '클릭한 위치까지 부드럽게 이동한 뒤 스냅 위치에 맞췄어요.'
          : '클릭한 위치까지 부드럽게 이동했어요.')
        return
      }

      clickMoveAnimationRef.current = {
        frame: window.requestAnimationFrame(tick),
      }
    }

    clickMoveAnimationRef.current = {
      frame: window.requestAnimationFrame(tick),
    }
  }, [selectedId, snapOn, stopClickMoveAnimation])

  const rotateSelected = React.useCallback(() => {
    updateSelected((item) => ({ ...item, rotation: (item.rotation + 90) % 360 }), '선택한 가구를 90° 회전했어요.')
  }, [updateSelected])

  const cycleColor = React.useCallback(() => {
    updateSelected((item) => ({ ...item, colorIndex: ((item.colorIndex ?? 0) + 1) % 4 }), '선택한 가구 컬러 프리셋을 바꿨어요.')
  }, [updateSelected])

  const setSelectedColor = React.useCallback((colorIndex) => {
    updateSelected((item) => ({ ...item, colorIndex }), '선택한 컬러 스와치를 적용했어요.')
  }, [updateSelected])

  const addLibraryItem = React.useCallback((product) => {
    const nextItem = buildPlacedLibraryItem(product, `${product.id}-${Date.now()}`)
    commit([...items, nextItem], `${product.name}을(를) 배치안에 추가했어요. 바로 드래그해서 위치를 조정할 수 있어요.`)
    setSelectedId(nextItem.id)
  }, [commit, items])

  const beginDrag = React.useCallback((itemId, pointer, bounds) => {
    const item = items.find((entry) => entry.id === itemId)
    if (!item || !bounds?.width || !bounds?.height) return

    stopClickMoveAnimation()
    setSelectedId(itemId)
    setActiveTool('move')
    historyCommittedRef.current = false
    setDragState({
      itemId,
      pointerId: pointer.pointerId,
      startClientX: pointer.clientX,
      startClientY: pointer.clientY,
      originX: item.x,
      originY: item.y,
      roomWidth: bounds.width,
      roomHeight: bounds.height,
      moved: false,
    })
    setNotice(snapOn ? '드래그 중 · 스냅 그리드에 맞춰 배치하고 있어요.' : '드래그 중 · 자유롭게 위치를 조정하고 있어요.')
  }, [items, snapOn, stopClickMoveAnimation])

  const updateDrag = React.useCallback((pointer) => {
    if (!dragState) return

    const { point, moved } = resolveDragPosition(dragState, pointer, snapOn)

    if (!historyCommittedRef.current) {
      setHistory((current) => [...current, items])
      historyCommittedRef.current = true
    }

    setItems((current) => current.map((item) => item.id === dragState.itemId ? { ...item, x: point.x, y: point.y } : item))
    setDragState((current) => current ? { ...current, moved: current.moved || moved } : current)
  }, [dragState, items, snapOn])

  const endDrag = React.useCallback(() => {
    if (!dragState) return

    setNotice(dragState.moved
      ? (snapOn ? '가구를 드래그해서 스냅 위치로 옮겼어요.' : '가구를 드래그해서 원하는 위치로 옮겼어요.')
      : '가구를 선택했어요. 눌러서 바로 드래그할 수 있어요.')
    historyCommittedRef.current = false
    setDragState(null)
  }, [dragState, snapOn])

  const undo = React.useCallback(() => {
    setHistory((current) => {
      if (!current.length) return current
      const previous = current[current.length - 1]
      setItems(previous)
      setSelectedId(previous[0]?.id ?? null)
      setNotice('직전 변경을 되돌렸어요.')
      historyCommittedRef.current = false
      setDragState(null)
      stopClickMoveAnimation()
      return current.slice(0, -1)
    })
  }, [stopClickMoveAnimation])

  const reset = React.useCallback(() => {
    stopClickMoveAnimation()
    setHistory((current) => [...current, items])
    setItems(initialEditorItems)
    setSelectedId(initialEditorItems[0].id)
    setNotice('초기 배치안으로 되돌렸어요.')
    historyCommittedRef.current = false
    setDragState(null)
  }, [items, stopClickMoveAnimation])

  const replaceItems = React.useCallback((nextItems = []) => {
    stopClickMoveAnimation()
    const hydratedItems = Array.isArray(nextItems)
      ? nextItems.map((item) => ({ ...item }))
      : []
    setHistory([])
    setItems(hydratedItems)
    setSelectedId(hydratedItems[0]?.id ?? null)
    setNotice(hydratedItems.length
      ? '계정에 저장된 배치안으로 전환했어요.'
      : '계정에 저장된 배치안이 없어 비어 있는 상태로 전환했어요.')
    historyCommittedRef.current = false
    setDragState(null)
  }, [stopClickMoveAnimation])

  return {
    items,
    selected,
    selectedId,
    setSelectedId,
    activeTool,
    setActiveTool,
    snapOn,
    setSnapOn,
    notice,
    dragState,
    beginDrag,
    updateDrag,
    endDrag,
    moveSelected,
    moveSelectedTo,
    rotateSelected,
    cycleColor,
    setSelectedColor,
    addLibraryItem,
    undo,
    reset,
    replaceItems,
  }
}

const LOGIN_BUTTON_LABEL = '로그인'

function buildEmptyLoginForm(intent = null) {
  return {
    mode: 'login',
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
    agreeToTerms: false,
    handoffId: null,
    status: 'idle',
    result: null,
    mergeResolution: null,
    intent: buildSerializableAuthIntent(intent),
    connection: null,
  }
}

function buildAuthSessionResultSummary(session = null) {
  if (!session) return null

  return {
    accountLabel: session.accountLabel ?? null,
    sessionId: session.sessionId ?? null,
    handoffId: session.handoffId ?? null,
    mergeMode: session.mergeMode ?? null,
    mergedDraftCount: session.mergedDraftCount ?? 0,
    restoredWishlistCount: session.restoredWishlistCount ?? 0,
    restoredCartCount: session.restoredCartCount ?? 0,
    restoredLayoutItemCount: session.restoredLayoutItemCount ?? 0,
    restoredRecommendationDraft: Boolean(session.restoredRecommendationDraft),
    wishlistCount: session.wishlistCount ?? 0,
    cartCount: session.cartCount ?? 0,
    layoutItemCount: session.layoutItemCount ?? 0,
    hasRecommendationDraft: Boolean(session.hasRecommendationDraft),
    guestDraftSummary: session.guestDraftSummary ?? null,
    draftSave: session.draftSave ?? null,
    intent: session.intent ?? null,
    connection: session.connection ?? null,
    resumeToken: session.continuation?.resumeToken ?? null,
    nextAction: session.continuation?.nextAction ?? null,
    continuationStatus: session.continuation?.status ?? null,
    continuationStatusLabel: session.continuation?.statusLabel ?? null,
    authMode: session.authMode ?? 'remote',
    authTransport: session.authTransport ?? 'network',
  }
}

function resolveLoginButtonLabel(authSession) {
  return authSession?.accountLabel ?? LOGIN_BUTTON_LABEL
}

function buildAuthModeLabels(mode = 'login') {
  return mode === 'signup'
    ? {
        badge: 'SIGN UP',
        title: '회원가입하고 추천 · 보드 · 장바구니를 한 계정으로 이어보세요',
        submitLabel: '회원가입',
        alternateLabel: '이미 계정이 있어요',
        alternateMode: 'login',
      }
    : {
        badge: 'ACCOUNT',
        title: '로그인하고 추천 · 보드 · 장바구니를 이어서 관리하세요',
        submitLabel: '로그인',
        alternateLabel: '회원가입',
        alternateMode: 'signup',
      }
}

function buildAuthDraftSavePayload(loginFormDraftSave = null, authSessionDraftSave = null, guestDraftSnapshot = null, intent = null) {
  if (loginFormDraftSave) return loginFormDraftSave
  if (authSessionDraftSave) return authSessionDraftSave
  if (!guestDraftSnapshot) return null

  const draftLabel = intent?.draftLabel ?? guestDraftSnapshot.continuity?.apartmentLabel ?? null
  const apartmentLabel = guestDraftSnapshot.continuity?.apartmentLabel ?? null
  const recommendationRoom = guestDraftSnapshot.recommendationDraft?.room ?? null
  const selectedSpaceIds = guestDraftSnapshot.spaceProfile?.spaces ?? []
  const layoutItems = guestDraftSnapshot.continuity?.layoutItems ?? []

  if (!draftLabel && !apartmentLabel && !recommendationRoom && !selectedSpaceIds.length && !layoutItems.length) {
    return null
  }

  return {
    draftLabel,
    apartmentLabel,
    recommendationRoom,
    selectedSpaceIds,
    layoutItems,
  }
}

function Header({ dark = false, active = 'AI 추천', onNavigate, onOpenOverlay, onOpenCart, cartCount, onSearchOpen, onOpenLogin, authSession }) {
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
        {!dark && <button className="searchPill" onClick={onSearchOpen}>🔎 스타일 또는 가구 검색</button>}
        {dark && <button className="miniBtn secondary" onClick={() => onOpenOverlay('address')}>공간 정보</button>}
        <button className="accountTrigger utilityButton" onClick={onOpenLogin} aria-label="로그인 열기">
          <span className="accountGlyph" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5.5 18.2c1.8-3.1 4.4-4.7 6.5-4.7s4.7 1.6 6.5 4.7" />
            </svg>
          </span>
          <span>{resolveLoginButtonLabel(authSession)}</span>
        </button>
        <button className="cart utilityButton utilityIconButton" onClick={onOpenCart} aria-label="장바구니 열기">🛒<span>{cartCount}</span></button>
      </div>
    </header>
  )
}

function StageTransition({ screen, direction, children }) {
  const [displayScreen, setDisplayScreen] = React.useState(screen)
  const [phase, setPhase] = React.useState('enter')
  const [activeDirection, setActiveDirection] = React.useState(direction)

  React.useEffect(() => {
    if (screen === displayScreen) return
    setActiveDirection(direction)
    setPhase('exit')
    const outTimer = window.setTimeout(() => {
      setDisplayScreen(screen)
      setPhase('enter')
    }, 180)
    return () => window.clearTimeout(outTimer)
  }, [screen, displayScreen, direction])

  React.useEffect(() => {
    if (phase !== 'enter') return
    const settleTimer = window.setTimeout(() => setPhase('idle'), 280)
    return () => window.clearTimeout(settleTimer)
  }, [phase, displayScreen])

  return (
    <div className={`stageViewport ${phase === 'exit' ? 'is-exiting' : ''}`}>
      <div
        key={`${displayScreen}-${phase}-${activeDirection}`}
        className={`stageSlide phase-${phase} ${activeDirection >= 0 ? 'dir-forward' : 'dir-back'}`}
      >
        {children(displayScreen)}
      </div>
    </div>
  )
}

function App() {
  const { screen, overlay, direction, navigate, openOverlay, closeOverlay } = useSpaNavigation()
  const cart = useCart()
  const quickView = useQuickView()
  const editor = useEditorState()
  const persistedAuthHandoff = React.useMemo(
    () => readPersistedAuthHandoff(globalThis.sessionStorage),
    [],
  )
  const persistedAuthSession = React.useMemo(
    () => readPersistedAuthSession(globalThis.localStorage),
    [],
  )
  const persistedAuthUiRestore = React.useMemo(
    () => buildPostAuthSessionRestorePatch(persistedAuthSession, {
      spaceZones: baseZones,
      roomOptions,
      fallbackRoom: initialAiForm.room,
    }),
    [persistedAuthSession],
  )
  const [searchDrawerOpen, setSearchDrawerOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [aiForm, setAiForm] = React.useState(() => ({
    ...initialAiForm,
    ...(persistedAuthUiRestore?.recommendationRoom
      ? { room: persistedAuthUiRestore.recommendationRoom }
      : {}),
  }))
  const [spaceProfile, setSpaceProfile] = React.useState(() => ({
    query: '서울 성동구 성수이로 123 HAVENLY Apartments',
    apartmentType: apartmentSearchResults[0].unitLabel,
    apartmentSelectionId: apartmentSearchResults[0].id,
    spaces: persistedAuthUiRestore?.selectedSpaceIds?.length
      ? persistedAuthUiRestore.selectedSpaceIds
      : baseZones.filter((zone) => zone.selected).map((zone) => zone.id),
  }))
  const [bedFilters, setBedFilters] = React.useState({
    search: '',
    sorts: 'recommended',
    size: '전체',
    color: '전체',
    material: '전체',
    fit: '전체',
  })
  const [wishlistedIds, setWishlistedIds] = React.useState([])
  const [loginModalState, setLoginModalState] = React.useState(() => (persistedAuthHandoff ? 'form' : 'closed'))
  const [loginForm, setLoginForm] = React.useState(() => (
    buildAuthReadyState(persistedAuthSession)
      ?? buildAuthResumeState(persistedAuthHandoff, persistedAuthSession)
      ?? buildEmptyLoginForm()
  ))
  const [authSession, setAuthSession] = React.useState(() => persistedAuthSession)
  const [authContinuationFields, setAuthContinuationFields] = React.useState(() => buildAuthContinuationFieldState(
    persistedAuthHandoff?.continuationFields ?? persistedAuthSession?.continuationFields ?? null,
  ))
  const [authNoticeDismissed, setAuthNoticeDismissed] = React.useState(false)
  const [engagement, setEngagement] = React.useState(initialEngagement)
  const appliedAuthSessionRestoreRef = React.useRef(persistedAuthSession?.savedAt ?? null)

  const selectedApartment = React.useMemo(
    () => buildSelectedApartment(apartmentSearchResults, spaceProfile.apartmentSelectionId),
    [spaceProfile.apartmentSelectionId],
  )
  const recommendationContext = React.useMemo(() => buildRecommendationContext({
    aiForm,
    spaceProfile,
    selectedApartment,
    formatApartmentOption,
  }), [aiForm, selectedApartment, spaceProfile])
  const aiSummary = React.useMemo(() => buildRecommendationSummary({
    ...recommendationContext,
    styleOptions,
    priorityOptions,
  }), [recommendationContext])
  const inputBrief = React.useMemo(() => buildInputBrief({
    form: aiForm,
    spaceProfile,
    apartmentSearchResults,
    formatApartmentOption,
    styleOptions,
    priorityOptions,
  }), [aiForm, spaceProfile])
  const selectedSpaceSummary = React.useMemo(
    () => buildSelectedSpaceSummary(baseZones, roomOptions, spaceProfile.spaces),
    [spaceProfile.spaces],
  )
  const selectedBed = React.useMemo(
    () => resolveQuickViewProduct(bedProducts, quickView.product),
    [quickView.product],
  )

  React.useEffect(() => {
    setAiForm((current) => {
      const nextRoom = resolveAiRoomSelection(current.room, selectedSpaceSummary)
      return current.room === nextRoom ? current : { ...current, room: nextRoom }
    })
  }, [selectedSpaceSummary])

  const searchDrawerState = React.useMemo(() => buildSearchDrawerState({
    query: searchQuery,
    libraryItems,
    bedProducts,
  }), [searchQuery])

  const filteredBedProducts = React.useMemo(
    () => buildFilteredBedProducts(bedProducts, bedFilters),
    [bedFilters],
  )

  const loginGuardSnapshot = React.useMemo(() => buildLoginGuardSnapshot({
    engagement,
    wishlistCount: wishlistedIds.length,
    cartCount: cart.count,
  }), [cart.count, engagement, wishlistedIds.length])

  const guestDraftSnapshot = React.useMemo(() => buildGuestDraftSnapshot({
    engagement,
    aiForm,
    spaceProfile,
    selectedApartment,
    selectedSpaceSummary,
    wishlistedIds,
    cartItems: cart.items,
    editorItems: editor.items,
  }), [aiForm, cart.items, editor.items, engagement, selectedApartment, selectedSpaceSummary, spaceProfile, wishlistedIds])

  const authConfig = React.useMemo(
    () => resolveAuthConfig({ env: import.meta.env }),
    [],
  )

  const authDraftSavePayload = React.useMemo(
    () => buildAuthDraftSavePayload(
      loginForm.draftSave,
      authSession?.draftSave ?? null,
      guestDraftSnapshot,
      authSession?.intent ?? loginForm.intent ?? null,
    ),
    [authSession?.draftSave, authSession?.intent, guestDraftSnapshot, loginForm.draftSave, loginForm.intent],
  )

  const authSubmitPlan = React.useMemo(() => buildAuthSubmitPlan({
    email: loginForm.email,
    password: loginForm.password,
    guestDraftSnapshot,
    mergeResolution: loginForm.mergeResolution ?? null,
    handoffId: loginForm.handoffId ?? null,
    endpoint: authConfig.loginEndpoint,
    intent: buildSerializableAuthIntent(loginForm.intent),
    draftSave: authDraftSavePayload,
  }), [authConfig.loginEndpoint, authDraftSavePayload, guestDraftSnapshot, loginForm.email, loginForm.handoffId, loginForm.intent, loginForm.mergeResolution, loginForm.password])

  const authSignupPlan = React.useMemo(() => {
    const serializableIntent = buildSerializableAuthIntent(loginForm.intent)
    const serializableContinuation = buildSerializableAuthContinuation(loginForm.continuation)

    return {
      canSubmit: loginForm.displayName.trim().length >= 2
        && loginForm.email.includes('@')
        && loginForm.password.trim().length >= 8
        && loginForm.password === loginForm.confirmPassword
        && loginForm.agreeToTerms,
      endpoint: authConfig.signupEndpoint,
      method: 'POST',
      handoffId: loginForm.handoffId ?? null,
      request: {
        mode: 'signup',
        displayName: loginForm.displayName.trim(),
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password,
        guestDraftSnapshot,
        handoffId: loginForm.handoffId ?? null,
        intent: serializableIntent,
        continuation: serializableContinuation,
        draftSave: authDraftSavePayload,
      },
      summary: {
        displayName: loginForm.displayName.trim(),
        email: loginForm.email.trim().toLowerCase(),
        handoffId: loginForm.handoffId ?? null,
        wishlistCount: guestDraftSnapshot?.continuity?.wishlistIds?.length ?? 0,
        cartCount: guestDraftSnapshot?.continuity?.cartItems?.length ?? 0,
        layoutItemCount: guestDraftSnapshot?.continuity?.layoutItems?.length ?? 0,
        hasRecommendationDraft: Boolean(guestDraftSnapshot?.recommendationDraft),
        intent: serializableIntent,
        continuation: serializableContinuation,
        draftSave: authDraftSavePayload,
      },
    }
  }, [authConfig.signupEndpoint, authDraftSavePayload, guestDraftSnapshot, loginForm.agreeToTerms, loginForm.confirmPassword, loginForm.continuation, loginForm.displayName, loginForm.email, loginForm.handoffId, loginForm.intent, loginForm.password])

  const activeAuthPlan = loginForm.mode === 'signup' ? authSignupPlan : authSubmitPlan

  const authConnectionSummary = React.useMemo(
    () => buildAuthConnectionSummary(activeAuthPlan, authConfig),
    [activeAuthPlan, authConfig],
  )

  const authLoginConnectionSummary = React.useMemo(
    () => buildAuthConnectionSummary({
      endpoint: authConfig.loginEndpoint,
      method: 'POST',
    }, authConfig),
    [authConfig],
  )

  const authResultSummary = React.useMemo(
    () => {
      if (loginForm.result) return buildAuthResultSummary(loginForm.result, activeAuthPlan.summary)
      if (loginForm.status === 'ready') return buildAuthSessionResultSummary(authSession)
      return null
    },
    [activeAuthPlan.summary, authSession, loginForm.result, loginForm.status],
  )

  const authErrorSummary = React.useMemo(
    () => buildAuthErrorSummary(loginForm.result, activeAuthPlan.summary),
    [activeAuthPlan.summary, loginForm.result],
  )

  const activeAuthStatusConnection = loginForm.status === 'resume-ready'
    ? (loginForm.connection ?? authConnectionSummary)
    : authConnectionSummary

  const activeAuthStatusSummary = loginForm.status === 'resume-ready' && loginForm.continuation
    ? { ...loginForm.continuation }
    : authResultSummary

  const authStatusMessage = React.useMemo(
    () => buildAuthStatusCopy(loginForm.status, activeAuthPlan.summary, activeAuthStatusSummary, authErrorSummary, activeAuthStatusConnection),
    [activeAuthPlan.summary, activeAuthStatusConnection, activeAuthStatusSummary, authErrorSummary, loginForm.status],
  )

  const authSessionNotice = React.useMemo(
    () => buildAuthSessionNotice(authSession),
    [authSession],
  )

  const authContinuationConnectionSummary = React.useMemo(
    () => buildAuthConnectionSummary({
      endpoint: authConfig.continueEndpoint,
      method: 'POST',
    }, authConfig),
    [authConfig],
  )

  const authReadyPanelState = React.useMemo(
    () => buildAuthReadyPanelState(authSession, {
      actionConnection: authContinuationConnectionSummary,
    }),
    [authContinuationConnectionSummary, authSession],
  )

  React.useEffect(() => {
    if (!shouldAutoOpenAuthReadyPanel(authSession, loginModalState)) return
    setLoginModalState('form')
  }, [authSession, loginModalState])

  const authContinuationPlan = React.useMemo(() => buildAuthContinuationPlan({
    endpoint: authConfig.continueEndpoint,
    continuation: authSession?.continuation ?? loginForm.continuation ?? null,
    handoffId: authSession?.handoffId ?? loginForm.handoffId ?? null,
    intent: buildSerializableAuthIntent(authSession?.intent ?? loginForm.intent ?? null),
    fields: authReadyPanelState?.nextAction === 'complete-profile'
      ? {
          displayName: authContinuationFields.displayName,
          phone: authContinuationFields.phone,
        }
      : authReadyPanelState?.nextAction === 'verify-email'
        ? {
            verificationCode: authContinuationFields.verificationCode,
          }
        : loginForm.continuation?.nextAction === 'confirm-merge-resolution' && loginForm.mergeResolution
          ? {
              mergeResolution: loginForm.mergeResolution,
            }
          : null,
    draftSave: shouldAttachDraftSaveToAuthContinuation(
      authSession?.intent ?? loginForm.intent ?? null,
      authSession?.continuation ?? loginForm.continuation ?? null,
    )
      ? authDraftSavePayload
      : null,
  }), [authConfig.continueEndpoint, authContinuationFields.displayName, authContinuationFields.phone, authContinuationFields.verificationCode, authDraftSavePayload, authReadyPanelState?.nextAction, authSession?.continuation, authSession?.handoffId, authSession?.intent, loginForm.continuation, loginForm.handoffId, loginForm.intent, loginForm.mergeResolution])

  React.useEffect(() => {
    let cancelled = false

    ;(async () => {
      const result = await readAuthSession({
        endpoint: authConfig.sessionEndpoint,
        connectionFallbackOverride: persistedAuthSession?.connection ?? authLoginConnectionSummary,
        ...authConfig,
      })

      if (result.ok && !cancelled) {
        const sessionConnection = buildAuthConnectionSummary({
          endpoint: authConfig.sessionEndpoint,
          method: 'GET',
        }, authConfig)
        const bootstrapFallbackSummary = {
          handoffId: persistedAuthSession?.handoffId ?? persistedAuthHandoff?.handoffId ?? null,
          wishlistCount: persistedAuthSession?.wishlistCount ?? persistedAuthHandoff?.summary?.wishlistCount ?? 0,
          cartCount: persistedAuthSession?.cartCount ?? persistedAuthHandoff?.summary?.cartCount ?? 0,
          layoutItemCount: persistedAuthSession?.layoutItemCount ?? persistedAuthHandoff?.summary?.layoutItemCount ?? 0,
          hasRecommendationDraft: persistedAuthSession?.hasRecommendationDraft ?? persistedAuthHandoff?.summary?.hasRecommendationDraft ?? false,
          guestDraftSummary: persistedAuthSession?.guestDraftSummary ?? null,
          intent: persistedAuthSession?.intent ?? persistedAuthHandoff?.summary?.intent ?? null,
          connection: persistedAuthSession?.connection ?? persistedAuthHandoff?.connection ?? authLoginConnectionSummary ?? sessionConnection,
          continuation: persistedAuthSession?.continuation ?? persistedAuthHandoff?.continuation ?? null,
          authMode: persistedAuthSession?.authMode ?? null,
          authTransport: persistedAuthSession?.authTransport ?? null,
        }
        const resultSummary = buildAuthResultSummary(result, bootstrapFallbackSummary)
        const nextSession = buildPersistedAuthSession(resultSummary, {
          connection: resultSummary?.connection ?? persistedAuthSession?.connection ?? authLoginConnectionSummary ?? sessionConnection,
          continuation: buildSerializableAuthContinuation(result?.data),
          continuationFields: persistedAuthSession?.continuationFields ?? persistedAuthHandoff?.continuationFields ?? null,
          accountState: result?.data?.accountState ?? null,
        })

        clearPersistedAuthHandoff(globalThis.sessionStorage)
        persistAuthSession(globalThis.localStorage, nextSession)
        setAuthSession(nextSession)
        setLoginForm((current) => {
          if (current.status === 'submitting') return current
          return buildAuthReadyState(nextSession, {
            intent: current.intent ?? nextSession.intent ?? null,
          }) ?? current
        })
        return
      }

      if (!cancelled && persistedAuthSession) {
        if (shouldPreservePersistedAuthSessionOnBootstrapFailure(result, persistedAuthSession)) {
          setAuthSession(persistedAuthSession)
          setAuthNoticeDismissed(false)
          setLoginForm((current) => {
            if (current.status === 'submitting') return current
            return buildAuthReadyState(persistedAuthSession, {
              intent: current.intent ?? persistedAuthSession.intent ?? null,
            }) ?? current
          })
          return
        }

        clearPersistedAuthSession(globalThis.localStorage)
        setAuthSession(null)
        setAuthNoticeDismissed(false)
        setLoginForm((current) => {
          if (current.status === 'submitting') return current
          if (current.status === 'resume-ready' && current.handoff) return current
          return buildEmptyLoginForm(current.intent)
        })
      }

      if (persistedAuthHandoff || cancelled) return

      const pendingResult = await readAuthPending({
        endpoint: authConfig.pendingEndpoint,
        connectionFallbackOverride: persistedAuthHandoff?.connection ?? persistedAuthSession?.connection ?? authLoginConnectionSummary,
        ...authConfig,
      })

      if (!pendingResult.ok || cancelled) return

      persistAuthHandoff(globalThis.sessionStorage, pendingResult.data)
      setLoginForm((current) => (
        current.status === 'submitting'
          ? current
          : (buildAuthResumeState(pendingResult.data, persistedAuthSession) ?? current)
      ))
      setLoginModalState('form')
    })()

    return () => {
      cancelled = true
    }
  }, [authConfig, authLoginConnectionSummary, persistedAuthHandoff, persistedAuthSession])

  React.useEffect(() => {
    setAuthNoticeDismissed(false)
  }, [authSession?.savedAt])

  React.useEffect(() => {
    if (!authSession) return

    setLoginForm((current) => {
      if (current.status === 'submitting') return current
      if (current.status === 'resume-ready' && current.handoff) return current

      const nextReadyState = buildAuthReadyState(authSession, {
        intent: current.intent ?? authSession.intent ?? null,
      })

      return nextReadyState ?? current
    })
  }, [authSession])

  React.useEffect(() => {
    const activeContinuationFields = loginForm.continuationFields
      ?? authSession?.continuationFields
      ?? persistedAuthHandoff?.continuationFields
      ?? null

    setAuthContinuationFields((current) => {
      const next = buildAuthContinuationFieldState(activeContinuationFields)
      return JSON.stringify(current) === JSON.stringify(next) ? current : next
    })
  }, [authSession?.continuationFields, loginForm.continuationFields, persistedAuthHandoff?.continuationFields])

  React.useEffect(() => {
    if (!authSession?.savedAt) {
      appliedAuthSessionRestoreRef.current = null
      return
    }

    if (!shouldApplyPostAuthSessionRestore(authSession, appliedAuthSessionRestoreRef.current)) return

    const nextRestorePatch = buildPostAuthSessionRestorePatch(authSession, {
      spaceZones: baseZones,
      roomOptions,
      fallbackRoom: initialAiForm.room,
    })
    const continuityPatch = authSession.accountState
      ? {
          wishlistIds: [...(authSession.accountState.wishlistIds ?? [])],
          cartItems: [...(authSession.accountState.cartItems ?? [])],
          layoutItems: [...(authSession.accountState.layoutItems ?? [])],
          recommendationDraft: authSession.accountState.recommendationDraft ?? null,
        }
      : null

    if (nextRestorePatch?.recommendationRoom) {
      setAiForm((current) => (
        current.room === nextRestorePatch.recommendationRoom
          ? current
          : { ...current, room: nextRestorePatch.recommendationRoom }
      ))
    }

    if (nextRestorePatch?.selectedSpaceIds?.length) {
      setSpaceProfile((current) => {
        const currentIds = Array.isArray(current.spaces) ? current.spaces : []
        const nextIds = nextRestorePatch.selectedSpaceIds
        const unchanged = currentIds.length === nextIds.length && currentIds.every((value, index) => value === nextIds[index])

        return unchanged
          ? current
          : { ...current, spaces: nextIds }
      })
    }

    if (continuityPatch) {
      setWishlistedIds(continuityPatch.wishlistIds)
      cart.replaceItems(continuityPatch.cartItems)
      editor.replaceItems(continuityPatch.layoutItems)
      setAiForm((current) => (
        continuityPatch.recommendationDraft
          ? { ...current, ...continuityPatch.recommendationDraft }
          : current
      ))
      setEngagement(initialEngagement)
    }

    appliedAuthSessionRestoreRef.current = authSession.savedAt
  }, [authSession, cart, editor])

  const { reasons: loginGuardReasons, hasLoginGuard, metrics: loginGuardMetrics } = loginGuardSnapshot

  const openLogin = React.useCallback((intent = null) => {
    const requestedIntent = buildSerializableAuthIntent(intent)

    cart.setIsOpen(false)
    setSearchDrawerOpen(false)

    if (authSession && requestedIntent) {
      const currentIntent = buildSerializableAuthIntent(authSession.intent)
      const hasIntentChanged = JSON.stringify(currentIntent) !== JSON.stringify(requestedIntent)

      if (hasIntentChanged) {
        const nextSession = {
          ...authSession,
          intent: requestedIntent,
        }
        persistAuthSession(globalThis.localStorage, nextSession)
        setAuthSession(nextSession)
      }
    }

    setAuthContinuationFields(buildAuthContinuationFieldState(
      loginForm.continuationFields ?? authSession?.continuationFields ?? null,
    ))
    setLoginForm((current) => {
      const nextIntent = requestedIntent ?? current.intent ?? authSession?.intent ?? null

      if (authSession && current.status !== 'resume-ready') {
        return buildAuthReadyState(authSession, { intent: nextIntent }) ?? current
      }

      return {
        ...current,
        handoffId: current.handoffId ?? createAuthHandoffId(),
        status: current.status === 'resume-ready' ? 'resume-ready' : 'idle',
        result: null,
        mergeResolution: null,
        intent: nextIntent,
        connection: current.status === 'resume-ready' ? current.connection : null,
      }
    })
    setLoginModalState(authSession ? 'form' : hasLoginGuard ? 'guard' : 'form')
  }, [authSession, cart, hasLoginGuard])

  const handleDismissAuthResume = React.useCallback(() => {
    clearPersistedAuthHandoff(globalThis.sessionStorage)
    setAuthContinuationFields(buildAuthContinuationFieldState())
    setLoginForm((current) => buildEmptyLoginForm(current.intent))
  }, [])

  const handleCloseLoginModal = React.useCallback(() => {
    setLoginModalState('closed')
  }, [])

  const handleLogout = React.useCallback(async () => {
    clearPersistedAuthSession(globalThis.localStorage)
    clearPersistedAuthHandoff(globalThis.sessionStorage)
    setAuthSession(null)
    setAuthNoticeDismissed(false)
    setAuthContinuationFields(buildAuthContinuationFieldState())
    setLoginModalState('closed')
    setLoginForm(buildEmptyLoginForm())

    try {
      await signOutAuthSession({
        endpoint: authConfig.logoutEndpoint,
        ...authConfig,
      })
    } catch (error) {
      console.warn('Auth logout teardown failed after optimistic client reset.', error)
    }
  }, [authConfig])

  const handleResumeAuthenticatedIntent = React.useCallback(async () => {
    const nextIntent = loginForm.intent ?? authSession?.intent ?? null
    const nextContinuation = authSession?.continuation ?? loginForm.continuation ?? null

    if (!canResumePostAuthIntent(nextIntent, screen, nextContinuation)) return

    const nextScreen = resolvePostAuthScreen(nextIntent, screen, nextContinuation)

    if (!shouldSubmitContinuationBeforeResume(nextContinuation) || !authSession || !authContinuationPlan.canSubmit) {
      setLoginModalState('closed')
      if (nextScreen) navigate(nextScreen)
      return
    }

    setLoginForm((current) => ({
      ...current,
      status: 'submitting',
      result: null,
    }))

    try {
      const result = await submitAuthContinuationPlan(authContinuationPlan, authConfig)
      const submittedContinuation = buildSerializableAuthContinuation(result?.data)

      if (!result.ok) {
        setLoginForm((current) => ({
          ...current,
          status: 'error',
          result,
          continuation: submittedContinuation,
        }))
        return
      }

      const nextResultSummary = buildAuthResultSummary(result, {
        sessionId: authSession.sessionId ?? null,
        accountLabel: authSession.accountLabel ?? null,
        handoffId: authSession.handoffId ?? loginForm.handoffId ?? null,
        wishlistCount: authSession.wishlistCount ?? 0,
        cartCount: authSession.cartCount ?? 0,
        layoutItemCount: authSession.layoutItemCount ?? 0,
        hasRecommendationDraft: authSession.hasRecommendationDraft ?? false,
        guestDraftSummary: authSession.guestDraftSummary ?? null,
        intent: authSession.intent ?? loginForm.intent ?? null,
        connection: authSession.connection ?? authConnectionSummary,
        continuation: authSession.continuation ?? null,
        authMode: authSession.authMode ?? null,
        authTransport: authSession.authTransport ?? null,
      })
      const nextSession = buildPersistedAuthSession(nextResultSummary, {
        intent: authSession.intent ?? loginForm.intent ?? null,
        connection: nextResultSummary.connection ?? authSession.connection ?? authConnectionSummary,
        continuation: submittedContinuation,
        continuationFields: pickPersistedAuthContinuationFields(submittedContinuation, authContinuationFields),
        accountState: result?.data?.accountState ?? authSession.accountState ?? null,
      })

      persistAuthSession(globalThis.localStorage, nextSession)
      setAuthSession(nextSession)
      setLoginForm((current) => ({
        ...current,
        status: 'ready',
        result,
        continuation: submittedContinuation,
      }))
      setLoginModalState('closed')
      if (nextScreen) navigate(nextScreen)
    } catch {
      setLoginForm((current) => ({
        ...current,
        status: 'error',
        result: {
          ok: false,
          status: 0,
          data: { message: 'Continuation request failed' },
        },
      }))
    }
  }, [authConfig, authConnectionSummary, authContinuationPlan, authSession, loginForm.continuation, loginForm.handoffId, loginForm.intent, navigate, screen])

  const handleAuthContinuationFieldChange = React.useCallback((field, value) => {
    const nextFields = buildAuthContinuationFieldState({
      ...authContinuationFields,
      [field]: value,
    })

    setAuthContinuationFields(nextFields)
    setLoginForm((current) => ({
      ...current,
      continuationFields: nextFields,
    }))

    if (authSession) {
      const nextSession = {
        ...authSession,
        continuationFields: buildSerializableAuthContinuationFields(nextFields),
      }
      persistAuthSession(globalThis.localStorage, nextSession)
      setAuthSession(nextSession)
      return
    }

    const currentHandoff = readPersistedAuthHandoff(globalThis.sessionStorage)
    if (currentHandoff) {
      persistAuthHandoff(globalThis.sessionStorage, {
        ...currentHandoff,
        continuationFields: buildSerializableAuthContinuationFields(nextFields),
      })
    }
  }, [authContinuationFields, authSession])

  const handleAuthContinuationSubmit = React.useCallback(async () => {
    if (!authSession || !authContinuationPlan.canSubmit) return

    setLoginForm((current) => ({
      ...current,
      status: 'submitting',
      result: null,
    }))

    try {
      const result = await submitAuthContinuationPlan(authContinuationPlan, authConfig)
      const nextContinuation = buildSerializableAuthContinuation(result?.data)
      const nextIntent = authSession.intent ?? loginForm.intent ?? null

      if (result.ok) {
        const nextResultSummary = buildAuthResultSummary(result, {
          sessionId: authSession.sessionId ?? null,
          accountLabel: authSession.accountLabel ?? null,
          handoffId: authSession.handoffId ?? loginForm.handoffId ?? null,
          wishlistCount: authSession.wishlistCount ?? 0,
          cartCount: authSession.cartCount ?? 0,
          layoutItemCount: authSession.layoutItemCount ?? 0,
          hasRecommendationDraft: authSession.hasRecommendationDraft ?? false,
          guestDraftSummary: authSession.guestDraftSummary ?? null,
          intent: nextIntent,
          connection: authSession.connection ?? authConnectionSummary,
          continuation: authSession.continuation ?? null,
          authMode: authSession.authMode ?? null,
          authTransport: authSession.authTransport ?? null,
        })
        const nextSession = buildPersistedAuthSession(nextResultSummary, {
          intent: nextIntent,
          connection: nextResultSummary.connection ?? authSession.connection ?? authConnectionSummary,
          continuation: nextContinuation,
          continuationFields: pickPersistedAuthContinuationFields(nextContinuation, authContinuationFields),
          accountState: result?.data?.accountState ?? authSession.accountState ?? null,
        })
        const nextScreen = canResumePostAuthIntent(nextIntent, screen, nextContinuation)
          ? resolvePostAuthScreen(nextIntent, screen, nextContinuation)
          : null

        clearPersistedAuthHandoff(globalThis.sessionStorage)
        persistAuthSession(globalThis.localStorage, nextSession)
        setAuthSession(nextSession)
        setAuthContinuationFields(buildAuthContinuationFieldState())
        setLoginForm((current) => ({
          ...current,
          handoffId: nextSession.handoffId ?? current.handoffId ?? null,
          status: 'ready',
          result,
          continuation: nextContinuation,
        }))

        if (nextScreen) {
          setLoginModalState('closed')
          navigate(nextScreen)
          return
        }

        if (shouldCloseLoginModalAfterAuth(result, nextIntent, nextContinuation)) {
          setLoginModalState('closed')
        }

        return
      }

      setLoginForm((current) => ({
        ...current,
        status: 'error',
        result,
        continuation: nextContinuation,
      }))
    } catch {
      setLoginForm((current) => ({
        ...current,
        status: 'error',
        result: {
          ok: false,
          status: 0,
          data: { message: 'Continuation request failed' },
        },
      }))
    }
  }, [authConfig, authConnectionSummary, authContinuationPlan, authSession, loginForm.handoffId, loginForm.intent, navigate, screen])

  const handleLoginSubmit = React.useCallback(async (mergeResolutionOverride = null) => {
    const nextMergeResolution = mergeResolutionOverride ?? loginForm.mergeResolution ?? null
    const nextHandoffId = loginForm.handoffId ?? createAuthHandoffId()
    const shouldResolveMergeViaContinuation = loginForm.continuation?.nextAction === 'confirm-merge-resolution'
      && Boolean(loginForm.continuation?.resumeToken)
      && Boolean(nextMergeResolution)

    const submitPlan = loginForm.mode === 'signup'
      ? {
          ...authSignupPlan,
          handoffId: nextHandoffId,
          request: {
            ...authSignupPlan.request,
            handoffId: nextHandoffId,
          },
          summary: {
            ...authSignupPlan.summary,
            handoffId: nextHandoffId,
          },
        }
      : buildAuthSubmitPlan({
          email: loginForm.email,
          password: loginForm.password,
          guestDraftSnapshot,
          mergeResolution: nextMergeResolution,
          handoffId: nextHandoffId,
          endpoint: authConfig.loginEndpoint,
          intent: buildSerializableAuthIntent(loginForm.intent),
          continuation: buildSerializableAuthContinuation(loginForm.continuation),
          draftSave: authDraftSavePayload,
        })

    const continuationPlan = shouldResolveMergeViaContinuation
      ? buildAuthContinuationPlan({
          endpoint: authConfig.continueEndpoint,
          continuation: loginForm.continuation,
          handoffId: nextHandoffId,
          intent: buildSerializableAuthIntent(loginForm.intent),
          fields: {
            mergeResolution: nextMergeResolution,
          },
          draftSave: authDraftSavePayload,
        })
      : null

    if (!submitPlan.canSubmit && !continuationPlan?.canSubmit) return

    persistAuthHandoff(
      globalThis.sessionStorage,
      buildPersistedAuthHandoff(submitPlan, guestDraftSnapshot, {
        connection: authConnectionSummary,
        continuation: shouldResolveMergeViaContinuation ? loginForm.continuation : null,
        continuationFields: shouldResolveMergeViaContinuation
          ? { mergeResolution: nextMergeResolution }
          : pickPersistedAuthContinuationFields(loginForm.continuation, authContinuationFields),
        draftSave: authDraftSavePayload,
      }),
    )

    setLoginForm((current) => ({
      ...current,
      handoffId: nextHandoffId,
      status: 'submitting',
      result: null,
      mergeResolution: nextMergeResolution,
    }))

    try {
      const result = shouldResolveMergeViaContinuation
        ? await submitAuthContinuationPlan(continuationPlan, authConfig)
        : loginForm.mode === 'signup'
          ? await submitAuthSignupPlan(submitPlan, authConfig)
          : await submitAuthLoginPlan(submitPlan, authConfig)
      const nextContinuation = buildSerializableAuthContinuation(result?.data)
      const nextResultSummary = result.ok
        ? buildAuthResultSummary(result, {
            ...submitPlan.summary,
            connection: authConnectionSummary,
            continuation: loginForm.continuation,
          })
        : null

      if (nextResultSummary) {
        const continuityPatch = buildPostAuthContinuityPatch(result)
        const nextSession = buildPersistedAuthSession(nextResultSummary, {
          guestDraftSnapshot,
          intent: submitPlan.summary.intent,
          connection: nextResultSummary.connection ?? authConnectionSummary,
          continuation: nextContinuation,
          continuationFields: pickPersistedAuthContinuationFields(nextContinuation, authContinuationFields),
          accountState: result?.data?.accountState ?? null,
        })

        if (continuityPatch) {
          setWishlistedIds(continuityPatch.wishlistIds)
          cart.replaceItems(continuityPatch.cartItems)
          editor.replaceItems(continuityPatch.layoutItems)
          setAiForm(
            continuityPatch.recommendationDraft
              ? { ...initialAiForm, ...continuityPatch.recommendationDraft }
              : initialAiForm,
          )
          setEngagement(initialEngagement)
        }

        persistAuthSession(globalThis.localStorage, nextSession)
        clearPersistedAuthHandoff(globalThis.sessionStorage)
        setAuthSession(nextSession)
        setAuthNoticeDismissed(false)
      }

      if (!result.ok) {
        persistAuthHandoff(
          globalThis.sessionStorage,
          buildPersistedAuthHandoff(submitPlan, guestDraftSnapshot, {
            connection: authConnectionSummary,
            continuation: nextContinuation,
            continuationFields: shouldResolveMergeViaContinuation
              ? { mergeResolution: nextMergeResolution }
              : pickPersistedAuthContinuationFields(nextContinuation, authContinuationFields),
            draftSave: authDraftSavePayload,
          }),
        )
      }

      setLoginForm((current) => ({
        ...current,
        status: result.ok ? 'ready' : 'error',
        result,
        continuation: nextContinuation,
        mergeResolution: result.ok ? null : nextMergeResolution,
      }))

      if (shouldCloseLoginModalAfterAuth(result, submitPlan.summary.intent, nextContinuation)) {
        const nextScreen = resolvePostAuthScreen(
          submitPlan.summary.intent,
          screen,
          nextContinuation,
        )
        setLoginModalState('closed')
        if (nextScreen) navigate(nextScreen)
      }
    } catch {
      setLoginForm((current) => ({
        ...current,
        status: 'error',
        result: {
          ok: false,
          status: 0,
          data: { message: 'Network request failed' },
        },
        mergeResolution: nextMergeResolution,
      }))
    }
  }, [authConfig, authConnectionSummary, authContinuationFields, authDraftSavePayload, authSignupPlan, cart, editor, guestDraftSnapshot, loginForm.continuation, loginForm.email, loginForm.handoffId, loginForm.intent, loginForm.mergeResolution, loginForm.mode, loginForm.password, screen])

  const cartActions = {
    openCart: () => cart.setIsOpen(true),
    cartCount: cart.count,
  }

  const trackAiRequest = React.useCallback(() => {
    setEngagement((current) => ({ ...current, aiRequests: current.aiRequests + 1 }))
  }, [])

  const trackBoardProgress = React.useCallback(() => {
    setEngagement((current) => ({ ...current, draftBoards: Math.max(current.draftBoards, 1) }))
  }, [])

  const trackFurniturePlacement = React.useCallback(() => {
    setEngagement((current) => ({
      ...current,
      furniturePlacements: current.furniturePlacements + 1,
      draftBoards: Math.max(current.draftBoards, 1),
    }))
  }, [])

  const addProductToLayout = React.useCallback((product) => {
    editor.addLibraryItem(buildLayoutProduct(product))
    trackFurniturePlacement()
  }, [editor, trackFurniturePlacement])

  const shared = {
    navigate,
    openOverlay,
    quickViewOpen: quickView.open,
    addToCart: cart.addItem,
    onSearchOpen: () => setSearchDrawerOpen(true),
    onOpenLogin: openLogin,
    onAddProductToLayout: addProductToLayout,
    trackBoardProgress,
    trackFurniturePlacement,
    authSession,
    ...cartActions,
  }

  const screenProps = {
    ai: {
      form: aiForm,
      setForm: setAiForm,
      brief: inputBrief,
      summary: aiSummary,
      selectedSpaceSummary,
      onRecommend: () => {
        trackAiRequest()
        navigate('space')
      },
      onApplyToLayout: (product) => {
        addProductToLayout(product)
        navigate('layout')
      },
    },
    space: {
      selectedSpaces: spaceProfile.spaces,
      setSelectedSpaces: (updater) => setSpaceProfile((current) => ({
        ...current,
        spaces: typeof updater === 'function' ? updater(current.spaces) : updater,
      })),
    },
    layout: {
      editor,
      addressSummary: buildLayoutAddressSummary(spaceProfile),
    },
    beds: {
      filters: bedFilters,
      setFilters: setBedFilters,
      items: filteredBedProducts,
      wishlistedIds,
      toggleWishlist: (id) => setWishlistedIds((current) => toggleWishlistId(current, id)),
    },
    home: {
      wishlistedIds,
    },
  }

  return (
    <main className="appShell">
      {authSessionNotice && !authNoticeDismissed && (
        <div className="authSessionNotice" role="status" aria-live="polite">
          <div>
            <strong>{authSessionNotice.title}</strong>
            <p>{authSessionNotice.body}</p>
          </div>
          <div className="authSessionNoticeActions">
            {authReadyPanelState && (
              <button className="ghost minor" onClick={() => openLogin(authSession?.intent ?? null)}>
                {authReadyPanelState.nextAction === 'complete-profile'
                  ? '프로필 이어서 입력'
                  : authReadyPanelState.nextAction === 'verify-email'
                    ? '이메일 인증 이어가기'
                    : '인증 상태 보기'}
              </button>
            )}
            <button className="ghost minor" onClick={handleLogout}>로그아웃</button>
            <button className="ghost minor" onClick={() => setAuthNoticeDismissed(true)}>닫기</button>
          </div>
        </div>
      )}
      <section className={`screenStage ${overlay ? 'overlayOpen' : ''}`}>
        <StageTransition screen={screen} direction={direction}>
          {(visibleScreen) => renderScreen(visibleScreen, { ...shared, ...screenProps[visibleScreen] })}
        </StageTransition>

        {overlay === 'address' && (
          <div className="overlayLayer" role="dialog" aria-modal="true">
            <div className="overlayScrim" onClick={closeOverlay} />
            <div className="overlayPanel">
              <AddressSetupScreen
                navigate={navigate}
                closeOverlay={closeOverlay}
                spaceProfile={spaceProfile}
                setSpaceProfile={setSpaceProfile}
                trackBoardProgress={trackBoardProgress}
                baseZones={baseZones}
                apartmentSearchResults={apartmentSearchResults}
                apartmentTypes={apartmentTypes}
                formatApartmentOption={formatApartmentOption}
              />
            </div>
          </div>
        )}

        {cart.isOpen && (
          <CartDrawer
            cart={cart}
            authSession={authSession}
            onOpenLogin={openLogin}
            onClose={() => cart.setIsOpen(false)}
          />
        )}

        {searchDrawerOpen && (
          <SearchDrawer
            query={searchQuery}
            setQuery={setSearchQuery}
            results={searchDrawerState.results}
            queryLabel={searchDrawerState.queryLabel}
            isEmpty={searchDrawerState.isEmpty}
            onClose={() => setSearchDrawerOpen(false)}
            onPick={(product) => {
              setSearchDrawerOpen(false)
              if (resolveSearchPickMode(product) === 'quickView') quickView.open(product)
              else cart.addItem(product)
            }}
          />
        )}

        {loginModalState !== 'closed' && (
          <LoginModal
            state={loginModalState}
            engagement={loginGuardMetrics}
            reasons={loginGuardReasons}
            form={loginForm}
            authSubmitPlan={authSubmitPlan}
            authSignupPlan={authSignupPlan}
            authContinuationPlan={authContinuationPlan}
            authContinuationFields={authContinuationFields}
            authStatusMessage={authStatusMessage}
            authResultSummary={authResultSummary}
            authErrorSummary={authErrorSummary}
            authConnectionSummary={authConnectionSummary}
            authReadyPanelState={authReadyPanelState}
            guestDraftSnapshot={guestDraftSnapshot}
            onChangeForm={(field, value) => setLoginForm((current) => ({
              ...current,
              [field]: value,
              status: 'idle',
              result: null,
              mergeResolution: field === 'mergeResolution' ? value : null,
            }))}
            onChangeContinuationField={handleAuthContinuationFieldChange}
            onClose={handleCloseLoginModal}
            onProceed={() => {
              setAuthContinuationFields(buildAuthContinuationFieldState(
                loginForm.continuationFields ?? authSession?.continuationFields ?? null,
              ))
              setLoginModalState('form')
            }}
            onDismissResume={handleDismissAuthResume}
            onResumeAuthenticatedIntent={handleResumeAuthenticatedIntent}
            onSubmitContinuation={handleAuthContinuationSubmit}
            onSubmit={handleLoginSubmit}
          />
        )}

        {quickView.product && (
          <QuickViewModal
            product={selectedBed ?? quickView.product}
            onClose={quickView.close}
            onAddToCart={(product) => {
              cart.addItem(product)
              quickView.close()
            }}
            onApplyToLayout={(product) => {
              addProductToLayout(product)
              quickView.close()
              navigate('layout')
            }}
          />
        )}
      </section>
    </main>
  )
}

function renderScreen(screen, props) {
  switch (screen) {
    case 'ai':
      return <AiRecommendScreen {...props} />
    case 'space':
      return <SpaceSelectScreen {...props} />
    case 'layout':
      return <LayoutEditorScreen {...props} />
    case 'beds':
      return <BedsCategoryScreen {...props} />
    case 'home':
    default:
      return <FurnitureHomeScreen {...props} />
  }
}

function AiRecommendScreen({ navigate, openOverlay, openCart, cartCount, onSearchOpen, addToCart, form, setForm, brief, summary, selectedSpaceSummary, onRecommend, onApplyToLayout, onOpenLogin, authSession }) {
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
          <div className="stepDots"><b className="on">1</b><span /><b className="done">2</b><span /><b>3</b></div>
          <h2>AI가 공간에 맞는 가구를 추천해드릴게요</h2>
          <p className="muted">아파트 타입, 원하는 공간, 선호 스타일을 직접 바꾸면 추천 문구와 강조 상태가 함께 반영됩니다.</p>
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
          <p className="fieldHint">{roomHint}</p>
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
          <p className="fieldHint">선택한 우선 기준과 라이프스타일이 오른쪽 추천 결과 요약과 AI 코멘트에 바로 반영돼요.</p>
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

function SpaceSelectScreen({ navigate, openOverlay, openCart, cartCount, onSearchOpen, selectedSpaces, setSelectedSpaces, onOpenLogin, authSession }) {
  return (
    <div className="screenCanvas sandBg">
      <Header active="AI 추천" onNavigate={navigate} onOpenOverlay={openOverlay} onOpenCart={openCart} cartCount={cartCount} onSearchOpen={onSearchOpen} onOpenLogin={onOpenLogin} authSession={authSession} />
      <section className="cardStage">
        <div className="cardSurface">
          <div className="progressBar"><span className="fill wide" /></div>
          <p className="tinyPill">평면도 기반 선택</p>
          <h2>어떤 공간을 먼저 꾸밀까요?</h2>
          <p className="muted">평면도 영역과 오른쪽 요약 패널이 같은 선택 상태를 공유합니다. 최소 1개 이상 선택할 수 있어요.</p>
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

function LayoutEditorScreen({ navigate, openOverlay, openCart, cartCount, onSearchOpen, editor, addToCart, addressSummary, onOpenLogin, onAddProductToLayout, authSession }) {
  const selectedMeta = React.useMemo(
    () => findLibraryItemMeta(libraryItems, editor.selected?.sourceId),
    [editor.selected?.sourceId],
  )
  const [activeCategory, setActiveCategory] = React.useState('전체')
  const [librarySearch, setLibrarySearch] = React.useState('')
  const roomFrameRef = React.useRef(null)

  const visibleLibrary = React.useMemo(
    () => buildVisibleLibrary(libraryItems, activeCategory, librarySearch),
    [activeCategory, librarySearch],
  )
  const libraryEmptyState = React.useMemo(
    () => buildLibraryEmptyState(activeCategory, librarySearch),
    [activeCategory, librarySearch],
  )
  const toolbarButtons = React.useMemo(
    () => buildLayoutEditorToolbarButtons(editor.activeTool, { canUndo: editor.canUndo }),
    [editor.activeTool, editor.canUndo],
  )
  const infoPills = React.useMemo(
    () => buildLayoutEditorInfoPills({
      snapOn: editor.snapOn,
      itemCount: editor.items.length,
    }),
    [editor.items.length, editor.snapOn],
  )
  const propertyPanelState = React.useMemo(
    () => buildLayoutEditorPropertyPanelState(editor.selected, selectedMeta),
    [editor.selected, selectedMeta],
  )
  const editorHint = React.useMemo(
    () => buildLayoutEditorHint({ snapOn: editor.snapOn }),
    [editor.snapOn],
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
  }, [editor])

  const toolbarCommandHandlers = React.useMemo(
    () => createLayoutEditorToolbarHandlers(editor),
    [editor],
  )
  const actionCommandHandlers = React.useMemo(
    () => createLayoutEditorActionHandlers({ navigate, openOverlay, addToCart, editor, selectedMeta }),
    [addToCart, editor, navigate, openOverlay, selectedMeta],
  )

  const handleToolbarAction = React.useCallback((toolId) => {
    runLayoutEditorCommands(buildLayoutEditorToolbarCommands(toolId), toolbarCommandHandlers)
  }, [toolbarCommandHandlers])

  const handleActionButton = React.useCallback((action) => {
    runLayoutEditorCommands(buildLayoutEditorActionCommands(action), actionCommandHandlers)
  }, [actionCommandHandlers])

  return (
    <div className="screenCanvas editorBg">
      <Header dark active="내가 배치하기" onNavigate={navigate} onOpenOverlay={openOverlay} onOpenCart={openCart} cartCount={cartCount} onSearchOpen={onSearchOpen} onOpenLogin={onOpenLogin} authSession={authSession} />
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
              <span>{addressSummary}</span>
              <button className={`metaToggle ${editor.snapOn ? 'on' : ''}`} onClick={() => editor.setSnapOn((current) => !current)}>{editor.snapOn ? '스냅 ON' : '스냅 OFF'}</button>
              <span>{editor.notice}</span>
            </div>
            <div className="editorHintRow">
              <span className="editorHintBadge">{editorHint.badge}</span>
              <p>{editorHint.description}</p>
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
            {aiProducts.map((item) => (
              <button key={item.id} className="recommendCard buttonCard" onClick={() => onAddProductToLayout(item)}>
                <div>{item.emoji}</div><strong>{item.name}</strong><small>{item.priceLabel}</small>
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
          <div className="propBlock"><label>이동 방식</label><p>{propertyPanelState.movementNote}</p></div>
          <div className="propBlock actionBlock">
            {!authSession && (
              <button
                className="ghost"
                onClick={() => onOpenLogin({
                  source: 'layout-editor',
                  action: 'save-layout-draft',
                  label: '로그인 후 보드 저장',
                  draftLabel: addressSummary,
                  returnScreen: 'layout',
                })}
              >
                로그인 후 보드 저장
              </button>
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

function BedsCategoryScreen({ navigate, openOverlay, openCart, cartCount, onSearchOpen, quickViewOpen, addToCart, filters, setFilters, items, wishlistedIds, toggleWishlist, onOpenLogin, authSession }) {
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

function FurnitureHomeScreen({ navigate, openOverlay, openCart, cartCount, onSearchOpen, addToCart, onOpenLogin, trackBoardProgress, authSession }) {
  return (
    <div className="screenCanvas plainBg">
      <Header active="가구 먼저 찾기" onNavigate={navigate} onOpenOverlay={openOverlay} onOpenCart={openCart} cartCount={cartCount} onSearchOpen={onSearchOpen} onOpenLogin={onOpenLogin} authSession={authSession} />
      <section className="heroBanner">
        <div>
          <div className="eyebrow darkEyebrow">FURNITURE FIRST</div>
          <h2>먼저 가구를 찾고, <em>내 공간 적합도</em>를 확인하세요</h2>
          <p>홈 → 카테고리 → 배치하기 흐름이 새 페이지 로딩처럼 느껴지지 않도록 유지하면서, 검색/장바구니/빠른 연결 요소들을 실제로 반응하게 만들었습니다.</p>
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

function CartDrawer({ cart, authSession, onOpenLogin, onClose }) {
  return (
    <div className="drawerLayer" role="dialog" aria-modal="true">
      <div className="overlayScrim" onClick={onClose} />
      <aside className="drawerPanel">
        <div className="overlayHeader"><span>장바구니</span><button className="overlayClose" onClick={onClose}>✕</button></div>
        <div className="drawerBody">
          {!cart.items.length ? (
            <div className="emptyState"><div className="emptyEmoji">🛒</div><strong>장바구니가 비어있어요</strong><p>추천 상품에서 ‘담기’를 눌러 프론트 전용 장바구니 흐름을 테스트해보세요.</p></div>
          ) : (
            <>
              <div className="cartList">
                {cart.items.map((item) => (
                  <div key={item.id} className="cartItem">
                    <div><strong>{item.name}</strong><small>{formatPrice(item.price)}</small></div>
                    <div className="qtyStepper"><button onClick={() => cart.updateQty(item.id, -1)}>-</button><b>{item.qty}</b><button onClick={() => cart.updateQty(item.id, 1)}>+</button></div>
                  </div>
                ))}
              </div>
              <div className="cartSummary"><span>소계</span><strong>{formatPrice(cart.subtotal)}</strong></div>
              <div className="footerButtons stackOnMobile">
                <button className="ghost" onClick={cart.clear}>비우기</button>
                <button
                  className="cta"
                  onClick={() => {
                    if (authSession) return
                    onOpenLogin({
                      source: 'cart-drawer',
                      action: 'checkout-cart',
                      label: '로그인 후 주문 이어가기',
                      draftLabel: `장바구니 ${cart.count}개`,
                      returnScreen: 'home',
                    })
                  }}
                >
                  {authSession ? '주문하기 (데모)' : '로그인 후 주문 이어가기'}
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

function SearchDrawer({ query, setQuery, results, queryLabel, isEmpty, onClose, onPick }) {
  return (
    <div className="drawerLayer" role="dialog" aria-modal="true">
      <div className="overlayScrim" onClick={onClose} />
      <aside className="drawerPanel searchDrawer">
        <div className="overlayHeader"><span>통합 검색</span><button className="overlayClose" onClick={onClose}>✕</button></div>
        <div className="drawerBody">
          <div className="inputWrap big">🔎<input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="가구명, 소재, 컬러, 카테고리를 검색해보세요" /></div>
          <div className="searchResults">
            {isEmpty ? (
              <div className="emptyState compact">
                <div>
                  <div className="emptyEmoji">🔎</div>
                  <strong>{`"${queryLabel}"에 맞는 결과가 아직 없어요`}</strong>
                  <p>가구명, 소재, 컬러 키워드로 다시 찾아보거나 검색어를 지워 전체 추천을 확인해보세요.</p>
                </div>
              </div>
            ) : results.map((item) => (
              <button key={item.id} className="searchResult" onClick={() => onPick(item)}>
                <span>{item.emoji}</span>
                <div><strong>{item.name}</strong><small>{item.searchMeta || item.priceLabel || formatPrice(item.price)}</small></div>
                <small>{item.priceLabel ?? formatPrice(item.price)}</small>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}


function LoginModal({ state, engagement, reasons, form, authSubmitPlan, authSignupPlan, authContinuationPlan, authContinuationFields, authStatusMessage, authResultSummary, authErrorSummary, authConnectionSummary, authReadyPanelState, guestDraftSnapshot, onChangeForm, onChangeContinuationField, onClose, onProceed, onDismissResume, onResumeAuthenticatedIntent, onSubmitContinuation, onSubmit }) {
  const guarded = state === 'guard'
  const allowedMergeResolutions = authErrorSummary?.allowedMergeResolutions ?? []
  const modeLabels = buildAuthModeLabels(form.mode)
  const activePlan = form.mode === 'signup' ? authSignupPlan : authSubmitPlan
  const guardPanelState = buildAuthGuardPanelState({
    engagement,
    reasons,
    guestDraftSnapshot,
    authSummary: authSubmitPlan.summary,
    connection: authConnectionSummary,
    intent: form.intent,
  })
  const mergeResolutionLabels = {
    'replace-with-account': '계정 상태로 전환',
    'keep-guest': '현재 초안으로 계속',
  }
  const mergeResolutionPreviewCopy = {
    'replace-with-account': '계정에 저장된 상태를 우선 적용하고, 현재 게스트 handoff는 비교 문맥으로만 유지해 `/api/auth/continue` 재개 요청을 보냅니다.',
    'keep-guest': '지금 보고 있던 게스트 초안을 우선 유지하고, 같은 handoff와 resume token으로 `/api/auth/continue` 재개 요청을 보냅니다.',
  }

  return (
    <div className="overlayLayer" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="overlayScrim" onClick={onClose} />
      <div className="loginPanel">
        <div className="overlayHeader">
          <span>{guarded ? '로그인 전 확인' : 'HAVENLY 로그인'}</span>
          <button className="overlayClose" onClick={onClose}>✕</button>
        </div>
        <div className="loginContent">
          <div className="loginBadge">{guarded ? 'ACCOUNT' : modeLabels.badge}</div>
          <h2 id="login-title">{guarded ? '진행 중인 작업이 있어요. 그대로 로그인할까요?' : modeLabels.title}</h2>
          <p className="muted">{guarded ? '게스트 상태에서 만든 초안과 활동이 있어 먼저 안내해드려요. 계속하면 계정과 연결하거나 새 상태로 전환될 수 있습니다.' : form.mode === 'signup' ? '현재 초안과 추천 상태를 유지한 채 새 계정을 만들고 바로 이어갈 수 있게 연결합니다.' : '페이지를 떠나지 않고 바로 계정을 연결하는 온보딩 블록입니다. 저장한 보드, AI 추천 이력, 찜 목록을 한 번에 이어볼 수 있어요.'}</p>

          {guarded ? (
            <>
              <div className="loginGuardCard">
                <strong>현재 감지된 진행 내역</strong>
                <div className="loginReasonList">
                  {reasons.map((reason) => <span key={reason}>{reason}</span>)}
                </div>
                <div className="guardSummary">
                  <div><label>AI 요청</label><b>{engagement.aiRequests}회</b></div>
                  <div><label>가구 배치</label><b>{engagement.furniturePlacements}회</b></div>
                  <div><label>보드 초안</label><b>{engagement.draftBoards}개</b></div>
                  <div><label>찜</label><b>{engagement.wishlistCount}개</b></div>
                  <div><label>장바구니</label><b>{engagement.cartCount}개</b></div>
                </div>
              </div>
              <div className="loginGuardCard">
                <strong>로그인 시 함께 넘길 초안</strong>
                <div className="guardSummary compact">
                  <div><label>선택 공간</label><b>{guardPanelState.selectedSpaceCount}개</b></div>
                  <div><label>추천 초안</label><b>{guardPanelState.recommendationRoom ?? '없음'}</b></div>
                  <div><label>배치 아이템</label><b>{guardPanelState.layoutItemCount}개</b></div>
                  {guardPanelState.handoffId && <div><label>handoff</label><b>{guardPanelState.handoffId}</b></div>}
                </div>
                {guardPanelState.draftContextBits.length > 0 && (
                  <p className="muted">현재 게스트 문맥: {guardPanelState.draftContextBits.join(' · ')}</p>
                )}
                {guardPanelState.draftSaveBits.length > 0 && (
                  <p className="muted">draftSave handoff: {guardPanelState.draftSaveBits.join(' · ')}</p>
                )}
                {guardPanelState.intentLabel && (
                  <p className="muted">로그인 목적: {guardPanelState.intentLabel}{guardPanelState.intentDraftLabel ? ` · ${guardPanelState.intentDraftLabel}` : ''}</p>
                )}
                {guardPanelState.connectionLabel && (
                  <p className="muted">연결 대상: {guardPanelState.connectionLabel}{guardPanelState.connectionEndpoint ? ` (${guardPanelState.connectionEndpoint})` : ''} · {guardPanelState.connectionCredentialsMode ?? 'include'} credentials{guardPanelState.connectionSource ? ` · ${guardPanelState.connectionSource}` : ''}</p>
                )}
              </div>
              <div className="footerButtons stackOnMobile">
                <button className="ghost" onClick={onClose}>계속 둘러보기</button>
                <button className="cta" onClick={onProceed}>그래도 로그인하기</button>
              </div>
            </>
          ) : form.status === 'ready' && authReadyPanelState ? (
            <div className="loginForm">
              <div className="loginGuardCard authPrepCard">
                <strong>{authReadyPanelState.title}</strong>
                <p className="muted">{authReadyPanelState.subtitle}</p>
                <p className="muted">이어갈 작업: {authReadyPanelState.intentLabel}{authReadyPanelState.intentDraftLabel ? ` · ${authReadyPanelState.intentDraftLabel}` : ''}</p>
                {authReadyPanelState.primaryActionHint && <p className="muted">{authReadyPanelState.primaryActionHint}</p>}
                {authReadyPanelState.primaryActionDisabled && (
                  <p className="muted">이 단계는 아직 별도 화면까지 붙지 않았지만, backend 재개 계약과 필요한 handoff 정보를 여기서 바로 확인하고 최소 payload로 다음 단계를 시험 연결할 수 있어요.</p>
                )}
                {(authReadyPanelState.nextAction || authReadyPanelState.continuationStatusLabel || authReadyPanelState.continuationStatus) && (
                  <p className="muted">백엔드 다음 액션: {authReadyPanelState.nextAction ?? 'next-action 미정'}{authReadyPanelState.resumeToken ? ` · token ${authReadyPanelState.resumeToken}` : ''}{authReadyPanelState.continuationStatusLabel ? ` · ${authReadyPanelState.continuationStatusLabel}` : authReadyPanelState.continuationStatus ? ` · ${authReadyPanelState.continuationStatus}` : ''}</p>
                )}
                {authReadyPanelState.nextAction === 'complete-profile' && (
                  <div className="loginGuardCard authPrepCard">
                    <strong>프로필 보완 payload</strong>
                    <label>닉네임</label>
                    <div className="inputWrap big">👤<input value={authContinuationFields.displayName} onChange={(event) => onChangeContinuationField('displayName', event.target.value)} placeholder="홍길동" /></div>
                    <label>연락처</label>
                    <div className="inputWrap big">📱<input value={authContinuationFields.phone} onChange={(event) => onChangeContinuationField('phone', event.target.value)} placeholder="010-1234-5678" /></div>
                    <p className="muted">직렬화 가능한 최소 필드만 `/api/auth/continue`로 전달해 scaffold 응답과 세션 갱신을 확인합니다.</p>
                  </div>
                )}
                {authReadyPanelState.nextAction === 'verify-email' && (
                  <div className="loginGuardCard authPrepCard">
                    <strong>이메일 인증 payload</strong>
                    <label>인증 코드</label>
                    <div className="inputWrap big">✅<input value={authContinuationFields.verificationCode} onChange={(event) => onChangeContinuationField('verificationCode', event.target.value)} placeholder="123456" /></div>
                    <p className="muted">실제 인증 UI 전 단계로, token을 유지한 채 최소 확인 payload만 `/api/auth/continue`로 보냅니다.</p>
                  </div>
                )}
                {authContinuationPlan.summary.missingFields.length > 0 && (
                  <p className="muted">계속하려면 {authContinuationPlan.summary.missingFields.join(', ')} 필드를 먼저 채워주세요.</p>
                )}
                {authReadyPanelState.connectionLabel && (
                  <p className="muted">연결 대상: {authReadyPanelState.connectionLabel}{authReadyPanelState.connectionEndpoint ? ` (${authReadyPanelState.connectionEndpoint})` : ''}</p>
                )}
                {authReadyPanelState.actionChecklist && (
                  <div className="loginGuardCard authPrepCard">
                    <strong>{authReadyPanelState.actionChecklist.title}</strong>
                    <p className="muted">{authReadyPanelState.actionChecklist.description}</p>
                    <ul className="authChecklist">
                      {authReadyPanelState.actionChecklist.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}
                <div className="guardSummary compact">
                  <div><label>계정</label><b>{authReadyPanelState.accountLabel}</b></div>
                  {authReadyPanelState.sessionId && <div><label>세션</label><b>{authReadyPanelState.sessionId}</b></div>}
                  {authReadyPanelState.handoffId && <div><label>handoff</label><b>{authReadyPanelState.handoffId}</b></div>}
                  {authReadyPanelState.mergeMode && <div><label>병합 상태</label><b>{authReadyPanelState.mergeMode}</b></div>}
                  {authReadyPanelState.returnScreen && <div><label>복귀 화면</label><b>{authReadyPanelState.returnScreen}</b></div>}
                  {authReadyPanelState.restoredBits.map((bit) => <div key={bit}><label>복원</label><b>{bit}</b></div>)}
                  {authReadyPanelState.draftContextBits.map((bit) => <div key={bit}><label>초안</label><b>{bit}</b></div>)}
                  {authReadyPanelState.draftSaveBits.map((bit) => <div key={bit}><label>draftSave</label><b>{bit}</b></div>)}
                </div>
              </div>
              <div className="footerButtons stackOnMobile">
                <button className="ghost" onClick={onClose}>닫기</button>
                {authReadyPanelState.nextAction === 'complete-profile' || authReadyPanelState.nextAction === 'verify-email' ? (
                  <button className="cta" disabled={!authContinuationPlan.canSubmit || form.status === 'submitting'} onClick={onSubmitContinuation}>
                    {form.status === 'submitting' ? '연결 중…' : authReadyPanelState.primaryActionLabel}
                  </button>
                ) : authReadyPanelState.primaryActionDisabled ? (
                  <button className="cta" disabled={!authContinuationPlan.canSubmit || form.status === 'submitting'} onClick={onSubmitContinuation}>
                    {form.status === 'submitting' ? '연결 중…' : authReadyPanelState.primaryActionLabel}
                  </button>
                ) : (
                  <button className="cta" disabled={form.status === 'submitting'} onClick={onResumeAuthenticatedIntent}>
                    {form.status === 'submitting' ? '연결 중…' : authReadyPanelState.primaryActionLabel}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="authModeSwitch" role="tablist" aria-label="인증 방식 선택">
                <button className={form.mode === 'login' ? 'solid mini' : 'mini'} onClick={() => onChangeForm('mode', 'login')}>로그인</button>
                <button className={form.mode === 'signup' ? 'solid mini' : 'mini'} onClick={() => onChangeForm('mode', 'signup')}>회원가입</button>
              </div>
              <div className="loginBenefits">
                <div><strong>AI 이력 저장</strong><span>공간별 추천 결과를 다시 불러올 수 있어요.</span></div>
                <div><strong>보드 이어서 작업</strong><span>배치 중인 가구와 평면도 초안을 계정에 연결합니다.</span></div>
                {form.intent?.label && <div><strong>이번 로그인 목적</strong><span>{form.intent.label}{form.intent.draftLabel ? ` · ${form.intent.draftLabel}` : ''}</span></div>}
                <div><strong>백엔드 전달 준비</strong><span>{activePlan.endpoint} 요청에 게스트 초안과 intent handoff를 같이 묶도록 구조를 맞췄어요.</span></div>
                <div><strong>연결 대상</strong><span>{authConnectionSummary.targetLabel} · {authConnectionSummary.method} {authConnectionSummary.endpoint}</span></div>
                <div><strong>인증 전송</strong><span>{authConnectionSummary.credentialsMode} credentials · {authConnectionSummary.source === 'default' ? '기본 same-origin scaffold' : authConnectionSummary.source}</span></div>
              </div>
              <div className="loginForm">
                {form.mode === 'signup' && (
                  <>
                    <label>이름</label>
                    <div className="inputWrap big">👤<input value={form.displayName} onChange={(event) => onChangeForm('displayName', event.target.value)} placeholder="홍길동" /></div>
                  </>
                )}
                <label>이메일</label>
                <div className="inputWrap big">✉️<input value={form.email} onChange={(event) => onChangeForm('email', event.target.value)} placeholder="name@example.com" /></div>
                <label>비밀번호</label>
                <div className="inputWrap big">🔒<input type="password" value={form.password} onChange={(event) => onChangeForm('password', event.target.value)} placeholder="8자 이상 입력" /></div>
                {form.mode === 'signup' && (
                  <>
                    <label>비밀번호 확인</label>
                    <div className="inputWrap big">✅<input type="password" value={form.confirmPassword} onChange={(event) => onChangeForm('confirmPassword', event.target.value)} placeholder="비밀번호를 한 번 더 입력" /></div>
                    <label className="authCheckbox"><input type="checkbox" checked={form.agreeToTerms} onChange={(event) => onChangeForm('agreeToTerms', event.target.checked)} /> <span>이 데모 계정을 만들고 현재 초안을 계정에 연결하는 데 동의합니다.</span></label>
                  </>
                )}
                <div className="loginGuardCard authPrepCard">
                  <strong>연결 준비 상태</strong>
                  <p className="muted">{authStatusMessage}</p>
                  {form.handoff && (
                    <p className="muted">이전 시도: {form.handoff.submittedAt} · handoff {form.handoff.handoffId || form.handoff.summary?.handoffId || '미생성'} · 이메일 {form.handoff.email || '미입력'}{form.connection?.targetLabel ? ` · 대상 ${form.connection.targetLabel}${form.connection.endpoint ? ` (${form.connection.endpoint})` : ''}` : ''}</p>
                  )}
                  {form.continuation && (
                    <p className="muted">백엔드 재개 계약: {form.continuation.nextAction ?? 'next-action 미정'}{form.continuation.resumeToken ? ` · token ${form.continuation.resumeToken}` : ''}</p>
                  )}
                  {form.status === 'resume-ready' && form.connection?.resolvedUrl && form.connection.resolvedUrl !== authConnectionSummary.resolvedUrl && (
                    <p className="muted">현재 auth 설정은 {authConnectionSummary.targetLabel}{authConnectionSummary.endpoint ? ` (${authConnectionSummary.endpoint})` : ''}로 바뀌어 있어요. 재시도하면 새 대상에 맞춰 다시 연결합니다.</p>
                  )}
                  {authErrorSummary && (
                    <p className="muted">오류 분류: {authErrorSummary.tone === 'credentials' ? '자격 증명' : authErrorSummary.tone === 'merge' ? '초안 병합' : authErrorSummary.tone === 'service' ? '인증 서비스' : '기타'}</p>
                  )}
                  {form.mergeResolution && (
                    <div className="loginGuardCard authPrepCard">
                      <strong>병합 재개 payload 미리보기</strong>
                      <p className="muted">병합 확정: {form.mergeResolution === 'keep-guest' ? '현재 게스트 초안을 유지하며 계속 진행' : form.mergeResolution === 'replace-with-account' ? '계정 상태를 우선 적용하며 계속 진행' : form.mergeResolution}</p>
                      <p className="muted">재개 계약: {form.continuation?.nextAction ?? 'confirm-merge-resolution'}{form.continuation?.resumeToken ? ` · token ${form.continuation.resumeToken}` : ''} · mergeResolution {form.mergeResolution}</p>
                      <p className="muted">제출 대상: {authConnectionSummary.targetLabel}{authConnectionSummary.endpoint ? ` (${authConnectionSummary.endpoint})` : ''} → /api/auth/continue</p>
                      <p className="muted">{mergeResolutionPreviewCopy[form.mergeResolution] ?? '선택한 병합 기준으로 현재 인증 handoff를 다시 이어갑니다.'}</p>
                    </div>
                  )}
                  {form.intent?.label && (
                    <p className="muted">{form.mode === 'signup' ? '회원가입 후 이어갈 작업' : '로그인 후 이어갈 작업'}: {form.intent.label}{form.intent.draftLabel ? ` · ${form.intent.draftLabel}` : ''}</p>
                  )}
                  {activePlan.summary.draftSave && (
                    <p className="muted">draftSave handoff: {[
                      activePlan.summary.draftSave.draftLabel ? `초안 ${activePlan.summary.draftSave.draftLabel}` : null,
                      activePlan.summary.draftSave.apartmentLabel,
                      activePlan.summary.draftSave.recommendationRoom ? `${activePlan.summary.draftSave.recommendationRoom} 추천` : null,
                      activePlan.summary.draftSave.selectedSpaceIds?.length ? `선택 공간 ${activePlan.summary.draftSave.selectedSpaceIds.length}개` : null,
                      activePlan.summary.draftSave.layoutItemCount ? `저장 배치 ${activePlan.summary.draftSave.layoutItemCount}개` : null,
                    ].filter(Boolean).join(' · ')}</p>
                  )}
                  <div className="guardSummary compact">
                    <div><label>handoff</label><b>{activePlan.summary.handoffId ?? '미생성'}</b></div>
                    <div><label>찜</label><b>{activePlan.summary.wishlistCount}개</b></div>
                    <div><label>장바구니</label><b>{activePlan.summary.cartCount}개</b></div>
                    <div><label>배치</label><b>{activePlan.summary.layoutItemCount}개</b></div>
                    <div><label>대상</label><b>{authConnectionSummary.targetLabel}</b></div>
                    {authResultSummary?.accountLabel && <div><label>계정</label><b>{authResultSummary.accountLabel}</b></div>}
                    {authResultSummary?.sessionId && <div><label>세션</label><b>{authResultSummary.sessionId}</b></div>}
                    {authResultSummary?.mergeMode && <div><label>병합 상태</label><b>{authResultSummary.mergeMode}</b></div>}
                    {form.continuation?.nextAction && <div><label>다음 액션</label><b>{form.continuation.nextAction}</b></div>}
                    {form.continuation?.resumeToken && <div><label>재개 토큰</label><b>{form.continuation.resumeToken}</b></div>}
                    {authResultSummary?.restoredWishlistCount !== null && authResultSummary?.mergeMode && <div><label>복원 찜</label><b>{authResultSummary.restoredWishlistCount}개</b></div>}
                    {authResultSummary?.restoredCartCount !== null && authResultSummary?.mergeMode && <div><label>복원 장바구니</label><b>{authResultSummary.restoredCartCount}개</b></div>}
                    {authResultSummary?.restoredLayoutItemCount !== null && authResultSummary?.mergeMode && <div><label>복원 배치</label><b>{authResultSummary.restoredLayoutItemCount}개</b></div>}
                    {authResultSummary?.mergeMode && <div><label>추천 초안</label><b>{authResultSummary.restoredRecommendationDraft ? '복원됨' : '없음'}</b></div>}
                  </div>
                </div>
                <div className="footerButtons stackOnMobile">
                  <button className="ghost" onClick={() => onChangeForm('mode', modeLabels.alternateMode)}>{modeLabels.alternateLabel}</button>
                  {form.status === 'resume-ready' && (
                    <button className="ghost" onClick={onDismissResume}>이전 로그인 시도 지우기</button>
                  )}
                  {authErrorSummary?.tone === 'merge' && form.status !== 'ready' && allowedMergeResolutions.map((resolution) => (
                    <button key={resolution} className="ghost" onClick={() => onChangeForm('mergeResolution', resolution)}>
                      {form.mergeResolution === resolution ? `선택됨 · ${mergeResolutionLabels[resolution] ?? resolution}` : (mergeResolutionLabels[resolution] ?? resolution)}
                    </button>
                  ))}
                  {authErrorSummary?.tone === 'merge' && form.status !== 'ready' && allowedMergeResolutions.length === 0 && (
                    <span className="muted">이 auth scaffold는 아직 병합 선택지를 내려주지 않아 같은 handoff로 재시도만 준비된 상태예요.</span>
                  )}
                  <button
                    className="cta"
                    disabled={(!activePlan.canSubmit && !(authErrorSummary?.tone === 'merge' && form.mergeResolution)) || form.status === 'submitting'}
                    onClick={() => onSubmit()}
                  >
                    {form.status === 'submitting'
                      ? '준비 중…'
                      : authErrorSummary?.tone === 'merge' && form.mergeResolution
                        ? `${mergeResolutionLabels[form.mergeResolution] ?? form.mergeResolution}로 계속`
                        : modeLabels.submitLabel}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickViewModal({ product, onClose, onAddToCart, onApplyToLayout }) {
  return (
    <div className="overlayLayer" role="dialog" aria-modal="true">
      <div className="overlayScrim" onClick={onClose} />
      <div className="quickViewPanel">
        <div className="overlayHeader"><span>빠른 보기</span><button className="overlayClose" onClick={onClose}>✕</button></div>
        <div className="quickViewContent">
          <div className="quickHero">{product.emoji}</div>
          <div>
            <p className="tinyPill">{product.badge ?? '추천 상품'}</p>
            <h3>{product.name}</h3>
            <p className="muted">{product.blurb ?? '공간에 맞는 배치 정보와 상품 요약을 바로 확인할 수 있어요.'}</p>
            <div className="quickMeta"><span>{product.fit ?? `AI 적합도 ${product.fitScore}%`}</span><span>{product.material ?? product.category}</span><span>{product.size ?? '배치 가능'}</span></div>
            <strong className="quickPrice">{product.priceLabel ?? formatPrice(product.price)}</strong>
            <div className="footerButtons stackOnMobile"><button className="ghost" onClick={() => onApplyToLayout(product)}>배치안에 적용</button><button className="cta" onClick={() => onAddToCart(product)}>장바구니 담기</button></div>
          </div>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
