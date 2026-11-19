import { expect, test, type Page } from '@playwright/test'

async function read(page: Page) {
  await page.locator('#combined-read').click()
  return JSON.parse((await page.locator('#combined-state').textContent())!)
}
async function position(page: Page) {
  return page.locator('#combined-surface').evaluate((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform)
    return { x: matrix.m41, scale: Math.hypot(matrix.a, matrix.b) }
  })
}
const open = async (page: Page) => {
  await page.goto('/playground/#/checks/combined-values?lang=en')
  await expect.poll(async () => (await read(page)).generation).toBe(1)
  await expect.poll(async () => Math.abs((await position(page)).x - 20)).toBeLessThan(0.05)
}

test('a moving Mavis spring reports zero derived velocity while paused and keeps momentum on resume', async ({
  page,
}) => {
  await open(page)
  // Dispatch together so actionability/scroll waits cannot let the spring settle
  // before observing the pause. Values still come through the shared Mavis API.
  const snapshots = await page.evaluate(async () => {
    const click = (id: string) => document.getElementById(id)!.click()
    const read = () => {
      click('combined-read')
      return JSON.parse(document.getElementById('combined-state')!.textContent!)
    }
    click('combined-retarget')
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )
    read()
    await Promise.resolve()
    const moving = read()
    click('combined-pause')
    await Promise.resolve()
    const paused = read()
    click('combined-resume')
    await Promise.resolve()
    const resumed = read()
    return { moving, paused, resumed }
  })
  expect(Math.abs(snapshots.moving.speed)).toBeGreaterThan(0)
  expect(snapshots.paused).toMatchObject({ paused: true, speed: 0 })
  expect(snapshots.resumed.paused).toBe(false)
  expect(Math.abs(snapshots.resumed.speed)).toBeGreaterThan(0)
  await expect.poll(async () => Math.abs((await position(page)).x - 40)).toBeLessThan(0.05)
})

test('two shared sources retarget one Jolt graph, pause and resume without Vue frame updates', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await open(page)
  await expect.poll(async () => (await read(page)).moving).toBe(false)
  await page.locator('#combined-pause').click()
  const held = (await position(page)).x
  await page.locator('#combined-retarget').click()
  expect(await read(page)).toMatchObject({ a: 120, b: -40, total: 40, paused: true })
  await page.waitForTimeout(160)
  expect((await position(page)).x).toBeCloseTo(held, 2)
  const snapshot = await page.locator('#combined-state').textContent()
  await page.locator('#combined-resume').click()
  const atResume = await page.locator('#combined-state').textContent()
  expect(atResume).not.toBe(snapshot)
  await expect.poll(async () => Math.abs((await position(page)).x - 40)).toBeLessThan(0.05)
  expect(await page.locator('#combined-state').textContent()).toBe(atResume)
  await page.locator('#combined-b').click()
  expect(await read(page)).toMatchObject({ a: 120, b: -50, total: 35 })
  await expect.poll(async () => Math.abs((await position(page)).x - 35)).toBeLessThan(0.05)
  expect(errors).toEqual([])
})

test('disposing a graph borrows inputs and leaves unrelated scale alive; remount invalidates old handles', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await open(page)
  await page.locator('#combined-dispose-graph').click()
  expect(await read(page)).toMatchObject({
    totalDisposed: true,
    followerDisposed: true,
    inputDisposed: false,
  })
  await page.locator('#combined-a').click()
  expect(await read(page)).toMatchObject({ a: 40, b: 20, total: null })
  await page.locator('#combined-scale').click()
  await expect.poll(async () => (await position(page)).scale).toBeCloseTo(1.08, 3)
  await page.locator('#combined-toggle').click()
  await expect(page.locator('#combined-surface')).toHaveCount(0)
  await page.locator('#combined-toggle').click()
  await expect.poll(async () => (await read(page)).generation).toBe(2)
  await page.locator('#combined-stale').click()
  expect(await read(page)).toMatchObject({ a: 20, b: 20, total: 20, staleRejected: true })
  await page.locator('#combined-dispose-input').click()
  expect(await read(page)).toMatchObject({
    inputDisposed: true,
    totalDisposed: true,
    followerDisposed: true,
    b: 20,
  })
  expect(errors).toEqual([])
})
