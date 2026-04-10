import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { buildAuthContinuationPlan, buildAuthSubmitPlan, buildAuthResultSummary, buildGuestDraftSnapshot, buildAuthErrorSummary } from '../src/components/auth-flow-state.js'
import { readAuthSession, signOutAuthSession, submitAuthContinuationPlan, submitAuthLoginPlan, submitAuthSignupPlan } from '../src/components/auth-submit.js'
import { buildAuthConnectionSummary, buildPersistedAuthSession } from '../src/components/auth-storage.js'
import { buildPostAuthContinuityPatch } from '../src/components/auth-session-merge.js'

const cliArgs = process.argv.slice(2)
const requireBrowser = cliArgs.includes('--require-browser')
const positionalArgs = cliArgs.filter((arg) => arg !== '--require-browser')
const defaultBaseUrl = positionalArgs[0] || 'http://127.0.0.1:4174/github-pages-react-hello/'
let baseUrl = defaultBaseUrl
let base = new URL(baseUrl)
let apiBaseUrl = base.origin
let appBasePath = base.pathname.endsWith('/') ? base.pathname.slice(0, -1) || '/' : base.pathname
function createCookieAwareFetch(fetchImpl = fetch) {
  const cookieJar = new Map()

  function readCookieHeader(url) {
    const origin = new URL(url).origin
    return cookieJar.get(origin) ?? ''
  }

  function storeSetCookie(url, response) {
    const origin = new URL(url).origin
    const rawCookies = typeof response?.headers?.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : []

    if (!rawCookies.length) return

    const cookieMap = new Map(
      (cookieJar.get(origin) ?? '')
        .split(/;\s*/)
        .filter(Boolean)
        .map((entry) => {
          const [name, ...rest] = entry.split('=')
          return [name, rest.join('=')]
        }),
    )

    rawCookies.forEach((entry) => {
      const [cookiePair] = String(entry ?? '').split(';')
      const separatorIndex = cookiePair.indexOf('=')
      if (separatorIndex === -1) return
      const name = cookiePair.slice(0, separatorIndex).trim()
      const value = cookiePair.slice(separatorIndex + 1).trim()
      if (!name) return
      if (!value) {
        cookieMap.delete(name)
        return
      }
      cookieMap.set(name, value)
    })

    const serialized = Array.from(cookieMap.entries()).map(([name, value]) => `${name}=${value}`).join('; ')
    if (serialized) cookieJar.set(origin, serialized)
    else cookieJar.delete(origin)
  }

  return async (url, init = {}) => {
    const headers = new Headers(init.headers ?? {})
    const cookieHeader = readCookieHeader(url)
    if (cookieHeader && !headers.has('cookie')) {
      headers.set('cookie', cookieHeader)
    }

    const response = await fetchImpl(url, {
      ...init,
      headers,
    })

    storeSetCookie(url, response)
    return response
  }
}

const cookieAwareFetch = createCookieAwareFetch(fetch)
let authConfig = {
  apiBaseUrl,
  appBasePath,
  currentOrigin: base.origin,
  credentialsMode: 'include',
  fetchImpl: cookieAwareFetch,
}
const outDir = path.resolve('playwright-artifacts')
await fs.mkdir(outDir, { recursive: true })

function setActiveBaseUrl(url) {
  baseUrl = url
  base = new URL(url)
  apiBaseUrl = base.origin
  appBasePath = base.pathname.endsWith('/') ? base.pathname.slice(0, -1) || '/' : base.pathname
  authConfig = {
    apiBaseUrl,
    appBasePath,
    currentOrigin: base.origin,
    credentialsMode: 'include',
    fetchImpl: cookieAwareFetch,
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function isBaseUrlReachable(url, { fetchImpl = fetch } = {}) {
  try {
    const response = await fetchImpl(url, { redirect: 'follow' })
    return response.ok
  } catch {
    return false
  }
}

async function waitForBaseUrl(url, { timeoutMs = 30000, intervalMs = 500, fetchImpl = fetch } = {}) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    if (await isBaseUrlReachable(url, { fetchImpl })) return true
    await delay(intervalMs)
  }

  return false
}

