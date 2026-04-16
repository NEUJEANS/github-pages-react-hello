import React from 'react'
import { applyApartmentSelection } from './components/address-and-space-selection-state.js'
import { buildSelectedSpaceSummary } from './components/selected-space-summary-state.js'
import { buildAuthDraftSavePayload } from './components/auth-draft-save-payload.js'
import { buildLoginGuardSnapshot } from './components/login-guard.js'
import {
  buildAuthContinuationPlan,
  buildAuthErrorSummary,
  buildAuthResultSummary,
  buildAuthStatusCopy,
  buildAuthSubmitPlan,
  buildGuestDraftSnapshot,
  resolveContinuationSubmitIntent,
} from './components/auth-flow-state.js'
import { readAuthPending, readAuthSession, signOutAuthSession, submitAuthContinuationPlan, submitAuthLoginPlan, submitAuthSignupPlan } from './components/auth-submit.js'
import { detectLocalPagesAuthConfig, resolveAuthConfig } from './components/auth-config.js'
import { openIdentityVerificationWindow, readIdentityVerificationStatus, startIdentityVerification } from './components/auth-verification.js'
import { trackLayoutComponentEvent } from './components/layout-backend.js'
import { buildLayoutAuthPanelState } from './components/layout-auth-panel-state.js'
import {
  buildAuthConnectionSummary,
  buildAuthReadyState,
  buildAuthResumeState,
  buildPersistedAuthHandoff,
  buildSerializableAuthContinuation,
  buildSerializableAuthContinuationFields,
  buildSerializableAuthIntent,
  resolveAuthConnectionOverride,
  resolvePersistedAuthConnection,
  hasAuthConnectionDrift,
  buildAuthConnectionDriftSummary,
  buildPersistedAuthSession,
  clearPersistedAuthHandoff,
  clearPersistedAuthSession,
  createAuthHandoffId,
  persistAuthHandoff,
  persistAuthSession,
  readPersistedAuthHandoff,
  readPersistedAuthSession,
} from './components/auth-storage.js'
import {
  buildAuthReadyPanelState,
  buildAuthResumePanelState,
  buildAuthSessionNotice,
  resolveAuthSessionNoticePrimaryAction,
  shouldAutoOpenAuthReadyPanel,
} from './components/auth-session-view-state.js'
import { LoginModal } from './components/auth-modal.jsx'
import { buildAccountContinuityPatch, buildRestoredRecommendationDraft } from './components/auth-account-continuity.js'
import { buildPostAuthContinuityPatch } from './components/auth-session-merge.js'
import { buildPostAuthSessionRestorePatch, shouldApplyPostAuthSessionRestore } from './components/auth-session-restore.js'
import { shouldPreservePersistedAuthSessionOnBootstrapFailure } from './components/auth-bootstrap-state.js'
import {
  canResumePostAuthIntent,
  resolvePostAuthScreen,
  shouldAttachDraftSaveToAuthContinuation,
  shouldAutoResumeReadyAuthModal,
  shouldCloseLoginModalAfterAuth,
  shouldOpenCartAfterAuthResume,
  shouldSubmitContinuationBeforeResume,
} from './components/auth-intent-state.js'
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
} from './components/recommendation-layout-derivations.js'
import {
  buildPlacedLibraryItem,
  resolveAnimatedTarget,
  resolveDragPosition,
  resolveMovedItemPosition,
  resolveRoomClickTarget,
  stepToward,
} from './components/layout-canvas-editor-state.js'
import {
  buildNavigationHash,
  getDirectionalTransition,
  parseHashState,
} from './components/spa-hash-navigation-state.js'
import { buildLayoutProduct } from './components/catalog-product-selection-state.js'
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
import { AiRecommendPage, SpaceSelectPage } from './pages/recommendation-onboarding-pages.jsx'
import { LayoutEditorPage } from './pages/layout-editor-page.jsx'
import { BedsCategoryPage, FurnitureHomePage } from './pages/catalog-shopping-pages.jsx'
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
  mergeResolution: '',
}

function buildAuthContinuationFieldState(fields = null) {
  return {
    ...initialAuthContinuationFields,
    ...(buildSerializableAuthContinuationFields(fields) ?? {}),
  }
}

function pickPersistedAuthContinuationFields(continuation = null, fields = null) {
  const nextAction = typeof continuation?.nextAction === 'string' ? continuation.nextAction.trim() : ''
  if (nextAction !== 'complete-profile' && nextAction !== 'verify-email' && nextAction !== 'confirm-merge-resolution') return null
  return buildSerializableAuthContinuationFields(fields)
}

const roomOptions = ['거실', '침실', '주방', '서재']

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

const baseZones = [
  { id: 'living', icon: '🛋️', name: '거실', size: '23.4㎡', className: 'living', selected: true },
  { id: 'kitchen', icon: '🍳', name: '주방', size: '11.2㎡', className: 'kitchen', selected: false },
  { id: 'bed1', icon: '🛏️', name: '안방', size: '14.8㎡', className: 'bed1', selected: true },
  { id: 'bed2', icon: '📚', name: '침실/서재', size: '9.1㎡', className: 'bed2', selected: false },
  { id: 'bath', icon: '🛁', name: '욕실', size: '4.1㎡', className: 'bath', selected: false },
  { id: 'entry', icon: '🚪', name: '현관', size: '3.7㎡', className: 'entry', selected: true },
]

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
const IDENTITY_VERIFICATION_PENDING_MIN_MS = 650
const IDENTITY_VERIFICATION_SUCCESS_HOLD_MS = 900

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

