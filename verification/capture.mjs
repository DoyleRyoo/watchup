import { chromium } from '/tmp/watchup-ui-tools/node_modules/playwright/index.mjs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { installVisualApi } from './fixtures.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((value) => value.replace(/^--/, '').split('=')))
const name = args.name ?? 'mobile_mainpage_white'
const width = Number(args.width ?? (name.startsWith('PC_') ? 1275 : 375))
const height = Number(args.height ?? (name.startsWith('PC_') ? 900 : 812))
const out = path.resolve(args.out ?? 'verification/artifacts/baseline')
const theme = args.theme ?? (name.includes('black') ? 'dark' : 'light')
const route = args.route ?? (name.startsWith('PC_') || name.includes('chart') || name.includes('purchasing') ? '/coins/KRW-BTC' : '/')
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ executablePath: '/tmp/watchup-ui-tools/browsers/chromium-1243/chrome-linux64/chrome', headless: true, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: theme, locale: 'ko-KR', reducedMotion: 'reduce' })
await context.addInitScript((mode) => localStorage.setItem('watchup.theme', mode), theme)
const page = await context.newPage()
const errors = []
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', (error) => errors.push(error.message))
const requests = await installVisualApi(page, { empty: name.includes('not_have'), single: name.includes('chart') || name.includes('purchasing') })
await page.goto(`http://127.0.0.1:4173${route}`, { waitUntil: 'networkidle' })
await page.locator('main').waitFor({ timeout: 30000 }).catch(async e => { console.log(errors, await page.content()); throw e })
if (route.includes('/coins/')) await page.locator('.coin-headline').waitFor()
else await page.locator('.coin-row').first().waitFor()
if (name.includes('searching')) {
  const input = page.getByRole('searchbox')
  if (!(await input.isVisible())) await page.getByRole('button', { name: '코인 검색으로 이동' }).click()
  await input.waitFor()
  await input.blur()
}
if (name.includes('purchasing')) {
  await page.getByRole('button', { name: '구매하기', exact: true }).click()
  if (name.includes('number')) await page.getByRole('button', { name: /수량/ }).click()
  if (name.includes('after')) {
    const input = page.locator('.buy-form input')
    await input.fill(name.includes('number') ? '99.999999999' : '999999999')
    await input.blur()
  }
}
await page.evaluate(async () => {
  await document.fonts.ready
  await Promise.all([...document.images].map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve })))
})
await page.mouse.move(width - 1, height - 1)
if (!name.includes('searching') && !name.includes('chart') && !name.includes('purchasing')) await page.locator('.holdings-list .coin-row').first().hover()
await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: false, animations: 'disabled' })
const metrics = await page.evaluate(() => ({
  viewport: { width: innerWidth, height: innerHeight }, dpr: devicePixelRatio,
  scrollWidth: document.documentElement.scrollWidth,
  theme: document.documentElement.dataset.theme,
  fonts: [...document.fonts].map((font) => ({ family: font.family, weight: font.weight, status: font.status })),
  images: [...document.images].map((img) => ({ src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0 })),
  main: document.querySelector('main')?.getBoundingClientRect().toJSON(),
}))
await writeFile(path.join(out, `${name}.json`), JSON.stringify({ name, source: `watch_up_infra/UI/${name}.png`, api: 'mocked, no real API or real account used', metrics, errors, requests }, null, 2))
await browser.close()
console.log(JSON.stringify({ capture: path.join(out, `${name}.png`), errors, metrics }, null, 2))
