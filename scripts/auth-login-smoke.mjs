import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173/github-pages-react-hello/'
const outDir = path.resolve('playwright-artifacts')
await fs.mkdir(outDir, { recursive: true })

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

async function runDirectSuccess(browser) {
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

  return { status, notice, accountLabel }
}

async function runGuardedMerge(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: '장바구니 담기' }).first().click()
  await page.getByRole('button', { name: '장바구니 열기' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '로그인 후 주문 이어가기' }).click()

  await page.getByText('현재 감지된 진행 내역').waitFor()
  const guardReasons = await page.locator('.loginReasonList span').allInnerTexts()
  await page.getByRole('button', { name: '그래도 로그인하기' }).click()

  await submitLogin(page, {
    email: 'merge@example.com',
    password: 'merge-conflict',
  })

  await page.getByText('Guest draft merge confirmation required').waitFor()
  const mergeError = await page.locator('.authPrepCard .muted').nth(1).innerText()
  const mergeOptions = await page.locator('.footerButtons button.ghost').evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()).filter(Boolean))

  await page.getByRole('button', { name: '현재 초안으로 계속' }).click()
  await page.getByRole('button', { name: '연결 완료' }).waitFor()
  const mergeStatus = await page.locator('.authPrepCard .muted').first().innerText()
  await capture(page, 'auth-login-guarded-merge.png')
  await page.close()

  return { guardReasons, mergeError, mergeOptions, mergeStatus }
}

const browser = await chromium.launch({ headless: true })
try {
  const directSuccess = await runDirectSuccess(browser)
  const guardedMerge = await runGuardedMerge(browser)
  console.log(JSON.stringify({ directSuccess, guardedMerge }, null, 2))
} finally {
  await browser.close()
}
