import fs from 'node:fs/promises'
import path from 'node:path'
import { buildAuthSubmitPlan, buildAuthResultSummary, buildGuestDraftSnapshot, buildAuthErrorSummary } from '../src/components/auth-flow-state.js'
import { readAuthSession, signOutAuthSession, submitAuthLoginPlan } from '../src/components/auth-submit.js'
import { buildAuthConnectionSummary, buildPersistedAuthSession } from '../src/components/auth-storage.js'
import { buildPostAuthContinuityPatch } from '../src/components/auth-session-merge.js'

const cliArgs = process.argv.slice(2)
const requireBrowser = cliArgs.includes('--require-browser')
const positionalArgs = cliArgs.filter((arg) => arg !== '--require-browser')
const baseUrl = positionalArgs[0] || 'http://127.0.0.1:4173/github-pages-react-hello/'
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
    currentOrigin: base.origin,
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
    return {
      module: await import('playwright'),
      error: null,
    }
  } catch (error) {
    return {
      module: null,
      error,
    }
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
    currentOrigin: base.origin,
    credentialsMode: 'include',
    fetchImpl: fetch,
  })
  const logoutResult = await signOutAuthSession({
    endpoint: '/api/auth/logout',
    apiBaseUrl,
    currentOrigin: base.origin,
    credentialsMode: 'include',
    fetchImpl: fetch,
  })
  const scaffoldSessionAfterLogout = await readAuthSession({
    endpoint: '/api/auth/session',
    apiBaseUrl,
    currentOrigin: base.origin,
    credentialsMode: 'include',
    fetchImpl: fetch,
  })

  const saveDraftPlan = buildPlan({
    email: 'board@example.com',
    password: 'password123',
    handoffId: 'auth-smoke-layout-0001',
    intent: {
      source: 'smoke',
      action: 'save-layout-draft',
      label: '보드 저장 이어가기',
      returnScreen: 'layout',
      draftLabel: '거실 배치 보드',
    },
  })
  const saveDraft = await submitPlan(saveDraftPlan)

  const completeProfilePlan = buildPlan({
    email: 'profile@example.com',
    password: 'password123',
    handoffId: 'auth-smoke-profile-0001',
    intent: {
      source: 'smoke',
      action: 'complete-profile',
      label: '프로필 마무리',
      returnScreen: 'home',
      draftLabel: '필수 프로필',
    },
  })
  const completeProfile = await submitPlan(completeProfilePlan)

  const verifyEmailPlan = buildPlan({
    email: 'verify@example.com',
    password: 'password123',
    handoffId: 'auth-smoke-verify-0001',
    intent: {
      source: 'smoke',
      action: 'verify-email',
      label: '이메일 인증 이어가기',
      returnScreen: 'home',
      draftLabel: '인증 대기',
    },
  })
  const verifyEmail = await submitPlan(verifyEmailPlan)

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
    saveLayoutDraft: {
      status: saveDraft.result.status,
      nextAction: saveDraft.resultSummary?.nextAction ?? null,
      resumeToken: saveDraft.resultSummary?.resumeToken ?? null,
      targetLabel: saveDraft.connection.targetLabel,
      resolvedUrl: saveDraft.connection.resolvedUrl,
    },
    actionRequired: {
      completeProfile: {
        status: completeProfile.result.status,
        nextAction: completeProfile.resultSummary?.nextAction ?? null,
        resumeToken: completeProfile.resultSummary?.resumeToken ?? null,
        continuationStatus: completeProfile.resultSummary?.continuationStatus ?? null,
        continuationStatusLabel: completeProfile.resultSummary?.continuationStatusLabel ?? null,
        targetLabel: completeProfile.connection.targetLabel,
        resolvedUrl: completeProfile.connection.resolvedUrl,
      },
      verifyEmail: {
        status: verifyEmail.result.status,
        nextAction: verifyEmail.resultSummary?.nextAction ?? null,
        resumeToken: verifyEmail.resultSummary?.resumeToken ?? null,
        continuationStatus: verifyEmail.resultSummary?.continuationStatus ?? null,
        continuationStatusLabel: verifyEmail.resultSummary?.continuationStatusLabel ?? null,
        targetLabel: verifyEmail.connection.targetLabel,
        resolvedUrl: verifyEmail.connection.resolvedUrl,
      },
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
        nextAction: scaffoldSession.data?.nextAction ?? null,
        resumeToken: scaffoldSession.data?.resumeToken ?? null,
        connection: scaffoldSession.data?.connection ?? null,
      },
      logout: {
        status: logoutResult.status,
        authMode: logoutResult.meta?.authMode ?? null,
        authTransport: logoutResult.meta?.authTransport ?? null,
        postLogoutSessionStatus: scaffoldSessionAfterLogout.status,
      },
    },
  }
}