async function runCommand(command, args, { cwd = process.cwd() } = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        CI: process.env.CI ?? '1',
      },
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`))
    })
    child.on('error', reject)
  })
}

async function startPreviewServer(url) {
  const previewArgs = ['run', 'preview', '--', '--host', base.hostname, '--port', base.port || '4173']
  const preview = spawn('npm', previewArgs, {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      CI: process.env.CI ?? '1',
    },
  })

  let stdout = ''
  let stderr = ''

  preview.stdout.on('data', (chunk) => {
    stdout += chunk.toString()
  })
  preview.stderr.on('data', (chunk) => {
    stderr += chunk.toString()
  })

  const ready = await waitForBaseUrl(url)
  if (ready) {
    return {
      process: preview,
      started: true,
      stdout,
      stderr,
    }
  }

  preview.kill('SIGTERM')
  await delay(500)
  if (!preview.killed) preview.kill('SIGKILL')

  throw new Error(`Timed out waiting for preview server at ${url}. stdout: ${stdout || '(empty)'} stderr: ${stderr || '(empty)'}`)
}

function buildFallbackBaseUrl(url, { portOffset = 1 } = {}) {
  const nextUrl = new URL(url)
  const currentPort = Number(nextUrl.port || (nextUrl.protocol === 'https:' ? 443 : 80))
  nextUrl.port = String(currentPort + portOffset)
  return nextUrl.toString()
}

function isAppShellStartupError(error) {
  return error instanceof Error && error.message.includes('App shell did not render before auth smoke started')
}

async function ensureBrowserBaseUrl(url, { forcePreview = true } = {}) {
  if (!forcePreview && await isBaseUrlReachable(url)) {
    return {
      process: null,
      started: false,
      url,
    }
  }

  await runCommand('npm', ['run', 'build'])
  await fs.mkdir(outDir, { recursive: true })
  const { process: previewProcess, started } = await startPreviewServer(url)

  return {
    process: previewProcess,
    started,
    url,
  }
}

const smokeRunId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const smokeSignupEmail = `smoke-signup-${smokeRunId}@example.com`

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

async function submitContinuation(plan, fallbackSummary = {}) {
  const result = await submitAuthContinuationPlan(plan, authConfig)
  const connection = buildAuthConnectionSummary(plan, authConfig)

  return {
    result,
    connection,
    resultSummary: result.ok ? buildAuthResultSummary(result, fallbackSummary) : null,
    errorSummary: result.ok ? null : buildAuthErrorSummary(result, fallbackSummary),
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
  const signupPlan = {
    canSubmit: true,
    endpoint: '/api/auth/signup',
    method: 'POST',
    handoffId: 'auth-smoke-signup-0001',
    request: {
      mode: 'signup',
      displayName: 'Smoke Signup',
      email: smokeSignupEmail,
      password: 'password123',
      guestDraftSnapshot,
      handoffId: 'auth-smoke-signup-0001',
      intent: {
        source: 'smoke',
        action: 'save-layout-draft',
        label: '회원가입 후 보드 저장',
        returnScreen: 'layout',
        draftLabel: '회원가입 스모크',
      },
      draftSave: {
        draftLabel: '회원가입 스모크',
        apartmentLabel: '래미안 포레스트 84A',
        recommendationRoom: '거실',
        selectedSpaceIds: ['living', 'kitchen'],
        layoutItems: guestDraftSnapshot.continuity.layoutItems,
      },
    },
    summary: {
      displayName: 'Smoke Signup',
      email: smokeSignupEmail,
      handoffId: 'auth-smoke-signup-0001',
      wishlistCount: guestDraftSnapshot?.continuity?.wishlistIds?.length ?? 0,
      cartCount: guestDraftSnapshot?.continuity?.cartItems?.length ?? 0,
      layoutItemCount: guestDraftSnapshot?.continuity?.layoutItems?.length ?? 0,
      hasRecommendationDraft: Boolean(guestDraftSnapshot?.recommendationDraft),
      intent: {
        source: 'smoke',
        action: 'save-layout-draft',
        label: '회원가입 후 보드 저장',
        returnScreen: 'layout',
        draftLabel: '회원가입 스모크',
      },
      draftSave: {
        draftLabel: '회원가입 스모크',
        apartmentLabel: '래미안 포레스트 84A',
        recommendationRoom: '거실',
        selectedSpaceIds: ['living', 'kitchen'],
        layoutItems: guestDraftSnapshot.continuity.layoutItems,
      },
    },
  }
  const signup = await submitAuthSignupPlan(signupPlan, authConfig)
  const signupResultSummary = signup.ok ? buildAuthResultSummary(signup, signupPlan.summary) : null

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
    ...authConfig,
  })
  const logoutResult = await signOutAuthSession({
    endpoint: '/api/auth/logout',
    ...authConfig,
  })
  const scaffoldSessionAfterLogout = await readAuthSession({
    endpoint: '/api/auth/session',
    ...authConfig,
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
  const completeProfileContinuation = await submitContinuation(
    buildAuthContinuationPlan({
      endpoint: '/api/auth/continue',
      handoffId: completeProfilePlan.summary.handoffId,
      continuation: completeProfile.result.data,
      fields: {
        displayName: 'Havenly User',
        phone: '010-1234-5678',
      },
    }),
    {
      ...completeProfilePlan.summary,
      connection: completeProfile.connection,
      continuation: completeProfile.resultSummary
        ? {
            resumeToken: completeProfile.resultSummary.resumeToken,
            nextAction: completeProfile.resultSummary.nextAction,
            status: completeProfile.resultSummary.continuationStatus,
            statusLabel: completeProfile.resultSummary.continuationStatusLabel,
          }
        : null,
    },
  )

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
  const verifyEmailContinuation = await submitContinuation(
    buildAuthContinuationPlan({
      endpoint: '/api/auth/continue',
      handoffId: verifyEmailPlan.summary.handoffId,
      continuation: verifyEmail.result.data,
      fields: {
        verificationCode: '123456',
      },
    }),
    {
      ...verifyEmailPlan.summary,
      connection: verifyEmail.connection,
      continuation: verifyEmail.resultSummary
        ? {
            resumeToken: verifyEmail.resultSummary.resumeToken,
            nextAction: verifyEmail.resultSummary.nextAction,
            status: verifyEmail.resultSummary.continuationStatus,
            statusLabel: verifyEmail.resultSummary.continuationStatusLabel,
          }
        : null,
    },
  )

  return {
    mode: 'http-fallback',
    baseUrl,
    signupSuccess: {
      ok: signup.ok,
      status: signup.status,
      authMode: signupResultSummary?.authMode ?? null,
      authTransport: signupResultSummary?.authTransport ?? null,
      sessionId: signupResultSummary?.sessionId ?? null,
      handoffId: signupResultSummary?.handoffId ?? null,
      accountLabel: signupResultSummary?.accountLabel ?? null,
      nextAction: signupResultSummary?.nextAction ?? null,
      resumeToken: signupResultSummary?.resumeToken ?? null,
    },
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
        continuedStatus: completeProfileContinuation.result.status,
        continuedNextAction: completeProfileContinuation.resultSummary?.nextAction ?? null,
        continuedStatusLabel: completeProfileContinuation.resultSummary?.continuationStatusLabel ?? null,
        continuedConnectionTarget: completeProfileContinuation.connection.targetLabel,
      },
      verifyEmail: {
        status: verifyEmail.result.status,
        nextAction: verifyEmail.resultSummary?.nextAction ?? null,
        resumeToken: verifyEmail.resultSummary?.resumeToken ?? null,
        continuationStatus: verifyEmail.resultSummary?.continuationStatus ?? null,
        continuationStatusLabel: verifyEmail.resultSummary?.continuationStatusLabel ?? null,
        targetLabel: verifyEmail.connection.targetLabel,
        resolvedUrl: verifyEmail.connection.resolvedUrl,
        continuedStatus: verifyEmailContinuation.result.status,
        continuedNextAction: verifyEmailContinuation.resultSummary?.nextAction ?? null,
        continuedStatusLabel: verifyEmailContinuation.resultSummary?.continuationStatusLabel ?? null,
        continuedConnectionTarget: verifyEmailContinuation.connection.targetLabel,
      },
    },
    guardedMerge: {
      promptStatus: mergePrompt.result.status,
      promptTone: mergePrompt.errorSummary?.tone ?? null,
      promptMessage: mergePrompt.errorSummary?.message ?? null,
      promptContinuationStatus: mergePrompt.result.data?.status ?? null,
      promptContinuationStatusLabel: mergePrompt.result.data?.statusLabel ?? null,
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

function getAccountTrigger(page) {
  return page.locator('.accountTrigger').first()
}

async function ensureAppShellReady(page) {
  try {
    await page.waitForFunction(() => {
      const root = document.querySelector('#root')
      return Boolean(root && root.innerHTML.trim())
    }, { timeout: 15000 })

    const loginTrigger = page.getByRole('button', { name: /로그인( 열기)?/ })
    const logoutTrigger = page.getByRole('button', { name: '로그아웃' })
    const accountTrigger = getAccountTrigger(page)

    await Promise.any([
      loginTrigger.waitFor({ timeout: 10000 }),
      logoutTrigger.waitFor({ timeout: 10000 }),
      accountTrigger.waitFor({ timeout: 10000 }),
    ])
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

    throw new Error('App shell rendered, but the auth shell controls were not found within the expected timeout.')
  }
}

async function resetBrowserAuthState() {
  await signOutAuthSession({
    endpoint: '/api/auth/logout',
    ...authConfig,
  }).catch(() => null)
}

async function clearBrowserStorage(page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    globalThis.localStorage?.clear?.()
    globalThis.sessionStorage?.clear?.()
  })
}

async function ensureLoggedOutUi(page) {
  const logoutButton = page.getByRole('button', { name: '로그아웃' }).first()
  const accountTrigger = getAccountTrigger(page)

  if (await logoutButton.isVisible().catch(() => false)) {
    await logoutButton.click()
    await waitForLoggedOutSignal(page)
  }

  if (!await accountTrigger.isVisible().catch(() => false)) {
    await clearBrowserStorage(page)
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  }

  if (!await accountTrigger.isVisible().catch(() => false)) {
    throw new Error('Browser auth reset did not surface the logged-out login trigger.')
  }
}

async function resetBrowserScenario(page) {
  await resetBrowserAuthState()
  await page.context().clearCookies()
  await clearBrowserStorage(page)
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await ensureAppShellReady(page)
  await ensureLoggedOutUi(page)
}

async function waitForLoginModal(page) {
  const loginPanel = page.locator('.loginPanel[data-auth-modal-state]')
  await loginPanel.waitFor({ state: 'visible', timeout: 30000 })
  await Promise.any([
    page.getByRole('heading', { name: /로그인|회원가입|계정/ }).waitFor({ timeout: 10000 }),
    page.locator('.loginPanel .overlayHeader').waitFor({ timeout: 10000 }),
  ])
}

async function openLogin(page) {
  await ensureAppShellReady(page)

  const loginPanel = page.locator('.loginPanel[data-auth-modal-state]')
  if (await loginPanel.first().isVisible().catch(() => false)) {
    await waitForLoginModal(page)
    return
  }

  const loginTrigger = getAccountTrigger(page)
  await loginTrigger.waitFor({ state: 'visible', timeout: 15000 })
  await loginTrigger.scrollIntoViewIfNeeded().catch(() => null)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.evaluate(() => {
      const trigger = document.querySelector('.accountTrigger')
      if (trigger instanceof HTMLElement) trigger.click()
    })

    try {
      await waitForLoginModal(page)
      return
    } catch (error) {
      if (attempt === 2) throw error
      await page.waitForTimeout(400)
    }
  }
}

async function readGuardPanelPreview(page) {
  const guardCard = page.locator('.loginGuardCard').first()
  const mutedLines = await guardCard.locator('.muted').allInnerTexts().catch(() => [])

  return {
    header: (await guardCard.locator('strong').first().innerText().catch(() => '')).trim(),
    summary: await guardCard.locator('.guardSummary.compact').locator('div').evaluateAll((nodes) => nodes.map((node) => node.textContent?.replace(/\s+/g, ' ').trim()).filter(Boolean)).catch(() => []),
    mutedLines: mutedLines.map((line) => line.trim()),
  }
}

function assertGuardPanelPreview(preview) {
  const flattened = [preview?.header ?? '', ...(preview.summary ?? []), ...(preview.mutedLines ?? [])].join(' | ')
  const expectedFragments = [
    '계속 이어질 내용',
    '선택 공간',
    '추천 초안',
    '배치 아이템',
    '찜',
    '장바구니',
  ]
  const forbiddenFragments = ['handoff', 'draftSave handoff', '연결 대상', 'payload', 'debug', 'checklist']

  for (const fragment of expectedFragments) {
    if (!flattened.includes(fragment)) {
      throw new Error(`Guarded login preview is missing expected customer-facing continuity detail: ${fragment}. Saw: ${flattened}`)
    }
  }

  for (const fragment of forbiddenFragments) {
    if (flattened.includes(fragment)) {
      throw new Error(`Guarded login preview exposed debug/log-style auth detail that should stay out of the product UI: ${fragment}. Saw: ${flattened}`)
    }
  }
}

async function continuePastGuardIfPresent(page) {
  const guardButton = page.getByRole('button', { name: /로그인 계속하기|그래도 로그인하기/ })
  const guardVisible = await guardButton.isVisible().catch(() => false)
  if (!guardVisible) return

  await guardButton.click()

  await page.waitForFunction(() => {
    const loginPanel = document.querySelector('.loginPanel[data-auth-modal-state]')
    if (!(loginPanel instanceof HTMLElement)) return false
    const modalState = loginPanel.dataset.authModalState ?? ''
    return modalState && modalState !== 'guard'
  }, { timeout: 15000 })

  await page.locator('.loginPanel .loginForm').last().waitFor({ state: 'visible', timeout: 15000 })
}

async function fillLoginForm(page, { email, password }) {
  const loginForm = page.locator('.loginPanel .loginForm').last()
  await loginForm.getByPlaceholder('name@example.com').fill(email)
  await loginForm.getByPlaceholder('8자 이상 입력').fill(password)
}

async function submitLogin(page, { email, password }) {
  await fillLoginForm(page, { email, password })
  const loginButton = page.locator('.loginPanel .footerButtons .cta').last()
  await loginButton.waitFor({ state: 'visible', timeout: 15000 })
  await loginButton.click()
}

async function readLoginConnectionPreview(page) {
  const loginBenefits = page.locator('.loginBenefits')
  const rows = await loginBenefits.locator('div').evaluateAll((nodes) => nodes.map((node) => node.textContent?.replace(/\s+/g, ' ').trim()).filter(Boolean)).catch(() => [])

  return {
    rows,
    flattened: rows.join(' | '),
  }
}

async function readAuthReadyCard(page) {
  const card = page.locator('.loginForm .authPrepCard').first()
  const title = normalizeUiText(await card.locator('strong').first().innerText().catch(() => ''))
  const muted = await card.locator('.muted').evaluateAll((nodes) => nodes.map((node) => node.textContent?.replace(/\s+/g, ' ').trim()).filter(Boolean)).catch(() => [])
  const chips = await card.locator('.loginReasonList span').evaluateAll((nodes) => nodes.map((node) => node.textContent?.replace(/\s+/g, ' ').trim()).filter(Boolean)).catch(() => [])
  const primaryAction = normalizeUiText(await page.locator('.loginPanel .footerButtons .cta').last().innerText().catch(() => ''))

  return {
    title,
    muted,
    chips,
    primaryAction,
  }
}

function assertLoginConnectionPreview(preview) {
  const rows = preview?.rows ?? []
  if (rows.length > 0 && rows.some((row) => /payload|response keys|debug|checklist/i.test(row))) {
    throw new Error(`Login panel exposed debug/log-style auth copy that should stay out of the product UI. Saw: ${JSON.stringify(rows)}`)
  }
}

function normalizeUiText(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

async function readVisibleAccountLabel(page) {
  const spanLabels = await page.locator('.accountTrigger span').evaluateAll((nodes) => (
    nodes
      .map((node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '')
      .filter(Boolean)
  )).catch(() => [])
  const buttonLabel = normalizeUiText(await page.locator('.accountTrigger').innerText().catch(() => ''))
  const meaningfulSpanLabel = [...spanLabels].reverse().find((value) => value && !/[🧑👤]/.test(value)) ?? ''

  return meaningfulSpanLabel || buttonLabel
}

async function waitForAuthReadySignal(page, { expectedAccountLabel = null, expectedNoticeIncludes = [], forbiddenNoticeIncludes = [], timeoutMs = 30000 } = {}) {
  const startedAt = Date.now()
  const requiredNoticeBits = expectedNoticeIncludes.map((value) => normalizeUiText(value)).filter(Boolean)
  const forbiddenNoticeBits = forbiddenNoticeIncludes.map((value) => normalizeUiText(value)).filter(Boolean)

  while (Date.now() - startedAt < timeoutMs) {
    const authSessionNotice = page.locator('.authSessionNotice')
    if (await authSessionNotice.count()) {
      if (await authSessionNotice.first().isVisible().catch(() => false)) {
        const noticeTitle = normalizeUiText(await page.locator('.authSessionNotice strong').first().innerText().catch(() => ''))
        const notice = normalizeUiText(await page.locator('.authSessionNotice p').innerText().catch(() => '')) || null
        const matchesRequiredNotice = requiredNoticeBits.every((value) => notice?.includes(value))
        const matchesForbiddenNotice = forbiddenNoticeBits.some((value) => notice?.includes(value))

        if ((!expectedAccountLabel || noticeTitle.includes(expectedAccountLabel) || notice?.includes(expectedAccountLabel) || noticeTitle.includes('계정 연결됨'))
          && matchesRequiredNotice
          && !matchesForbiddenNotice) {
          return {
            signal: 'session-notice',
            notice,
            accountLabel: expectedAccountLabel && noticeTitle.includes(expectedAccountLabel)
              ? expectedAccountLabel
              : null,
          }
        }
      }
    }

    const normalizedAccountLabel = normalizeUiText(await readVisibleAccountLabel(page))
    const requiresNoticeMatch = requiredNoticeBits.length > 0 || forbiddenNoticeBits.length > 0
    if (!requiresNoticeMatch && (expectedAccountLabel ? normalizedAccountLabel.includes(expectedAccountLabel) : Boolean(normalizedAccountLabel && normalizedAccountLabel !== '로그인'))) {
      return {
        signal: 'account-label',
        accountLabel: normalizedAccountLabel,
      }
    }

    const logoutVisible = await page.getByRole('button', { name: '로그아웃' }).first().isVisible().catch(() => false)
    if (!requiresNoticeMatch && logoutVisible && (!expectedAccountLabel || normalizedAccountLabel.includes(expectedAccountLabel))) {
      return {
        signal: 'logout-visible',
        accountLabel: normalizedAccountLabel || null,
      }
    }

    const readyPanelCta = page.locator('.loginPanel .footerButtons .cta').last()
    if (!requiresNoticeMatch && await readyPanelCta.count()) {
      const ctaLabel = normalizeUiText(await readyPanelCta.innerText().catch(() => ''))
      if (ctaLabel && ctaLabel !== '로그인' && ctaLabel !== '준비 중…') {
        return {
          signal: 'ready-panel',
          accountLabel: normalizedAccountLabel || null,
          ctaLabel,
        }
      }
    }

    await delay(250)
  }

  const debugState = {
    accountLabel: normalizeUiText(await readVisibleAccountLabel(page)),
    sessionNoticeTitle: normalizeUiText(await page.locator('.authSessionNotice strong').first().innerText().catch(() => '')),
    sessionNoticeBody: normalizeUiText(await page.locator('.authSessionNotice p').first().innerText().catch(() => '')),
    logoutVisible: await page.getByRole('button', { name: '로그아웃' }).first().isVisible().catch(() => false),
    loginPanelVisible: await page.locator('.loginPanel').first().isVisible().catch(() => false),
  }

  throw new Error(`Timed out waiting for an authenticated UI signal${expectedAccountLabel ? ` for ${expectedAccountLabel}` : ''}. Debug: ${JSON.stringify(debugState)}`)
}

async function waitForLoggedOutSignal(page, { timeoutMs = 15000 } = {}) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const normalizedAccountLabel = normalizeUiText(await readVisibleAccountLabel(page))
    const authSessionNoticeVisible = await page.locator('.authSessionNotice').first().isVisible().catch(() => false)
    const loginTriggerVisible = await getAccountTrigger(page).isVisible().catch(() => false)

    if (normalizedAccountLabel === '로그인' && !authSessionNoticeVisible && loginTriggerVisible) {
      return {
        accountLabel: normalizedAccountLabel,
      }
    }

    await delay(250)
  }

  throw new Error('Timed out waiting for the logged-out UI signal')
}

async function runBrowserSmoke(playwright) {
  const { chromium } = playwright
  const browser = await chromium.launch({ headless: true })
  try {
    const signupPage = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
    await resetBrowserScenario(signupPage)
    await signupPage.goto(`${baseUrl}#layout`, { waitUntil: 'networkidle' })
    await signupPage.getByRole('button', { name: '로그인 후 보드 저장' }).click()
    await continuePastGuardIfPresent(signupPage)
    await signupPage.locator('.authModeSwitch').getByRole('button', { name: '회원가입' }).click()
    await signupPage.getByPlaceholder('홍길동').fill('Smoke Signup')
    await signupPage.getByPlaceholder('name@example.com').fill(smokeSignupEmail)
    await signupPage.getByPlaceholder('8자 이상 입력').fill('password123')
    await signupPage.getByPlaceholder('비밀번호를 한 번 더 입력').fill('password123')
    await signupPage.getByRole('checkbox').check()
    await signupPage.locator('.loginPanel .footerButtons .cta').last().click()
    const signupReadySignal = await waitForAuthReadySignal(signupPage, { expectedAccountLabel: smokeSignupEmail })
    const signupReadyCard = await readAuthReadyCard(signupPage).catch(() => null)
    const signupNotice = signupReadySignal.notice ?? await signupPage.locator('.authSessionNotice p').innerText().catch(() => null)
    const signupResumeButton = signupPage.getByRole('button', { name: '보드 저장 이어가기' })
    if (await signupResumeButton.isVisible().catch(() => false)) {
      await signupResumeButton.click()
      await signupPage.locator('.loginPanel').waitFor({ state: 'hidden' })
    }
    const signupHashAfterResume = await signupPage.evaluate(() => globalThis.location.hash)
    await signupPage.reload({ waitUntil: 'networkidle' })
    const signupReloadedReady = await waitForAuthReadySignal(signupPage, { expectedAccountLabel: smokeSignupEmail })
    const signupReloadedNotice = signupReloadedReady.notice ?? null
    const signupReloadedAccountLabel = signupReloadedReady.accountLabel ?? await readVisibleAccountLabel(signupPage)
    await capture(signupPage, 'auth-signup-save-layout-ready.png')
    await signupPage.close()

    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
    await resetBrowserScenario(page)
    await page.goto(baseUrl, { waitUntil: 'networkidle' })

    await openLogin(page)
    await continuePastGuardIfPresent(page)
    const directLoginPreview = await readLoginConnectionPreview(page)
    assertLoginConnectionPreview(directLoginPreview)
    await submitLogin(page, {
      email: 'user@example.com',
      password: 'password123',
    })

    const directReady = await waitForAuthReadySignal(page, { expectedAccountLabel: 'user@example.com' })
    const status = directReady.signal === 'session-notice'
      ? 'modal-closed-after-direct-login'
      : directReady.signal === 'ready-panel'
        ? 'modal-open-ready-panel-after-direct-login'
        : 'account-badge-updated-after-direct-login'
    const notice = directReady.notice ?? null
    const accountLabel = directReady.accountLabel ?? await page.locator('.accountTrigger span').last().innerText()
    await page.reload({ waitUntil: 'networkidle' })
    const directReloadReady = await waitForAuthReadySignal(page, { expectedAccountLabel: 'user@example.com' })
    const reloadedNotice = directReloadReady.notice ?? null
    const reloadedAccountLabel = directReloadReady.accountLabel ?? await page.locator('.accountTrigger span').last().innerText()
    await page.getByRole('button', { name: '로그아웃' }).click()
    const loggedOut = await waitForLoggedOutSignal(page)
    const postLogoutLabel = loggedOut.accountLabel
    await page.reload({ waitUntil: 'networkidle' })
    const postLogoutTrigger = getAccountTrigger(page)
    await postLogoutTrigger.waitFor()
    const postLogoutReloadedLabel = await postLogoutTrigger.innerText()
    await capture(page, 'auth-login-direct-success.png')
    await page.close()

    const saveDraftPage = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
    await resetBrowserScenario(saveDraftPage)
    await saveDraftPage.goto(`${baseUrl}#layout`, { waitUntil: 'networkidle' })
    await saveDraftPage.getByRole('button', { name: '로그인 후 보드 저장' }).click()
    await continuePastGuardIfPresent(saveDraftPage)
    await submitLogin(saveDraftPage, {
      email: 'board@example.com',
      password: 'password123',
    })
    await saveDraftPage.getByRole('button', { name: '보드 저장 이어가기' }).waitFor()
    const saveDraftStatus = await saveDraftPage.locator('.authPrepCard .muted').first().innerText()
    const saveDraftReadyCard = await readAuthReadyCard(saveDraftPage)
    const saveDraftNotice = await saveDraftPage.locator('.authSessionNotice p').innerText().catch(() => null)
    await saveDraftPage.getByRole('button', { name: '보드 저장 이어가기' }).click()
    await saveDraftPage.locator('.loginPanel').waitFor({ state: 'hidden' })
    const saveDraftHashAfterResume = await saveDraftPage.evaluate(() => globalThis.location.hash)
    await saveDraftPage.reload({ waitUntil: 'networkidle' })
    await saveDraftPage.locator('.authSessionNotice').waitFor()
    await getAccountTrigger(saveDraftPage).click()
    await saveDraftPage.getByRole('button', { name: '보드 저장 이어가기' }).waitFor()
    const saveDraftReloadedStatus = await saveDraftPage.locator('.authPrepCard .muted').first().innerText()
    await capture(saveDraftPage, 'auth-login-save-layout-ready.png')
    await saveDraftPage.close()

    const mergePage = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
    await resetBrowserScenario(mergePage)
    await mergePage.goto(baseUrl, { waitUntil: 'networkidle' })

    await mergePage.getByRole('button', { name: '장바구니 담기' }).first().click()
    const openCartButton = mergePage.getByRole('button', { name: '장바구니 열기' })
    await openCartButton.scrollIntoViewIfNeeded()
    await openCartButton.click({ force: true })
    await mergePage.getByRole('dialog').getByRole('button', { name: '로그인 후 주문 이어가기' }).click()

    await mergePage.getByText('계속 이어질 내용').waitFor()
    const guardReasons = await mergePage.locator('.loginReasonList span').allInnerTexts()
    const guardPreview = await readGuardPanelPreview(mergePage)
    assertGuardPanelPreview(guardPreview)
    await continuePastGuardIfPresent(mergePage)
    await mergePage.locator('.loginPanel .loginForm').last().waitFor({ state: 'visible', timeout: 15000 })

    await submitLogin(mergePage, {
      email: 'merge@example.com',
      password: 'merge-conflict',
    })

    await mergePage.getByText('Guest draft merge confirmation required').waitFor()
    const mergeError = await mergePage.locator('.authPrepCard .muted').nth(1).innerText().catch(async () => {
      const mutedLines = await mergePage.locator('.authPrepCard .muted').evaluateAll((nodes) => nodes.map((node) => node.textContent?.replace(/\s+/g, ' ').trim()).filter(Boolean)).catch(() => [])
      return mutedLines.at(-1) ?? null
    })
    const mergeOptions = await mergePage.locator('.footerButtons button.ghost').evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()).filter(Boolean))

    await mergePage.getByRole('button', { name: '현재 초안으로 계속' }).click()
    const mergeReadyCard = await readAuthReadyCard(mergePage)
    const mergeReadyAction = mergePage.locator('.loginPanel .footerButtons .cta').last()
    await mergeReadyAction.waitFor()
    const mergeReadyLabel = (await mergeReadyAction.innerText()).trim()
    const mergeStatus = await mergePage.locator('.authPrepCard .muted').first().innerText()
    if (!mergeReadyCard.primaryAction.includes('현재 초안으로 계속')) {
      throw new Error(`Merge continuation state did not preserve the selected keep-guest path. Saw: ${JSON.stringify(mergeReadyCard)}`)
    }
    await mergePage.reload({ waitUntil: 'networkidle' })
    const mergeReloadedReadyCard = await readAuthReadyCard(mergePage)
    if (mergeReloadedReadyCard.primaryAction !== mergeReadyCard.primaryAction) {
      throw new Error(`Merge continuation action changed across reload. Before: ${JSON.stringify(mergeReadyCard)} After: ${JSON.stringify(mergeReloadedReadyCard)}`)
    }
    await mergeReadyAction.click()
    const mergeReadySignal = await waitForAuthReadySignal(mergePage, { expectedAccountLabel: 'merge@example.com' })
    await capture(mergePage, 'auth-login-guarded-merge.png')
    await mergePage.close()

    const completeProfilePage = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
    await resetBrowserScenario(completeProfilePage)
    await completeProfilePage.goto(baseUrl, { waitUntil: 'networkidle' })
    await openLogin(completeProfilePage)
    await continuePastGuardIfPresent(completeProfilePage)
    await submitLogin(completeProfilePage, {
      email: 'profile@example.com',
      password: 'password123',
    })
    await completeProfilePage.getByRole('button', { name: '프로필 보완 제출' }).waitFor()
    const completeProfileStatus = await completeProfilePage.locator('.authPrepCard .muted').first().innerText()
    const completeProfileReadyCard = await readAuthReadyCard(completeProfilePage)
    const completeProfileReadyDisabled = await completeProfilePage.getByRole('button', { name: '프로필 보완 제출' }).isDisabled()
    await completeProfilePage.getByPlaceholder('홍길동').fill('Havenly User')
    await completeProfilePage.getByPlaceholder('010-1234-5678').fill('010-1234-5678')
    await completeProfilePage.reload({ waitUntil: 'networkidle' })
    await completeProfilePage.getByRole('button', { name: '프로필 보완 제출' }).waitFor()
    const completeProfileReloadedStatus = await completeProfilePage.locator('.authPrepCard .muted').first().innerText()
    const completeProfileReloadedReadyCard = await readAuthReadyCard(completeProfilePage)
    if (completeProfileReadyCard.title !== completeProfileReloadedReadyCard.title || completeProfileReadyCard.primaryAction !== completeProfileReloadedReadyCard.primaryAction) {
      throw new Error(`Complete-profile ready card changed across reload. Before: ${JSON.stringify(completeProfileReadyCard)} After: ${JSON.stringify(completeProfileReloadedReadyCard)}`)
    }
    const completeProfileReloadedDisplayName = await completeProfilePage.getByPlaceholder('홍길동').inputValue()
    const completeProfileReloadedPhone = await completeProfilePage.getByPlaceholder('010-1234-5678').inputValue()
    await completeProfilePage.getByRole('button', { name: '프로필 보완 제출' }).click()
    const completeProfileReady = await waitForAuthReadySignal(completeProfilePage, {
      expectedAccountLabel: 'profile@example.com',
      expectedNoticeIncludes: ['프로필 준비 완료'],
      forbiddenNoticeIncludes: ['프로필 보완 필요'],
    })
    const completeProfileResumedStatus = completeProfileReady.notice
    await capture(completeProfilePage, 'auth-login-complete-profile-ready.png')
    await completeProfilePage.close()

    const verifyEmailPage = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
    await resetBrowserScenario(verifyEmailPage)
    await verifyEmailPage.goto(baseUrl, { waitUntil: 'networkidle' })
    await openLogin(verifyEmailPage)
    await continuePastGuardIfPresent(verifyEmailPage)
    await submitLogin(verifyEmailPage, {
      email: 'verify@example.com',
      password: 'password123',
    })
    await verifyEmailPage.getByRole('button', { name: '이메일 인증 확인' }).waitFor()
    const verifyEmailStatus = await verifyEmailPage.locator('.authPrepCard .muted').first().innerText()
    const verifyEmailReadyCard = await readAuthReadyCard(verifyEmailPage)
    const verifyEmailReadyDisabled = await verifyEmailPage.getByRole('button', { name: '이메일 인증 확인' }).isDisabled()
    await verifyEmailPage.getByPlaceholder('123456').fill('123456')
    await verifyEmailPage.reload({ waitUntil: 'networkidle' })
    await verifyEmailPage.getByRole('button', { name: '이메일 인증 확인' }).waitFor()
    const verifyEmailReloadedStatus = await verifyEmailPage.locator('.authPrepCard .muted').first().innerText()
    const verifyEmailReloadedReadyCard = await readAuthReadyCard(verifyEmailPage)
    if (verifyEmailReadyCard.title !== verifyEmailReloadedReadyCard.title || verifyEmailReadyCard.primaryAction !== verifyEmailReloadedReadyCard.primaryAction) {
      throw new Error(`Verify-email ready card changed across reload. Before: ${JSON.stringify(verifyEmailReadyCard)} After: ${JSON.stringify(verifyEmailReloadedReadyCard)}`)
    }
    const verifyEmailReloadedCode = await verifyEmailPage.getByPlaceholder('123456').inputValue()
    await verifyEmailPage.getByRole('button', { name: '이메일 인증 확인' }).click()
    const verifyEmailReady = await waitForAuthReadySignal(verifyEmailPage, {
      expectedAccountLabel: 'verify@example.com',
      expectedNoticeIncludes: ['이메일 인증 완료'],
      forbiddenNoticeIncludes: ['이메일 인증 필요'],
    })
    const verifyEmailResumedStatus = verifyEmailReady.notice
    await capture(verifyEmailPage, 'auth-login-verify-email-ready.png')
    await verifyEmailPage.close()

    const queryOverridePage = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
    const queryContinueEndpoint = '/v1/session/continue'
    await resetBrowserScenario(queryOverridePage)
    await queryOverridePage.goto(`${baseUrl}?authContinueEndpoint=${encodeURIComponent(queryContinueEndpoint)}&authCredentials=same-origin`, { waitUntil: 'domcontentloaded' })
    await openLogin(queryOverridePage)
    await continuePastGuardIfPresent(queryOverridePage)
    await fillLoginForm(queryOverridePage, {
      email: 'user@example.com',
      password: 'password123',
    })
    const queryOverridePreview = await readLoginConnectionPreview(queryOverridePage)
    await capture(queryOverridePage, 'auth-login-query-override-preview.png')
    await queryOverridePage.reload({ waitUntil: 'domcontentloaded' })
    await openLogin(queryOverridePage)
    await continuePastGuardIfPresent(queryOverridePage)
    await submitLogin(queryOverridePage, {
      email: 'profile@example.com',
      password: 'password123',
    })
    await queryOverridePage.getByRole('button', { name: '프로필 보완 제출' }).waitFor()
    const queryOverrideReadyCard = await readAuthReadyCard(queryOverridePage)
    await queryOverridePage.close()

    const runtimeOverridePage = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
    const runtimeContinueEndpoint = '/v2/runtime/continue'
    await runtimeOverridePage.addInitScript((continueEndpoint) => {
      globalThis.__HAVENLY_AUTH_CONFIG__ = {
        continueEndpoint,
        credentialsMode: 'same-origin',
      }
    }, runtimeContinueEndpoint)
    await resetBrowserScenario(runtimeOverridePage)
    await runtimeOverridePage.goto(baseUrl, { waitUntil: 'domcontentloaded' })
    await openLogin(runtimeOverridePage)
    await continuePastGuardIfPresent(runtimeOverridePage)
    await fillLoginForm(runtimeOverridePage, {
      email: 'user@example.com',
      password: 'password123',
    })
    const runtimeOverridePreview = await readLoginConnectionPreview(runtimeOverridePage)
    await capture(runtimeOverridePage, 'auth-login-runtime-override-preview.png')
    await runtimeOverridePage.reload({ waitUntil: 'domcontentloaded' })
    await openLogin(runtimeOverridePage)
    await continuePastGuardIfPresent(runtimeOverridePage)
    await submitLogin(runtimeOverridePage, {
      email: 'verify@example.com',
      password: 'password123',
    })
    await runtimeOverridePage.getByRole('button', { name: '이메일 인증 확인' }).waitFor()
    const runtimeOverrideReadyCard = await readAuthReadyCard(runtimeOverridePage)
    await runtimeOverridePage.close()

    if (!queryOverrideReadyCard.primaryAction.includes('프로필 보완 제출')) {
      throw new Error(`Query auth override login flow did not reach the expected profile continuation state. Saw: ${JSON.stringify(queryOverrideReadyCard)}`)
    }
    if (!runtimeOverrideReadyCard.primaryAction.includes('이메일 인증 확인')) {
      throw new Error(`Runtime auth override login flow did not reach the expected verification continuation state. Saw: ${JSON.stringify(runtimeOverrideReadyCard)}`)
    }

    return {
      mode: 'browser',
      baseUrl,
      signupSuccess: {
        readyCard: signupReadyCard,
        notice: signupNotice,
        hashAfterResume: signupHashAfterResume,
        reloadedNotice: signupReloadedNotice,
        reloadedAccountLabel: signupReloadedAccountLabel,
      },
      directSuccess: {
        status,
        preview: directLoginPreview,
        notice,
        accountLabel,
        reloadedNotice,
        reloadedAccountLabel,
        postLogoutLabel,
        postLogoutReloadedLabel,
      },
      saveLayoutDraft: {
        status: saveDraftStatus,
        readyCard: saveDraftReadyCard,
        notice: saveDraftNotice,
        hashAfterResume: saveDraftHashAfterResume,
        reloadedStatus: saveDraftReloadedStatus,
      },
      actionRequired: {
        completeProfile: {
          status: completeProfileStatus,
          readyCard: completeProfileReadyCard,
          primaryActionDisabled: completeProfileReadyDisabled,
          reloadedStatus: completeProfileReloadedStatus,
          reloadedReadyCard: completeProfileReloadedReadyCard,
          reloadedFields: {
            displayName: completeProfileReloadedDisplayName,
            phone: completeProfileReloadedPhone,
          },
          resumedStatus: completeProfileResumedStatus,
        },
        verifyEmail: {
          status: verifyEmailStatus,
          readyCard: verifyEmailReadyCard,
          primaryActionDisabled: verifyEmailReadyDisabled,
          reloadedStatus: verifyEmailReloadedStatus,
          reloadedReadyCard: verifyEmailReloadedReadyCard,
          reloadedFields: {
            verificationCode: verifyEmailReloadedCode,
          },
          resumedStatus: verifyEmailResumedStatus,
        },
      },
      guardedMerge: { guardReasons, guardPreview, mergeError, mergeOptions, mergeReadyCard, mergeReadyLabel, mergeStatus, mergeReloadedReadyCard, mergeReadySignal },
      authTargetOverrides: {
        query: {
          endpoint: queryContinueEndpoint,
          login: queryOverridePreview,
          readyCard: queryOverrideReadyCard,
        },
        runtime: {
          endpoint: runtimeContinueEndpoint,
          login: runtimeOverridePreview,
          readyCard: runtimeOverrideReadyCard,
        },
      },
    }
  } finally {
    await browser.close()
  }
}

