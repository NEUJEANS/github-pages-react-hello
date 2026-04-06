import fs from 'node:fs/promises'
import path from 'node:path'
import { buildAuthSubmitPlan, buildAuthResultSummary, buildGuestDraftSnapshot, buildAuthErrorSummary } from '../src/components/auth-flow-state.js'
import { readAuthSession, submitAuthLoginPlan } from '../src/components/auth-submit.js'
import { buildAuthConnectionSummary, buildPersistedAuthSession } from '../src/components/auth-storage.js'
import { buildPostAuthContinuityPatch } from '../src/components/auth-session-merge.js'

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173/github-pages-react-hello/'
const base = new URL(baseUrl)
const apiBaseUrl = base.origin
const outDir = path.resolve('playwright-artifacts')
await fs.mkdir(outDir, { recursive: true })

const guestDraftSnapshot = buildGuestDraftSnapshot({
  engagement: {
    aiRequests: 2,
    furniturePlacements: 1,
    draftBoards: 1,
  },
  aiForm: {
    room: '거실',
    style: '모던',
    priority: '수납',
    lifestyle: ['신혼부부'],
    extraRequest: '채광 좋은 구성',
  },
  spaceProfile: {
    query: '래미안 포레스트 84A',
    apartmentType: '84A',
    apartmentSelectionId: 'raemian-forest-84a',
    spaces: ['living', 'kitchen'],
  },
  selectedApartment: {
    brand: '래미안',
    complex: '포레스트',
    unitLabel: '84A',
  },
  selectedSpaceSummary: {
    availableRooms: ['거실', '주방'],
  },
  wishlistedIds: ['bed-1', 'lamp-2'],
  cartItems: [{ id: 'sofa-1', qty: 1 }],
  editorItems: [{ id: 'layout-1', sourceId: 'sofa-1', x: 42, y: 38, rotation: 0, colorIndex: 1 }],
})

function buildPlan({ email, password, mergeResolution = null, handoffId, intent = null }) {
  return buildAuthSubmitPlan({
    email,
    password,
    guestDraftSnapshot,
    mergeResolution,
    handoffId,
    endpoint: '/api/auth/login',
    intent,
  })
}

async function submitPlan(plan) {
  const authConfig = {
    apiBaseUrl,
    credentialsMode: 'include',
    fetchImpl: fetch,
  }
  const result = await submitAuthLoginPlan(plan, authConfig)
  const connection = buildAuthConnectionSummary(plan, authConfig)

  return {
    result,
    connection,
    resultSummary: result.ok ? buildAuthResultSummary(result, plan.summary) : null,
    errorSummary: result.ok ? null : buildAuthErrorSummary(result, plan.summary),
    replacementPatch: buildPostAuthContinuityPatch(result),
  }
}

async function loadPlaywright() {
  try {
    return await import('playwright')
  } catch {
    return null
  }
}

async function runHttpSmoke() {
  const directPlan = buildPlan({
    email: 'user@example.com',
    password: 'password123',
    handoffId: 'auth-smoke-direct-0001',
    intent: {
      source: 'smoke',
      action: 'login',
      label: '로그인 스모크 확인',
      returnScreen: 'layout',
      draftLabel: '거실 84A',
    },
  })
  const direct = await submitPlan(directPlan)

  const mergePromptPlan = buildPlan({
    email: 'merge@example.com',
    password: 'merge-conflict',
    handoffId: 'auth-smoke-merge-0001',
    intent: {
      source: 'smoke',
      action: 'checkout',
      label: '주문 이어가기',
      returnScreen: 'home',
      draftLabel: '장바구니 스모크',
    },
  })
  const mergePrompt = await submitPlan(mergePromptPlan)

  const mergeResolvePlan = buildPlan({
    email: 'merge@example.com',
    password: 'merge-conflict',
    mergeResolution: 'replace-with-account',
    handoffId: 'auth-smoke-merge-0001',
    intent: mergePromptPlan.summary.intent,
  })
  const mergeResolved = await submitPlan(mergeResolvePlan)

  const persistedSession = buildPersistedAuthSession(mergeResolved.resultSummary, {
    guestDraftSnapshot,
    intent: mergeResolvePlan.summary.intent,
    connection: mergeResolved.connection,
  })
  const scaffoldSession = await readAuthSession({
    endpoint: '/api/auth/session',
    apiBaseUrl,
    credentialsMode: 'include',
    fetchImpl: fetch,
  })

  return {
    mode: 'http-fallback',
    baseUrl,
    directSuccess: {
      ok: direct.result.ok,
      status: direct.result.status,
      authMode: direct.resultSummary?.authMode ?? null,
      authTransport: direct.resultSummary?.authTransport ?? null,
      sessionId: direct.resultSummary?.sessionId ?? null,
      handoffId: direct.resultSummary?.handoffId ?? null,
      accountLabel: direct.resultSummary?.accountLabel ?? null,
      targetLabel: direct.connection.targetLabel,
      resolvedUrl: direct.connection.resolvedUrl,
    },
    guardedMerge: {
      promptStatus: mergePrompt.result.status,
      promptTone: mergePrompt.errorSummary?.tone ?? null,
      promptMessage: mergePrompt.errorSummary?.message ?? null,
      allowedMergeResolutions: mergePrompt.errorSummary?.allowedMergeResolutions ?? [],
      resolvedStatus: mergeResolved.result.status,
      resolvedMergeMode: mergeResolved.resultSummary?.mergeMode ?? null,
      resolvedAuthTransport: mergeResolved.resultSummary?.authTransport ?? null,
      replacementPatch: mergeResolved.replacementPatch,
      persistedSession: {
        sessionId: persistedSession.sessionId,
        handoffId: persistedSession.handoffId,
        accountLabel: persistedSession.accountLabel,
        intent: persistedSession.intent,
        connection: persistedSession.connection,
        guestDraftSummary: persistedSession.guestDraftSummary,
      },
      scaffoldSession: {
        status: scaffoldSession.status,
        authMode: scaffoldSession.meta?.authMode ?? null,
        authTransport: scaffoldSession.meta?.authTransport ?? null,
        sessionId: scaffoldSession.data?.sessionId ?? null,
        accountLabel: scaffoldSession.data?.user?.email ?? null,
      },
    },
  }
}