function resolveAccountTriggerAriaLabel(authSession) {
  const accountLabel = typeof authSession?.accountLabel === 'string' ? authSession.accountLabel.trim() : ''
  return accountLabel ? `${accountLabel} 계정 보기` : '로그인 열기'
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

export function AppShell() {
  const { screen, overlay, direction, navigate, openOverlay } = useSpaNavigation()
  const cart = useCart()
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
  const [aiForm, setAiForm] = React.useState(() => ({
    ...initialAiForm,
    ...(persistedAuthUiRestore?.recommendationRoom
      ? { room: persistedAuthUiRestore.recommendationRoom }
      : {}),
  }))
  const [spaceProfile, setSpaceProfile] = React.useState(() => {
    const restoredApartmentSelectionId = persistedAuthUiRestore?.apartmentSelectionId
      ?? persistedAuthSession?.accountState?.apartmentSelectionId
      ?? apartmentSearchResults[0].id
    const restoredApartment = apartmentSearchResults.find((item) => item.id === restoredApartmentSelectionId)
      ?? apartmentSearchResults[0]

    return {
      query: '서울 성동구 성수이로 123 HAVENLY Apartments',
      apartmentType: restoredApartment.unitLabel,
      apartmentSelectionId: restoredApartment.id,
      spaces: persistedAuthUiRestore?.selectedSpaceIds?.length
        ? persistedAuthUiRestore.selectedSpaceIds
        : baseZones.filter((zone) => zone.selected).map((zone) => zone.id),
    }
  })
  const [wishlistedIds, setWishlistedIds] = React.useState([])
  const [loginModalState, setLoginModalState] = React.useState(() => (persistedAuthHandoff ? 'form' : 'closed'))
  const [loginForm, setLoginForm] = React.useState(() => (
    buildAuthReadyState(persistedAuthSession)
      ?? buildAuthResumeState(persistedAuthHandoff, persistedAuthSession)
      ?? buildEmptyLoginForm()
  ))
  const [authSession, setAuthSession] = React.useState(() => persistedAuthSession)
  const [isAuthBootstrapPending, setIsAuthBootstrapPending] = React.useState(true)
  const [authContinuationFields, setAuthContinuationFields] = React.useState(() => buildAuthContinuationFieldState(
    persistedAuthHandoff?.continuationFields ?? persistedAuthSession?.continuationFields ?? null,
  ))
  const [authNoticeDismissed, setAuthNoticeDismissed] = React.useState(false)
  const [engagement, setEngagement] = React.useState(initialEngagement)
  const [layoutBoardSaveState, setLayoutBoardSaveState] = React.useState({ status: 'idle', message: '', savedAt: null })
  const [layoutTrayItems, setLayoutTrayItems] = React.useState(() => aiProducts.map((item) => ({ ...item })))
  const [identityVerification, setIdentityVerification] = React.useState({ status: 'idle', verificationId: null, message: '', startedAt: null })
  const verificationPollTimeoutRef = React.useRef(null)
  const verificationAdvanceTimeoutRef = React.useRef(null)
  const verificationPendingStartedAtRef = React.useRef(null)
  const appliedAuthSessionRestoreRef = React.useRef(null)
  const autoResumedAuthReadyKeyRef = React.useRef('')

  const selectedApartment = React.useMemo(
    () => buildSelectedApartment(apartmentSearchResults, spaceProfile.apartmentSelectionId),
    [spaceProfile.apartmentSelectionId],
  )
  const syncSpaceProfileBoardContext = React.useCallback(({ apartmentSelectionId = null, selectedSpaceIds = [] } = {}) => {
    if (!apartmentSelectionId && !selectedSpaceIds?.length) return

    const apartmentOption = apartmentSelectionId
      ? apartmentSearchResults.find((item) => item.id === apartmentSelectionId) ?? null
      : null

    setSpaceProfile((current) => {
      const nextProfile = apartmentSelectionId
        ? apartmentOption
          ? applyApartmentSelection(current, apartmentOption, formatApartmentOption)
          : current.apartmentSelectionId === apartmentSelectionId
            ? current
            : { ...current, apartmentSelectionId }
        : current

      if (!selectedSpaceIds?.length) {
        return nextProfile
      }

      const currentIds = Array.isArray(nextProfile.spaces) ? nextProfile.spaces : []
      const nextIds = selectedSpaceIds
      const sameSpaces = currentIds.length === nextIds.length && currentIds.every((value, index) => value === nextIds[index])

      return sameSpaces
        ? nextProfile
        : { ...nextProfile, spaces: nextIds }
    })
  }, [])
  const selectedSpaceSummary = React.useMemo(
    () => buildSelectedSpaceSummary(baseZones, roomOptions, spaceProfile.spaces),
    [spaceProfile.spaces],
  )

  React.useEffect(() => {
    setAiForm((current) => {
      const nextRoom = resolveAiRoomSelection(current.room, selectedSpaceSummary)
      return current.room === nextRoom ? current : { ...current, room: nextRoom }
    })
  }, [selectedSpaceSummary])

  const loginGuardSnapshot = React.useMemo(() => buildLoginGuardSnapshot({
    engagement,
    wishlistCount: wishlistedIds.length,
    cartCount: cart.count,
    layoutItemCount: editor.items.length,
    hasRecommendationDraft: Boolean(
      aiForm.extraRequest?.trim()
      || aiForm.room !== initialAiForm.room
      || aiForm.style !== initialAiForm.style
      || aiForm.priority !== initialAiForm.priority
      || JSON.stringify(aiForm.lifestyle ?? []) !== JSON.stringify(initialAiForm.lifestyle),
    ),
    selectedSpaceCount: spaceProfile.spaces.length,
  }), [aiForm.extraRequest, aiForm.lifestyle, aiForm.priority, aiForm.style, cart.count, editor.items.length, engagement, spaceProfile.spaces.length, wishlistedIds.length])

  const guestDraftSnapshot = React.useMemo(() => buildGuestDraftSnapshot({
    engagement,
    aiForm,
    spaceProfile,
    selectedApartment,
    selectedSpaceSummary,
    wishlistedIds,
    cartItems: cart.items,
    editorItems: editor.items,
    layoutTrayItems,
  }), [aiForm, cart.items, editor.items, engagement, layoutTrayItems, selectedApartment, selectedSpaceSummary, spaceProfile, wishlistedIds])

  const baseAuthConfig = React.useMemo(
    () => resolveAuthConfig({ env: import.meta.env }),
    [],
  )
  const [detectedAuthConfig, setDetectedAuthConfig] = React.useState(null)
  const authConfig = detectedAuthConfig ?? baseAuthConfig

  React.useEffect(() => {
    let cancelled = false

    if (baseAuthConfig.isConfigured || baseAuthConfig.loopbackProbeBlockedReason || !baseAuthConfig.allowLoopbackProbe) {
      setDetectedAuthConfig(null)
      return () => {
        cancelled = true
      }
    }

    detectLocalPagesAuthConfig({
      currentOrigin: baseAuthConfig.currentOrigin,
      appBasePath: baseAuthConfig.appBasePath,
      source: baseAuthConfig.source,
      allowLoopbackProbe: baseAuthConfig.allowLoopbackProbe,
    }).then((resolvedConfig) => {
      if (cancelled || !resolvedConfig) return
      setDetectedAuthConfig((current) => {
        if (JSON.stringify(current) === JSON.stringify(resolvedConfig)) return current
        return resolvedConfig
      })
    })

    return () => {
      cancelled = true
    }
  }, [baseAuthConfig])

  React.useEffect(() => () => {
    verificationPendingStartedAtRef.current = null
    if (verificationPollTimeoutRef.current) {
      clearTimeout(verificationPollTimeoutRef.current)
    }
    if (verificationAdvanceTimeoutRef.current) {
      clearTimeout(verificationAdvanceTimeoutRef.current)
    }
  }, [])

  const pollIdentityVerification = React.useCallback(async (verificationId) => {
    const response = await readIdentityVerificationStatus({ authConfig, verificationId })
    if (!response.ok) {
      setIdentityVerification((current) => ({
        status: 'error',
        verificationId,
        message: '인증 상태를 다시 확인해 주세요.',
        startedAt: current?.startedAt ?? verificationPendingStartedAtRef.current ?? null,
      }))
      return
    }

    if (response.data?.status === 'verified') {
      const verifiedContinuationPatch = (continuation) => continuation?.nextAction === 'verify-email'
        ? { ...continuation, nextAction: 'resume-authenticated-flow', status: 'ready', statusLabel: '이메일 인증 완료' }
        : continuation

      if (verificationPollTimeoutRef.current) {
        clearTimeout(verificationPollTimeoutRef.current)
        verificationPollTimeoutRef.current = null
      }
      if (verificationAdvanceTimeoutRef.current) {
        clearTimeout(verificationAdvanceTimeoutRef.current)
      }

      const pendingStartedAt = verificationPendingStartedAtRef.current
      const pendingElapsedMs = pendingStartedAt ? Date.now() - pendingStartedAt : 0
      const remainingPendingMs = Math.max(0, IDENTITY_VERIFICATION_PENDING_MIN_MS - pendingElapsedMs)

      if (remainingPendingMs > 0) {
        await new Promise((resolve) => {
          verificationAdvanceTimeoutRef.current = setTimeout(() => {
            verificationAdvanceTimeoutRef.current = null
            resolve()
          }, remainingPendingMs)
        })
      }

      setIdentityVerification({
        status: 'verified',
        verificationId,
        message: '본인인증이 완료되었습니다',
        startedAt: pendingStartedAt ?? Date.now(),
      })

      await new Promise((resolve) => {
        verificationAdvanceTimeoutRef.current = setTimeout(() => {
          verificationAdvanceTimeoutRef.current = null
          resolve()
        }, IDENTITY_VERIFICATION_SUCCESS_HOLD_MS)
      })

      setLoginForm((current) => ({
        ...current,
        status: 'ready',
        continuation: verifiedContinuationPatch(current.continuation ?? null),
      }))
      setAuthSession((current) => {
        if (!current) return current
        const nextSession = { ...current, continuation: verifiedContinuationPatch(current.continuation ?? null) }
        persistAuthSession(globalThis.localStorage, nextSession)
        return nextSession
      })

      const sessionResponse = await readAuthSession({
        endpoint: authConfig.sessionEndpoint,
        apiBaseUrl: authConfig.apiBaseUrl,
        appBasePath: authConfig.appBasePath,
        currentOrigin: authConfig.currentOrigin,
        credentialsMode: authConfig.credentialsMode,
        loopbackProbeBlockedReason: authConfig.loopbackProbeBlockedReason,
        source: authConfig.isConfigured ? 'env/runtime-configured' : 'default',
      })
      verificationPendingStartedAtRef.current = null

      if (sessionResponse.ok && sessionResponse.data) {
        const persistedSession = buildPersistedAuthSession(sessionResponse.data)
        const persistedConnection = resolvePersistedAuthConnection(sessionResponse, persistedSession.connection ?? null)
        const sessionReadyAfterVerification = sessionResponse.data?.status === 'ready' || Boolean(sessionResponse.data?.verifiedAt)
        const normalizedContinuation = sessionReadyAfterVerification && persistedSession.continuation?.nextAction === 'verify-email'
          ? { ...persistedSession.continuation, nextAction: 'resume-authenticated-flow', status: 'ready', statusLabel: '이메일 인증 완료' }
          : persistedSession.continuation
        const normalizedSession = normalizedContinuation === persistedSession.continuation
          ? persistedSession
          : { ...persistedSession, continuation: normalizedContinuation }
        const nextSession = persistedConnection
          ? { ...normalizedSession, connection: persistedConnection }
          : normalizedSession

        persistAuthSession(globalThis.localStorage, nextSession)
        setAuthSession(nextSession)
        setLoginForm((current) => ({
          ...current,
          status: 'ready',
          handoffId: nextSession.handoffId ?? current.handoffId ?? null,
          connection: nextSession.connection ?? current.connection ?? null,
          actionConnection: nextSession.actionConnection ?? current.actionConnection ?? null,
          continuation: nextSession.continuation ?? current.continuation ?? null,
        }))

        if (nextSession.continuation?.nextAction && nextSession.continuation.nextAction !== 'verify-email') {
          if (verificationPollTimeoutRef.current) {
            clearTimeout(verificationPollTimeoutRef.current)
            verificationPollTimeoutRef.current = null
          }
          return
        }
      }

      verificationPollTimeoutRef.current = setTimeout(() => {
        pollIdentityVerification(verificationId)
      }, 500)
      return
    }

    if (!verificationPendingStartedAtRef.current) {
      verificationPendingStartedAtRef.current = Date.now()
    }

    setIdentityVerification({
      status: 'pending',
      verificationId,
      message: '본인 인증 창을 완료하면 자동으로 이어집니다.',
      startedAt: verificationPendingStartedAtRef.current,
    })
    verificationPollTimeoutRef.current = setTimeout(() => {
      pollIdentityVerification(verificationId)
    }, 1200)
  }, [authConfig])

  const startVerificationFlow = React.useCallback(async (continuation) => {
    const response = await startIdentityVerification({ authConfig, continuation, intent: authSession?.intent ?? loginForm.intent ?? null })
    if (!response.ok || !response.data?.verificationId) {
      setIdentityVerification({ status: 'error', verificationId: null, message: '인증 창을 열지 못했어요. 다시 시도해 주세요.', startedAt: null })
      return
    }

    const callbackUrl = response.data.callbackUrl
    openIdentityVerificationWindow(callbackUrl, authConfig)
    const verificationStartedAt = Date.now()
    verificationPendingStartedAtRef.current = verificationStartedAt
    setIdentityVerification({
      status: 'pending',
      verificationId: response.data.verificationId,
      message: '본인 인증 창을 열었어요. 완료되면 자동으로 갱신됩니다.',
      startedAt: verificationStartedAt,
    })
    pollIdentityVerification(response.data.verificationId)
  }, [authConfig, authSession?.intent, loginForm.intent, pollIdentityVerification])

  React.useEffect(() => {
    const handler = (event) => {
      if (event?.data?.type !== 'havenly-verification-complete' || !event.data.verificationId) return
      pollIdentityVerification(event.data.verificationId)
    }

    globalThis.window?.addEventListener?.('message', handler)
    return () => globalThis.window?.removeEventListener?.('message', handler)
  }, [pollIdentityVerification])

  const authDraftSavePayload = React.useMemo(
    () => buildAuthDraftSavePayload(
      loginForm.draftSave,
      authSession?.draftSave ?? null,
      guestDraftSnapshot,
      authSession?.intent ?? loginForm.intent ?? null,
    ),
    [authSession?.draftSave, authSession?.intent, guestDraftSnapshot, loginForm.draftSave, loginForm.intent],
  )

  const layoutAuthPanelState = React.useMemo(() => buildLayoutAuthPanelState({
    authSession,
    editorItems: editor.items,
    trayItems: layoutTrayItems,
    draftLabel: buildLayoutAddressSummary(spaceProfile),
    currentApartmentLabel: selectedApartment ? formatApartmentOption(selectedApartment) : null,
    currentApartmentSelectionId: spaceProfile.apartmentSelectionId,
    currentSelectedSpaceIds: spaceProfile.spaces,
    recommendationRoom: aiForm.room,
    currentRecommendationDraft: aiForm,
    saveState: layoutBoardSaveState,
  }), [aiForm, authSession, editor.items, layoutBoardSaveState, layoutTrayItems, selectedApartment, spaceProfile])

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

  const authConnectionDriftSummary = React.useMemo(
    () => buildAuthConnectionDriftSummary(loginForm.connection, authConnectionSummary),
    [authConnectionSummary, loginForm.connection],
  )
  const hasResumeConnectionDrift = React.useMemo(
    () => loginForm.status === 'resume-ready' && hasAuthConnectionDrift(loginForm.connection, authConnectionSummary),
    [authConnectionSummary, loginForm.connection, loginForm.status],
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

  const authResumePanelState = React.useMemo(
    () => buildAuthResumePanelState(loginForm.handoff, {
      session: persistedAuthSession,
      actionConnection: authContinuationConnectionSummary,
    }),
    [authContinuationConnectionSummary, loginForm.handoff, persistedAuthSession],
  )

  const activeAuthReadyPanelState = authReadyPanelState ?? (loginForm.status === 'resume-ready' ? authResumePanelState : null)

  React.useEffect(() => {
    if (!shouldAutoOpenAuthReadyPanel(authSession, loginModalState)) return
    setLoginModalState('form')
  }, [authSession, loginModalState])

  React.useEffect(() => {
    if (loginModalState !== 'closed') return
    if (loginForm.status !== 'resume-ready') return
    if (!loginForm.handoff && !loginForm.continuation) return

    setLoginModalState('form')
  }, [loginForm.continuation, loginForm.handoff, loginForm.status, loginModalState])

  const authContinuationIntent = React.useMemo(() => resolveContinuationSubmitIntent({
    sessionIntent: authSession?.intent ?? null,
    formIntent: loginForm.intent ?? null,
    handoffIntent: loginForm.handoff?.summary?.intent ?? null,
    blockerAction: activeAuthReadyPanelState?.nextAction ?? authSession?.continuation?.nextAction ?? loginForm.continuation?.nextAction ?? null,
  }), [activeAuthReadyPanelState?.nextAction, authSession?.continuation?.nextAction, authSession?.intent, loginForm.continuation?.nextAction, loginForm.handoff?.summary?.intent, loginForm.intent])

  const authContinuationPlan = React.useMemo(() => buildAuthContinuationPlan({
    endpoint: authConfig.continueEndpoint,
    continuation: authSession?.continuation ?? loginForm.continuation ?? null,
    handoffId: authSession?.handoffId ?? loginForm.handoffId ?? null,
    intent: authContinuationIntent,
    fields: activeAuthReadyPanelState?.nextAction === 'complete-profile'
      ? {
          displayName: authContinuationFields.displayName,
          phone: authContinuationFields.phone,
        }
      : activeAuthReadyPanelState?.nextAction === 'verify-email'
        ? {
            verificationCode: authContinuationFields.verificationCode,
          }
        : activeAuthReadyPanelState?.nextAction === 'confirm-merge-resolution' && (authContinuationFields.mergeResolution || loginForm.mergeResolution)
          ? {
              mergeResolution: authContinuationFields.mergeResolution || loginForm.mergeResolution,
            }
          : loginForm.continuation?.nextAction === 'confirm-merge-resolution' && (authContinuationFields.mergeResolution || loginForm.mergeResolution)
            ? {
                mergeResolution: authContinuationFields.mergeResolution || loginForm.mergeResolution,
              }
            : null,
    draftSave: shouldAttachDraftSaveToAuthContinuation(
      authContinuationIntent,
      authSession?.continuation ?? loginForm.continuation ?? null,
    )
      ? authDraftSavePayload
      : null,
  }), [activeAuthReadyPanelState?.nextAction, authConfig.continueEndpoint, authContinuationFields.displayName, authContinuationFields.mergeResolution, authContinuationFields.phone, authContinuationFields.verificationCode, authContinuationIntent, authDraftSavePayload, authSession?.continuation, authSession?.handoffId, loginForm.continuation, loginForm.handoffId, loginForm.mergeResolution])

  React.useEffect(() => {
    let cancelled = false
    setIsAuthBootstrapPending(true)

    ;(async () => {
      try {
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
            actionConnection: persistedAuthSession?.actionConnection ?? persistedAuthHandoff?.actionConnection ?? authContinuationConnectionSummary,
            continuation: buildSerializableAuthContinuation(result?.data),
            continuationFields: result?.data?.continuationFields
              ?? persistedAuthSession?.continuationFields
              ?? persistedAuthHandoff?.continuationFields
              ?? null,
            draftSave: result?.data?.draftSave
              ?? persistedAuthSession?.draftSave
              ?? persistedAuthHandoff?.draftSave
              ?? null,
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

        if (persistedAuthHandoff) {
          if (!cancelled) {
            setLoginForm((current) => (
              current.status === 'submitting'
                ? current
                : (buildAuthResumeState(persistedAuthHandoff, persistedAuthSession) ?? current)
            ))
            setLoginModalState('form')
          }
          return
        }
        if (cancelled) return

        const pendingResult = await readAuthPending({
          endpoint: authConfig.pendingEndpoint,
          connectionFallbackOverride: persistedAuthHandoff?.connection ?? persistedAuthSession?.connection ?? authLoginConnectionSummary,
          ...authConfig,
        })

        if (!pendingResult.ok || cancelled) return

        const bootstrappedPendingHandoff = {
          ...pendingResult.data,
          connection: pendingResult.data?.connection
            ?? persistedAuthHandoff?.connection
            ?? persistedAuthSession?.connection
            ?? authLoginConnectionSummary,
          actionConnection: pendingResult.data?.actionConnection
            ?? persistedAuthHandoff?.actionConnection
            ?? persistedAuthSession?.actionConnection
            ?? authContinuationConnectionSummary,
        }

        persistAuthHandoff(globalThis.sessionStorage, bootstrappedPendingHandoff)
        setLoginForm((current) => (
          current.status === 'submitting'
            ? current
            : (buildAuthResumeState(bootstrappedPendingHandoff, persistedAuthSession) ?? current)
        ))
        setLoginModalState('form')
      } finally {
        if (!cancelled) {
          setIsAuthBootstrapPending(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authConfig, authContinuationConnectionSummary, authLoginConnectionSummary, persistedAuthHandoff, persistedAuthSession])

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

    const persistedMergeResolution = typeof activeContinuationFields?.mergeResolution === 'string'
      ? activeContinuationFields.mergeResolution.trim()
      : ''

    if (persistedMergeResolution) {
      setLoginForm((current) => (
        current.mergeResolution === persistedMergeResolution
          ? current
          : {
              ...current,
              mergeResolution: persistedMergeResolution,
            }
      ))
    }
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
    const continuityPatch = buildAccountContinuityPatch(authSession.accountState)

    if (nextRestorePatch?.apartmentSelectionId || nextRestorePatch?.selectedSpaceIds?.length) {
      syncSpaceProfileBoardContext({
        apartmentSelectionId: nextRestorePatch?.apartmentSelectionId ?? null,
        selectedSpaceIds: nextRestorePatch?.selectedSpaceIds ?? [],
      })
    }

    if (nextRestorePatch?.recommendationRoom) {
      setAiForm((current) => (
        current.room === nextRestorePatch.recommendationRoom
          ? current
          : { ...current, room: nextRestorePatch.recommendationRoom }
      ))
    }

    if (continuityPatch) {
      if (continuityPatch.apartmentSelectionId || continuityPatch.selectedSpaceIds?.length) {
        syncSpaceProfileBoardContext({
          apartmentSelectionId: continuityPatch.apartmentSelectionId ?? null,
          selectedSpaceIds: continuityPatch.selectedSpaceIds ?? [],
        })
      }
      setWishlistedIds(continuityPatch.wishlistIds)
      cart.replaceItems(continuityPatch.cartItems)
      editor.replaceItems(continuityPatch.layoutItems)
      if (Object.hasOwn(continuityPatch, 'layoutTrayItems')) {
        setLayoutTrayItems(continuityPatch.layoutTrayItems)
      }
      setAiForm(buildRestoredRecommendationDraft(authSession.accountState, initialAiForm) ?? initialAiForm)
      setEngagement(initialEngagement)
    }

    appliedAuthSessionRestoreRef.current = authSession.savedAt
  }, [authSession, cart, editor, syncSpaceProfileBoardContext])

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
      if (shouldOpenCartAfterAuthResume(nextIntent, nextContinuation)) cart.setIsOpen(true)
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
      const submittedConnection = resolveAuthConnectionOverride(result, authSession?.connection ?? authConnectionSummary)

      if (!result.ok) {
        setLoginForm((current) => ({
          ...current,
          status: 'error',
          result,
          connection: submittedConnection,
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
        connection: submittedConnection ?? nextResultSummary.connection ?? authSession.connection ?? authConnectionSummary,
        actionConnection: authSession.actionConnection ?? authContinuationConnectionSummary,
        continuation: submittedContinuation,
        continuationFields: pickPersistedAuthContinuationFields(submittedContinuation, authContinuationFields),
        draftSave: authSession.draftSave ?? authDraftSavePayload,
        accountState: result?.data?.accountState ?? authSession.accountState ?? null,
      })
      const continuityPatch = buildPostAuthContinuityPatch(result)

      if (continuityPatch) {
        setWishlistedIds(continuityPatch.wishlistIds)
        cart.replaceItems(continuityPatch.cartItems)
        editor.replaceItems(continuityPatch.layoutItems)
        if (Object.hasOwn(continuityPatch, 'layoutTrayItems')) {
          setLayoutTrayItems(continuityPatch.layoutTrayItems)
        }
        setAiForm(buildRestoredRecommendationDraft(nextSession.accountState, initialAiForm) ?? initialAiForm)
        setEngagement(initialEngagement)
      }

      persistAuthSession(globalThis.localStorage, nextSession)
      setAuthSession(nextSession)
      setLoginForm((current) => ({
        ...current,
        status: 'ready',
        result,
        connection: submittedConnection,
        continuation: submittedContinuation,
      }))
      setLoginModalState('closed')
      if (nextScreen) navigate(nextScreen)
      if (shouldOpenCartAfterAuthResume(nextIntent, nextContinuation)) cart.setIsOpen(true)
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
  }, [authConfig, authConnectionSummary, authContinuationPlan, authDraftSavePayload, authSession, cart, loginForm.continuation, loginForm.handoffId, loginForm.intent, navigate, screen])

  React.useEffect(() => {
    const nextIntent = authSession?.intent ?? loginForm.intent ?? null
    const nextContinuation = authSession?.continuation ?? loginForm.continuation ?? null

    if (loginModalState !== 'open' || loginForm.status !== 'ready') return
    if (!authSession?.accountLabel || !shouldAutoResumeReadyAuthModal(nextIntent, nextContinuation)) return

    const autoResumeKey = [
      authSession.sessionId ?? authSession.accountLabel ?? '',
      nextContinuation?.resumeToken ?? '',
      nextContinuation?.nextAction ?? '',
    ].join('::')

    if (!autoResumeKey || autoResumedAuthReadyKeyRef.current === autoResumeKey) return

    autoResumedAuthReadyKeyRef.current = autoResumeKey
    handleResumeAuthenticatedIntent()
  }, [authSession, handleResumeAuthenticatedIntent, loginForm.continuation, loginForm.intent, loginForm.status, loginModalState])

  const handleAuthContinuationFieldChange = React.useCallback((field, value) => {
    const nextFields = buildAuthContinuationFieldState({
      ...authContinuationFields,
      [field]: value,
    })

    setAuthContinuationFields(nextFields)
    setLoginForm((current) => ({
      ...current,
      continuationFields: nextFields,
      ...(field === 'mergeResolution' ? { mergeResolution: value, status: 'idle', result: null } : {}),
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

  const handleLoginFormChange = React.useCallback((field, value) => {
    setLoginForm((current) => ({
      ...current,
      [field]: value,
      status: 'idle',
      result: null,
      mergeResolution: field === 'mergeResolution' ? value : null,
    }))

    if (field !== 'mergeResolution') return

    setAuthContinuationFields((current) => {
      const next = buildAuthContinuationFieldState({
        ...current,
        mergeResolution: value,
      })
      return JSON.stringify(current) === JSON.stringify(next) ? current : next
    })

    const currentHandoff = readPersistedAuthHandoff(globalThis.sessionStorage)
    if (!currentHandoff) return

    const nextContinuationFields = buildSerializableAuthContinuationFields({
      ...(currentHandoff.continuationFields ?? {}),
      mergeResolution: value,
    })

    persistAuthHandoff(globalThis.sessionStorage, {
      ...currentHandoff,
      continuationFields: nextContinuationFields,
      summary: {
        ...(currentHandoff.summary ?? {}),
        mergeResolution: value,
      },
    })
  }, [])

  const handleAuthContinuationSubmit = React.useCallback(async () => {
    const currentHandoff = loginForm.handoff ?? readPersistedAuthHandoff(globalThis.sessionStorage)
    const currentAuthSession = authSession ?? persistedAuthSession ?? null

    if (!authContinuationPlan.canSubmit) return
    if (!currentAuthSession && !currentHandoff) return

    setLoginForm((current) => ({
      ...current,
      status: 'submitting',
      result: null,
    }))

    try {
      const result = await submitAuthContinuationPlan(authContinuationPlan, authConfig)
      const nextContinuation = buildSerializableAuthContinuation(result?.data)
      const nextConnection = resolveAuthConnectionOverride(result, currentAuthSession?.connection ?? currentHandoff?.connection ?? authConnectionSummary)
      const persistedConnection = resolvePersistedAuthConnection(result, currentAuthSession?.connection ?? currentHandoff?.connection ?? authConnectionSummary)
      const nextIntent = resolveContinuationSubmitIntent({
        sessionIntent: currentAuthSession?.intent ?? null,
        formIntent: loginForm.intent ?? null,
        handoffIntent: currentHandoff?.summary?.intent ?? null,
        blockerAction: authContinuationPlan.summary?.continuation?.nextAction ?? currentAuthSession?.continuation?.nextAction ?? currentHandoff?.continuation?.nextAction ?? null,
      })

      if (result.ok) {
        const nextResultSummary = buildAuthResultSummary(result, {
          sessionId: currentAuthSession?.sessionId ?? null,
          accountLabel: currentAuthSession?.accountLabel ?? currentHandoff?.email ?? null,
          handoffId: currentAuthSession?.handoffId ?? currentHandoff?.handoffId ?? loginForm.handoffId ?? null,
          wishlistCount: currentAuthSession?.wishlistCount ?? currentHandoff?.summary?.wishlistCount ?? 0,
          cartCount: currentAuthSession?.cartCount ?? currentHandoff?.summary?.cartCount ?? 0,
          layoutItemCount: currentAuthSession?.layoutItemCount ?? currentHandoff?.summary?.layoutItemCount ?? 0,
          hasRecommendationDraft: currentAuthSession?.hasRecommendationDraft ?? currentHandoff?.summary?.hasRecommendationDraft ?? false,
          guestDraftSummary: currentAuthSession?.guestDraftSummary ?? currentHandoff?.guestDraftSummary ?? null,
          intent: nextIntent,
          connection: currentAuthSession?.connection ?? currentHandoff?.connection ?? authConnectionSummary,
          continuation: currentAuthSession?.continuation ?? currentHandoff?.continuation ?? null,
          authMode: currentAuthSession?.authMode ?? null,
          authTransport: currentAuthSession?.authTransport ?? null,
        })
        const nextSession = buildPersistedAuthSession(nextResultSummary, {
          intent: nextIntent,
          connection: persistedConnection ?? nextResultSummary.connection ?? currentAuthSession?.connection ?? currentHandoff?.connection ?? authConnectionSummary,
          actionConnection: currentAuthSession?.actionConnection ?? currentHandoff?.actionConnection ?? authContinuationConnectionSummary,
          continuation: nextContinuation,
          continuationFields: pickPersistedAuthContinuationFields(nextContinuation, authContinuationFields),
          draftSave: currentAuthSession?.draftSave ?? currentHandoff?.draftSave ?? authDraftSavePayload,
          accountState: result?.data?.accountState ?? currentAuthSession?.accountState ?? null,
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
          handoff: null,
          handoffId: nextSession.handoffId ?? current.handoffId ?? null,
          status: 'ready',
          result,
          connection: nextConnection,
          continuation: nextContinuation,
        }))

        if (shouldCloseLoginModalAfterAuth(result, nextIntent, nextContinuation)) {
          setLoginModalState('closed')
          if (nextScreen) navigate(nextScreen)
        }

        return
      }

      if (currentHandoff) {
        persistAuthHandoff(globalThis.sessionStorage, {
          ...currentHandoff,
          continuation: nextContinuation ?? currentHandoff.continuation ?? null,
          continuationFields: pickPersistedAuthContinuationFields(nextContinuation ?? currentHandoff.continuation, authContinuationFields),
          connection: nextConnection ?? currentHandoff.connection ?? null,
          ...(result?.status ? { status: result.status } : {}),
          ...(result?.data?.message ? { error: result.data.message } : {}),
        })
      }

      setLoginForm((current) => ({
        ...current,
        status: 'error',
        result,
        connection: nextConnection,
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
  }, [authConfig, authConnectionSummary, authContinuationConnectionSummary, authContinuationFields, authContinuationPlan, authDraftSavePayload, authSession, loginForm.handoff, loginForm.handoffId, loginForm.intent, navigate, persistedAuthSession, screen])

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
        actionConnection: authContinuationConnectionSummary,
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
      const nextConnection = resolveAuthConnectionOverride(result, authConnectionSummary)
      const persistedConnection = resolvePersistedAuthConnection(result, authConnectionSummary)
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
          connection: persistedConnection ?? nextResultSummary.connection ?? authConnectionSummary,
          actionConnection: authContinuationConnectionSummary,
          continuation: nextContinuation,
          continuationFields: pickPersistedAuthContinuationFields(nextContinuation, authContinuationFields),
          draftSave: authDraftSavePayload,
          accountState: result?.data?.accountState ?? null,
        })

        if (continuityPatch) {
          setWishlistedIds(continuityPatch.wishlistIds)
          cart.replaceItems(continuityPatch.cartItems)
          editor.replaceItems(continuityPatch.layoutItems)
          if (Object.hasOwn(continuityPatch, 'layoutTrayItems')) {
            setLayoutTrayItems(continuityPatch.layoutTrayItems)
          }
          setAiForm(buildRestoredRecommendationDraft(nextSession.accountState, initialAiForm) ?? initialAiForm)
          setEngagement(initialEngagement)
        }

        persistAuthSession(globalThis.localStorage, nextSession)
        clearPersistedAuthHandoff(globalThis.sessionStorage)
        setAuthSession(nextSession)
        setAuthNoticeDismissed(false)
      }

      let failedHandoff = null

      if (!result.ok) {
        failedHandoff = buildPersistedAuthHandoff(submitPlan, guestDraftSnapshot, {
          connection: nextConnection,
          actionConnection: authContinuationConnectionSummary,
          continuation: nextContinuation,
          continuationFields: shouldResolveMergeViaContinuation
            ? { mergeResolution: nextMergeResolution }
            : pickPersistedAuthContinuationFields(nextContinuation, authContinuationFields),
          draftSave: authDraftSavePayload,
          result,
        })

        persistAuthHandoff(globalThis.sessionStorage, failedHandoff)
      }

      setLoginForm((current) => {
        if (!result.ok && nextContinuation?.nextAction === 'confirm-merge-resolution' && failedHandoff) {
          const resumeState = buildAuthResumeState(failedHandoff, persistedAuthSession)
          if (resumeState) {
            return {
              ...resumeState,
              email: current.email,
              password: current.password,
              result,
              mergeResolution: nextMergeResolution,
              connection: nextConnection,
              continuation: nextContinuation,
            }
          }
        }

        return {
          ...current,
          status: result.ok ? 'ready' : 'error',
          result,
          connection: nextConnection,
          continuation: nextContinuation,
          mergeResolution: result.ok ? null : nextMergeResolution,
        }
      })

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
  }, [authConfig, authConnectionSummary, authContinuationConnectionSummary, authContinuationFields, authDraftSavePayload, authSignupPlan, cart, editor, guestDraftSnapshot, loginForm.continuation, loginForm.email, loginForm.handoffId, loginForm.intent, loginForm.mergeResolution, loginForm.mode, loginForm.password, screen])

  const cartActions = {
    openCart: () => cart.setIsOpen(true),
    cartCount: cart.count,
  }

  const addProductToLayout = React.useCallback((product) => {
    editor.addLibraryItem(buildLayoutProduct(product))
    setEngagement((current) => ({
      ...current,
      furniturePlacements: current.furniturePlacements + 1,
      draftBoards: Math.max(current.draftBoards, 1),
    }))
  }, [editor])

  const handleLayoutTrayDropToRoom = React.useCallback((product) => {
    addProductToLayout(product)
    setLayoutTrayItems((current) => current.filter((item) => item.id !== product.id))
    trackLayoutComponentEvent({ authConfig, eventType: 'selectedComponent', item: product })
  }, [addProductToLayout, authConfig])

  const handleLayoutTrayAbandon = React.useCallback((product) => {
    setLayoutTrayItems((current) => current.filter((item) => item.id !== product.id))
    trackLayoutComponentEvent({ authConfig, eventType: 'abandonedComponent', item: product })
  }, [authConfig])

  const handleRestoreSavedLayout = React.useCallback(() => {
    const savedAccountState = authSession?.accountState
    if (!savedAccountState) return

    const savedApartmentSelectionId = authSession?.draftSave?.apartmentSelectionId ?? savedAccountState?.apartmentSelectionId ?? null
    const savedSelectedSpaceIds = authSession?.draftSave?.selectedSpaceIds ?? savedAccountState?.selectedSpaceIds ?? []
    if (savedApartmentSelectionId || savedSelectedSpaceIds.length) {
      syncSpaceProfileBoardContext({
        apartmentSelectionId: savedApartmentSelectionId,
        selectedSpaceIds: savedSelectedSpaceIds,
      })
    }

    editor.replaceItems(Array.isArray(savedAccountState.layoutItems) ? savedAccountState.layoutItems : [])
    setLayoutTrayItems(
      Array.isArray(savedAccountState.layoutTrayItems)
        ? savedAccountState.layoutTrayItems.map((item) => ({ ...item }))
        : aiProducts.map((item) => ({ ...item })),
    )
    setAiForm(buildRestoredRecommendationDraft(savedAccountState, initialAiForm) ?? initialAiForm)
    setLayoutBoardSaveState({
      status: 'restored',
      message: '계정에 저장된 보드를 다시 불러왔어요.',
      savedAt: authSession?.savedAt ?? null,
    })
  }, [aiProducts, authSession, editor, syncSpaceProfileBoardContext])

  const handleSaveLayoutToAccount = React.useCallback(async () => {
    if (!authSession) return

    const savePlan = buildAuthContinuationPlan({
      endpoint: authConfig.continueEndpoint,
      continuation: { nextAction: 'save-layout-draft' },
      handoffId: authSession.handoffId ?? loginForm.handoffId ?? null,
      intent: buildSerializableAuthIntent({
        action: 'save-layout-draft',
        label: '보드 저장 이어가기',
        draftLabel: buildLayoutAddressSummary(spaceProfile),
        returnScreen: 'layout',
      }),
      draftSave: {
        ...authDraftSavePayload,
        draftLabel: buildLayoutAddressSummary(spaceProfile),
        apartmentLabel: selectedApartment
          ? formatApartmentOption(selectedApartment)
          : (authDraftSavePayload?.apartmentLabel ?? null),
        apartmentSelectionId: selectedApartment?.id ?? spaceProfile.apartmentSelectionId ?? authDraftSavePayload?.apartmentSelectionId ?? null,
        layoutTrayItems: layoutTrayItems.map((item) => ({ ...item })),
      },
    })

    setLayoutBoardSaveState({ status: 'saving', message: '현재 배치를 계정에 저장하고 있어요.', savedAt: null })

    try {
      const result = await submitAuthContinuationPlan(savePlan, authConfig)
      if (!result.ok) {
        setLayoutBoardSaveState({
          status: 'error',
          message: result?.data?.message ?? '보드 저장에 실패했어요.',
          savedAt: null,
        })
        return
      }

      const savedAt = new Date().toISOString()
      const nextAccountState = result?.data?.accountState && typeof result.data.accountState === 'object'
        ? {
            ...result.data.accountState,
            layoutBoardSavedAt: result.data.accountState.layoutBoardSavedAt ?? savedAt,
          }
        : {
            ...(authSession.accountState ?? {}),
            layoutBoardSavedAt: savedAt,
          }
      const nextResultSummary = buildAuthResultSummary(result, {
        sessionId: authSession.sessionId ?? null,
        accountLabel: authSession.accountLabel ?? null,
        handoffId: authSession.handoffId ?? loginForm.handoffId ?? null,
        wishlistCount: wishlistedIds.length,
        cartCount: cart.count,
        layoutItemCount: editor.items.length,
        hasRecommendationDraft: Boolean(authDraftSavePayload?.recommendationRoom),
        guestDraftSummary: authSession.guestDraftSummary ?? null,
        intent: savePlan.request.intent,
        connection: authSession.connection ?? authConnectionSummary,
        continuation: { nextAction: 'save-layout-draft', status: 'ready', statusLabel: '보드 저장 완료' },
        authMode: authSession.authMode ?? null,
        authTransport: authSession.authTransport ?? null,
      })
      const nextSession = buildPersistedAuthSession(nextResultSummary, {
        intent: savePlan.request.intent,
        connection: authSession.connection ?? authConnectionSummary,
        actionConnection: authSession.actionConnection ?? authContinuationConnectionSummary,
        continuation: buildSerializableAuthContinuation(result?.data) ?? { nextAction: 'save-layout-draft', status: 'ready', statusLabel: '보드 저장 완료' },
        continuationFields: authSession.continuationFields ?? null,
        draftSave: savePlan.request.draftSave,
        accountState: nextAccountState,
        savedAt,
      })

      persistAuthSession(globalThis.localStorage, nextSession)
      setAuthSession(nextSession)
      setLayoutBoardSaveState({
        status: 'saved',
        message: '현재 배치를 계정 저장본으로 업데이트했어요.',
        savedAt,
      })
    } catch {
      setLayoutBoardSaveState({
        status: 'error',
        message: '보드 저장 요청이 중간에 끊겼어요.',
        savedAt: null,
      })
    }
  }, [authConfig, authConnectionSummary, authContinuationConnectionSummary, authDraftSavePayload, authSession, cart.count, editor, layoutTrayItems, loginForm.handoffId, selectedApartment, wishlistedIds.length])

  const shared = {
    navigate,
    openOverlay,
    addToCart: cart.addItem,
    onOpenLogin: openLogin,
    onAddProductToLayout: addProductToLayout,
    layoutTrayItems,
    onLayoutTrayDropToRoom: handleLayoutTrayDropToRoom,
    onLayoutTrayAbandon: handleLayoutTrayAbandon,
    onSaveLayoutToAccount: handleSaveLayoutToAccount,
    onRestoreSavedLayout: handleRestoreSavedLayout,
    layoutAuthPanelState,
    isAuthBootstrapPending,
    authSession,
    ...cartActions,
  }

  const screenProps = {
    layout: {
      editor,
      addressSummary: buildLayoutAddressSummary(spaceProfile, {
        selectedApartment,
        formatApartmentOption,
      }),
    },
  }

  return (
    <main className="appShell">
      {authSessionNotice && !authNoticeDismissed && (
        <AuthSessionNoticeBanner
          notice={authSessionNotice}
          authReadyPanelState={authReadyPanelState}
          onDismiss={() => setAuthNoticeDismissed(true)}
          onOpenAccount={() => openLogin(authSession?.intent ?? null)}
          onResumeAuthenticatedIntent={handleResumeAuthenticatedIntent}
          onLogout={handleLogout}
        />
      )}
      <section className={`screenStage ${overlay ? 'overlayOpen' : ''}`}>
        <StageTransition screen={screen} direction={direction}>
          {(visibleScreen) => renderScreen(visibleScreen, { ...shared, ...screenProps[visibleScreen] })}
        </StageTransition>

        {cart.isOpen && (
          <CartDrawer
            cart={cart}
            authSession={authSession}
            onOpenLogin={openLogin}
            onClose={() => cart.setIsOpen(false)}
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
            hasResumeConnectionDrift={hasResumeConnectionDrift}
            authConnectionDriftSummary={authConnectionDriftSummary}
            authReadyPanelState={activeAuthReadyPanelState}
            guestDraftSnapshot={guestDraftSnapshot}
            identityVerification={identityVerification}
            onStartVerification={startVerificationFlow}
            onChangeForm={handleLoginFormChange}
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
      return (
        <AiRecommendPage
          Header={Header}
          roomOptions={roomOptions}
          styleOptions={styleOptions}
          priorityOptions={priorityOptions}
          lifestyleOptions={lifestyleOptions}
          aiProducts={aiProducts}
          {...props}
        />
      )
    case 'layout':
      return (
        <LayoutEditorPage
          Header={Header}
          libraryItems={libraryItems}
          aiProducts={aiProducts}
          buildVisibleLibrary={buildVisibleLibrary}
          buildLibraryEmptyState={buildLibraryEmptyState}
          layoutLibraryCategoryTabs={layoutLibraryCategoryTabs}
          buildLayoutEditorToolbarButtons={buildLayoutEditorToolbarButtons}
          buildLayoutEditorInfoPills={buildLayoutEditorInfoPills}
          buildLayoutEditorPropertyPanelState={buildLayoutEditorPropertyPanelState}
          buildLayoutEditorHint={buildLayoutEditorHint}
          findLibraryItemMeta={findLibraryItemMeta}
          resolveRoomClickTarget={resolveRoomClickTarget}
          createLayoutEditorToolbarHandlers={createLayoutEditorToolbarHandlers}
          createLayoutEditorActionHandlers={createLayoutEditorActionHandlers}
          buildLayoutEditorToolbarCommands={buildLayoutEditorToolbarCommands}
          buildLayoutEditorActionCommands={buildLayoutEditorActionCommands}
          runLayoutEditorCommands={runLayoutEditorCommands}
          buildPlacedItemClassName={buildPlacedItemClassName}
          buildPlacedItemStyle={buildPlacedItemStyle}
          {...props}
        />
      )
    case 'beds':
      return <BedsCategoryPage Header={Header} {...props} />
    case 'home':
    default:
      return <FurnitureHomePage Header={Header} aiProducts={aiProducts} bedProducts={bedProducts} {...props} />
  }
}

function AuthSessionNoticeBanner({ notice, authReadyPanelState, onDismiss, onOpenAccount, onResumeAuthenticatedIntent, onLogout }) {
  const { label: primaryActionLabel, needsAccountModal } = resolveAuthSessionNoticePrimaryAction(authReadyPanelState)
  const handlePrimaryAction = needsAccountModal ? onOpenAccount : onResumeAuthenticatedIntent

  return (
    <section className="authSessionNotice" aria-live="polite">
      <div>
        <strong>{notice.title}</strong>
        <p>{notice.body}</p>
      </div>
      <div className="authSessionNoticeActions">
        {primaryActionLabel && (
          <button className="ghost mini" onClick={handlePrimaryAction}>{primaryActionLabel}</button>
        )}
        <button className="ghost mini" onClick={onLogout}>로그아웃</button>
        <button className="mini" onClick={onDismiss} aria-label="계정 안내 닫기">닫기</button>
      </div>
    </section>
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
            <div className="emptyState"><div className="emptyEmoji">🛒</div><strong>장바구니가 비어있어요</strong><p>마음에 드는 상품을 담아두고 로그인 후 이어갈 수 있어요.</p></div>
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