async function capture(page, name) {
  await page.screenshot({ path: path.join(outDir, name), fullPage: true })
}

async function readStartupAssetErrors(page) {
  return page.evaluate(() => {
    const entries = Array.isArray(globalThis?.performance?.getEntriesByType?.('resource'))
      ? globalThis.performance.getEntriesByType('resource')
      : []

    return entries
      .filter((entry) => typeof entry.name === 'string' && /\/assets\//.test(entry.name))
      .map((entry) => ({
        name: entry.name,
        transferSize: entry.transferSize ?? null,
        decodedBodySize: entry.decodedBodySize ?? null,
      }))
  })
}

async function ensureAppShellReady(page) {
  try {
    await page.getByRole('button', { name: '로그인 열기' }).waitFor({ timeout: 10000 })
    return
  } catch {
    const resourceEntries = await readStartupAssetErrors(page)
    const missingAssets = resourceEntries.filter((entry) => entry.transferSize === 0 && entry.decodedBodySize === 0)
    const appMarkup = await page.locator('#root').innerHTML().catch(() => '')

    if (!appMarkup.trim()) {
      const assetCopy = missingAssets.length
        ? ` Missing asset candidates: ${missingAssets.map((entry) => entry.name).join(', ')}`
        : ''
      throw new Error(`App shell did not render before auth smoke started. The preview/dev server may be serving a stale or incomplete build.${assetCopy}`)
    }

    throw new Error('App shell rendered, but the login trigger was not found within the expected timeout.')
  }
}

async function resetBrowserAuthState() {
  await signOutAuthSession({
    endpoint: '/api/auth/logout',
    apiBaseUrl,
    currentOrigin: base.origin,
    credentialsMode: 'include',
    fetchImpl: fetch,
  }).catch(() => null)
}

async function openLogin(page) {
  await ensureAppShellReady(page)
  await page.getByRole('button', { name: '로그인 열기' }).click()
  await page.getByRole('heading', { name: /로그인/ }).waitFor()
}

async function submitLogin(page, { email, password }) {
  const loginForm = page.locator('.loginPanel .loginForm').last()
  const inputs = loginForm.locator('input')
  await inputs.nth(0).fill(email)
  await inputs.nth(1).fill(password)
  await loginForm.getByRole('button', { name: '로그인', exact: true }).click()
}

async function runBrowserSmoke(playwright) {
  const { chromium } = playwright
  const browser = await chromium.launch({ headless: true })
  try {
    await resetBrowserAuthState()

    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
    await page.goto(baseUrl, { waitUntil: 'networkidle' })

    await openLogin(page)
    await submitLogin(page, {
      email: 'user@example.com',
      password: 'password123',
    })

    await page.locator('.authSessionNotice').waitFor()
    const status = 'modal-closed-after-direct-login'
    const notice = await page.locator('.authSessionNotice p').innerText()
    const accountLabel = await page.locator('.accountTrigger span').last().innerText()
    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('.authSessionNotice').waitFor()
    const reloadedNotice = await page.locator('.authSessionNotice p').innerText()
    const reloadedAccountLabel = await page.locator('.accountTrigger span').last().innerText()
    await page.getByRole('button', { name: '로그아웃' }).click()
    await page.getByRole('button', { name: '로그인 열기' }).waitFor()
    const postLogoutLabel = await page.getByRole('button', { name: '로그인 열기' }).innerText()
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: '로그인 열기' }).waitFor()
    const postLogoutReloadedLabel = await page.getByRole('button', { name: '로그인 열기' }).innerText()
    await capture(page, 'auth-login-direct-success.png')
    await page.close()

    await resetBrowserAuthState()
    const saveDraftPage = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
    await saveDraftPage.goto(`${baseUrl}#layout`, { waitUntil: 'networkidle' })
    await saveDraftPage.getByRole('button', { name: '로그인 후 보드 저장' }).click()
    await saveDraftPage.getByRole('button', { name: '그래도 로그인하기' }).click()
    await submitLogin(saveDraftPage, {
      email: 'board@example.com',
      password: 'password123',
    })
    await saveDraftPage.getByRole('button', { name: '보드 저장 이어가기' }).waitFor()
    const saveDraftStatus = await saveDraftPage.locator('.authPrepCard .muted').first().innerText()
    const saveDraftConnection = await saveDraftPage.locator('.authPrepCard .muted').nth(3).innerText()
    const saveDraftNotice = await saveDraftPage.locator('.authSessionNotice p').innerText()
    await saveDraftPage.reload({ waitUntil: 'networkidle' })
    await saveDraftPage.locator('.authSessionNotice').waitFor()
    await saveDraftPage.getByRole('button', { name: '로그인 열기' }).click()
    await saveDraftPage.getByRole('button', { name: '보드 저장 이어가기' }).waitFor()
    const saveDraftReloadedStatus = await saveDraftPage.locator('.authPrepCard .muted').first().innerText()
    await capture(saveDraftPage, 'auth-login-save-layout-ready.png')
    await saveDraftPage.close()

    await resetBrowserAuthState()
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
    await mergePage.getByRole('button', { name: '게스트 초안 이어가기' }).waitFor()
    const mergeStatus = await mergePage.locator('.authPrepCard .muted').first().innerText()
    await capture(mergePage, 'auth-login-guarded-merge.png')
    await mergePage.close()

    await resetBrowserAuthState()
    const completeProfilePage = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
    await completeProfilePage.goto(baseUrl, { waitUntil: 'networkidle' })
    await openLogin(completeProfilePage)
    await submitLogin(completeProfilePage, {
      email: 'profile@example.com',
      password: 'password123',
    })
    await completeProfilePage.getByRole('button', { name: '프로필 보완 계약 보기' }).waitFor()
    const completeProfileStatus = await completeProfilePage.locator('.authPrepCard .muted').first().innerText()
    const completeProfileChecklist = await completeProfilePage.locator('.authChecklist li').allInnerTexts()
    const completeProfileDisabled = await completeProfilePage.getByRole('button', { name: '프로필 보완 계약 보기' }).isDisabled()
    await capture(completeProfilePage, 'auth-login-complete-profile-ready.png')
    await completeProfilePage.close()

    await resetBrowserAuthState()
    const verifyEmailPage = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
    await verifyEmailPage.goto(baseUrl, { waitUntil: 'networkidle' })
    await openLogin(verifyEmailPage)
    await submitLogin(verifyEmailPage, {
      email: 'verify@example.com',
      password: 'password123',
    })
    await verifyEmailPage.getByRole('button', { name: '이메일 인증 계약 보기' }).waitFor()
    const verifyEmailStatus = await verifyEmailPage.locator('.authPrepCard .muted').first().innerText()
    const verifyEmailChecklist = await verifyEmailPage.locator('.authChecklist li').allInnerTexts()
    const verifyEmailDisabled = await verifyEmailPage.getByRole('button', { name: '이메일 인증 계약 보기' }).isDisabled()
    await capture(verifyEmailPage, 'auth-login-verify-email-ready.png')
    await verifyEmailPage.close()

    return {
      mode: 'browser',
      baseUrl,
      directSuccess: {
        status,
        notice,
        accountLabel,
        reloadedNotice,
        reloadedAccountLabel,
        postLogoutLabel,
        postLogoutReloadedLabel,
      },
      saveLayoutDraft: {
        status: saveDraftStatus,
        connection: saveDraftConnection,
        notice: saveDraftNotice,
        reloadedStatus: saveDraftReloadedStatus,
      },
      actionRequired: {
        completeProfile: {
          status: completeProfileStatus,
          checklist: completeProfileChecklist,
          primaryActionDisabled: completeProfileDisabled,
        },
        verifyEmail: {
          status: verifyEmailStatus,
          checklist: verifyEmailChecklist,
          primaryActionDisabled: verifyEmailDisabled,
        },
      },
      guardedMerge: { guardReasons, mergeError, mergeOptions, mergeStatus },
    }
  } finally {
    await browser.close()
  }
}

const playwright = await loadPlaywright()

let result
if (playwright.module) {
  try {
    result = await runBrowserSmoke(playwright.module)
  } catch (error) {
    if (requireBrowser) throw error

    result = {
      ...(await runHttpSmoke()),
      mode: 'http-fallback',
      browserRequested: true,
      browserAttempted: true,
      browserReady: false,
      browserError: error instanceof Error ? error.message : String(error),
    }
  }
} else {
  if (requireBrowser) {
    throw (playwright.error ?? new Error('Playwright is unavailable'))
  }

  result = {
    ...(await runHttpSmoke()),
    mode: 'http-fallback',
    browserRequested: true,
    browserAttempted: false,
    browserReady: false,
    browserError: playwright.error instanceof Error ? playwright.error.message : (playwright.error ? String(playwright.error) : 'Playwright is unavailable'),
  }
}

console.log(JSON.stringify(result, null, 2))