const playwright = await loadPlaywright()

let result
let previewServer = null

try {
  if (playwright.module) {
    try {
      const ensuredBaseUrl = await ensureBrowserBaseUrl(baseUrl)
      previewServer = ensuredBaseUrl.process
      setActiveBaseUrl(ensuredBaseUrl.url)

      try {
        result = {
          ...(await runBrowserSmoke(playwright.module)),
          browserServerStarted: ensuredBaseUrl.started,
          browserBaseUrl: baseUrl,
        }
      } catch (error) {
        const canRetryWithFreshPreview = !ensuredBaseUrl.started && isAppShellStartupError(error)

        if (!canRetryWithFreshPreview) throw error

        const fallbackBaseUrl = buildFallbackBaseUrl(defaultBaseUrl)
        const fallbackPreview = await ensureBrowserBaseUrl(fallbackBaseUrl)
        previewServer = fallbackPreview.process ?? previewServer
        setActiveBaseUrl(fallbackPreview.url)

        result = {
          ...(await runBrowserSmoke(playwright.module)),
          browserServerStarted: fallbackPreview.started || ensuredBaseUrl.started,
          browserBaseUrl: baseUrl,
          browserRecoveredFromStaleBase: true,
          browserOriginalBaseUrl: defaultBaseUrl,
        }
      }
    } catch (error) {
      if (requireBrowser) throw error

      result = {
        ...(await runHttpSmoke()),
        mode: 'http-fallback',
        browserRequested: true,
        browserAttempted: true,
        browserReady: false,
        browserBaseUrl: baseUrl,
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
} finally {
  if (previewServer) {
    previewServer.kill('SIGTERM')
    await delay(500)
    if (!previewServer.killed) previewServer.kill('SIGKILL')
  }
}
