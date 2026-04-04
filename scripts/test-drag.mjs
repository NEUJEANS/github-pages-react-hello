import { chromium, devices } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.argv[2] || 'http://localhost:5173/github-pages-react-hello/#layout'
const outDir = path.resolve('playwright-artifacts')
await fs.mkdir(outDir, { recursive: true })

async function runDesktop() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.locator('button.tool').nth(0).waitFor()

  const firstItem = page.locator('.roomFrame .placed').first()
  const before = await firstItem.boundingBox()
  await firstItem.dragTo(page.locator('.roomFrame'), {
    targetPosition: { x: 480, y: 210 },
    sourcePosition: { x: Math.max(8, (before?.width ?? 20) / 2), y: Math.max(8, (before?.height ?? 20) / 2) },
  })
  const after = await firstItem.boundingBox()
  const metaTexts = await page.locator('.editorCanvasMeta span').allInnerTexts()
  const notice = metaTexts[metaTexts.length - 1] ?? ''
  await page.screenshot({ path: path.join(outDir, 'desktop-layout-after-drag.png'), fullPage: true })
  await browser.close()
  return { before, after, notice }
}

async function runTouch() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ ...devices['iPhone 13'] })
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const item = page.locator('.roomFrame .placed').first()
  await item.waitFor()
  const before = await item.boundingBox()
  const room = await page.locator('.roomFrame').boundingBox()
  if (!before || !room) throw new Error('Missing geometry for touch test')

  const startX = before.x + before.width / 2
  const startY = before.y + before.height / 2
  const endX = room.x + room.width * 0.72
  const endY = room.y + room.height * 0.45

  await page.touchscreen.tap(startX, startY)
  await page.evaluate(({ sx, sy }) => {
    const target = document.elementFromPoint(sx, sy)
    if (!target) throw new Error('No target at touch start')
  }, { sx: startX, sy: startY })

  await page.dispatchEvent('.roomFrame .placed', 'pointerdown', { pointerType: 'touch', isPrimary: true, button: 0, clientX: startX, clientY: startY })
  await page.mouse.move(endX, endY, { steps: 16 })
  await page.dispatchEvent('.roomFrame .placed', 'pointerup', { pointerType: 'touch', isPrimary: true, button: 0, clientX: endX, clientY: endY })

  const after = await item.boundingBox()
  await page.screenshot({ path: path.join(outDir, 'mobile-layout-after-drag.png'), fullPage: true })
  await browser.close()
  return { before, after }
}

const desktop = await runDesktop()
let touch = null
let touchError = null
try {
  touch = await runTouch()
} catch (error) {
  touchError = error instanceof Error ? error.message : String(error)
}

console.log(JSON.stringify({ desktop, touch, touchError }, null, 2))
