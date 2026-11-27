const assert = require('node:assert/strict')
const { createServer } = require('node:http')
const { readFileSync } = require('node:fs')
const { chromium, expect } = require('@playwright/test')

const core = 'https://atomicdata.dev/properties/'
const props = 'https://atomicdata.dev/integrations/properties/'
const catalog = JSON.parse(readFileSync('upstream-catalog.json', 'utf8'))
const todonna = catalog.find(entry => entry[core + 'shortname'] === 'todonna')
assert.ok(todonna)
const moduleUrl = todonna[props + 'app-module']

if (process.argv[2] === 'serve') {
  createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.end(JSON.stringify(request.url === '/catalog.json' ? [todonna] : []))
  }).listen(8000, '127.0.0.1')
} else {
  verify().catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}

async function verify () {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  await page.addInitScript(() => {
    if (location.origin === 'http://localhost:6747') {
      localStorage.setItem('plugin-catalog-url', 'http://localhost:8000/catalog.json')
    }
  })
  const diagnostics = []
  page.on('pageerror', error => diagnostics.push(error.message))
  page.on('console', message => { if (message.type() === 'error') diagnostics.push(message.text()) })
  page.on('requestfailed', request => diagnostics.push(request.url() + ' ' + request.failure()?.errorText))
  try {
    await page.goto('http://localhost:6747/app/dev-drive', { waitUntil: 'commit', timeout: 90000 })
    await page.waitForURL(/(?:did(?:%3A|:)ad|atomic)(?:%3A|:)/, { timeout: 150000 })
    console.log('Created fresh drive')
    await page.goto('http://localhost:6747/app/integrations', { waitUntil: 'commit', timeout: 90000 })
    await page.getByRole('checkbox', { name: 'Show experimental plugins' }).check({ timeout: 30000 })
    const install = page.getByRole('button', { name: 'Install Todonna', exact: true })
    await install.waitFor({ timeout: 40000 })
    const download = page.waitForResponse(r => r.url() === moduleUrl && r.ok(), { timeout: 50000 })
    await install.click()
    await download
    const frameSelector = 'iframe[title="App"][sandbox="allow-scripts allow-modals"]'
    const frame = page.frameLocator(frameSelector)
    const input = frame.getByPlaceholder('New item')
    await expect(input).toBeVisible({ timeout: 90000 })
    await input.fill('Buy milk')
    await frame.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(frame.locator('#todo-list').getByText('Buy milk')).toBeVisible()
    await frame.getByTitle('Change todo item state').click()
    await frame.locator('#week-tab').click()
    await expect(frame.locator('#done-list').getByText('Buy milk')).toBeVisible()
    await page.reload({ waitUntil: 'commit', timeout: 90000 })
    const reopened = page.frameLocator(frameSelector)
    await reopened.locator('#week-tab').click({ timeout: 90000 })
    await expect(reopened.locator('#done-list').getByText('Buy milk')).toBeVisible()
    console.log('Installed the live bundle, completed a task through Atomic, and reopened it after reload')
  } catch (error) {
    console.error((await page.locator('body').innerText().catch(() => '')).slice(0, 3200))
    for (const frame of page.frames().slice(1)) {
      console.error(frame.url(), (await frame.locator('body').innerText({ timeout: 3000 }).catch(() => '')).slice(0, 1000))
    }
    console.error(diagnostics.slice(-35).join('\n'))
    throw error
  } finally {
    await browser.close()
  }
}