async function capture(page, name) {
  await page.screenshot({ path: path.join(outDir, name), fullPage: true })
}

async function openLogin(page) {
  await page.getByRole('button', { name: '로그인 열기' }).click()
  await page.getByRole('heading', { name: /로그인/ }).waitFor()
}

async function submitLogin(page, { email, password }) {
  const inputs = page.locator('.loginForm input')
  await inputs.nth(0).fill(email)
  await inputs.nth(1).fill(password)
  await page.getByRole('button', { name: '로그인' }).click()
}

async function runBrowserSmoke(playwright) {
  const { chromium } = playwright
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
    await page.goto(baseUrl, { waitUntil: 'networkidle' })

    await openLogin(page)
    await submitLogin(page, {
      email: 'user@example.com',
      password: 'password123',
    })

    await page.getByRole('button', { name: '연결 완료' }).waitFor()
    const status = await page.locator('.authPrepCard .muted').first().innerText()
    const notice = await page.locator('.authSessionNotice p').innerText()
    const accountLabel = await page.locator('.accountTrigger span').last().innerText()
    await capture(page, 'auth-login-direct-success.png')
    await page.close()

    const mergePage = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
    await mergePage.goto(baseUrl, { waitUntil: 'networkidle' })

    await mergePage.getByRole('button', { name: '장바구니 담기' }).first().click()
    await mergePage.getByRole('button', { name: '장바구니 열기' }).click()
    await mergePage.getByRole('dialog').getByRole('button', { name: '로그인 후 주문 이어가기' }).click()

    await mergePage.getByText('현재 감지된 진행 내역').waitFor()
    const guardReasons = await mergePage.locator('.loginReasonList span').allInnerTexts()
    await mergePage.getByRole('button', { name: '그래도 로그인하기' }).click()

    await submitLogin(mergePage, {
      email: 'merge@example.com',
      password: 'merge-conflict',
    })

    await mergePage.getByText('Guest draft merge confirmation required').waitFor()
    const mergeError = await mergePage.locator('.authPrepCard .muted').nth(1).innerText()
    const mergeOptions = await mergePage.locator('.footerButtons button.ghost').evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()).filter(Boolean))

    await mergePage.getByRole('button', { name: '현재 초안으로 계속' }).click()
    await mergePage.getByRole('button', { name: '연결 완료' }).waitFor()
    const mergeStatus = await mergePage.locator('.authPrepCard .muted').first().innerText()
    await capture(mergePage, 'auth-login-guarded-merge.png')
    await mergePage.close()

    return {
      mode: 'browser',
      baseUrl,
      directSuccess: { status, notice, accountLabel },
      guardedMerge: { guardReasons, mergeError, mergeOptions, mergeStatus },
    }
  } finally {
    await browser.close()
  }
}

const playwright = await loadPlaywright()
const result = playwright ? await runBrowserSmoke(playwright) : await runHttpSmoke()
console.log(JSON.stringify(result, null, 2))
