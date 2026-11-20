import { expect, test } from '@playwright/test'

test('attachment and KeepAlive reconcile unnotified preferences without duplicate observers or idle polling', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window)
    const query = new EventTarget()
    let reduced = false,
      frames = 0,
      intervals = 0
    Object.defineProperties(query, {
      matches: { get: () => reduced },
      media: { value: '(prefers-reduced-motion: reduce)' },
    })
    window.matchMedia = (value) =>
      value === '(prefers-reduced-motion: reduce)' ? (query as MediaQueryList) : original(value)
    const raf = window.requestAnimationFrame.bind(window),
      interval = window.setInterval.bind(window)
    window.requestAnimationFrame = (callback) => {
      frames++
      return raf(callback)
    }
    window.setInterval = ((...args: Parameters<typeof window.setInterval>) => {
      intervals++
      return interval(...args)
    }) as typeof window.setInterval
    Object.defineProperty(window, 'DeviceOrientationEvent', {
      configurable: true,
      value: class extends Event {},
    })
    Object.assign(window, {
      __motionMedia(value: boolean, notify: boolean) {
        reduced = value
        if (notify) query.dispatchEvent(new Event('change'))
      },
      __motionWork: () => ({ frames, intervals }),
    })
  })
  await page.goto('/playground/#/checks/preference-race')
  const media = (value: boolean, notify = true) =>
    page.evaluate(
      ([value, notify]) => {
        ;(
          window as unknown as { __motionMedia(value: boolean, notify: boolean): void }
        ).__motionMedia(value!, notify!)
      },
      [value, notify],
    )
  const read = () =>
    page.evaluate(() =>
      (
        window as unknown as {
          __raceRead(): {
            attached: number
            released: number
            publicChanges: boolean[]
            sensor?: { status: string; samples: number; values: number[] }
            pointer?: { suspended: boolean; available: boolean; x: number }
          }
        }
      ).__raceRead(),
    )
  const orient = (alpha: number) =>
    page.evaluate((alpha) => {
      const event = new Event('deviceorientation')
      Object.assign(event, { alpha, beta: 0, gamma: 0 })
      window.dispatchEvent(event)
    }, alpha)
  await expect.poll(async () => (await read()).attached).toBe(0)
  for (let round = 0; round < 3; round++) {
    // MediaQueryList.matches changes before its queued event, exactly the race
    // fixed upstream in #436. An existing runtime still last reported false.
    await media(true, false)
    await page.locator(round === 0 ? '#race-mount' : '#race-active').click()
    await expect.poll(async () => (await read()).sensor?.status).toBe('paused')
    await media(false)
    await orient(0)
    await orient(60)
    await expect.poll(async () => (await read()).sensor?.status).toBe('active')
    const box = (await page.locator('#race-region').boundingBox())!
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5)
    await expect.poll(async () => (await read()).pointer?.x).toBeGreaterThan(10)
    expect((await read()).publicChanges).toEqual([])
    await media(false)
    expect((await read()).publicChanges).toEqual([])
    await page.locator('#race-active').click()
    await expect.poll(async () => (await read()).released).toBe(round + 1)
  }
  await media(true)
  await media(true)
  await media(false)
  await media(false)
  expect((await read()).publicChanges).toEqual([true, false])
  // No region is active, but the public observer is still subscribed.
  await page.mouse.move(0, 0)
  await page.waitForTimeout(800)
  const work = () =>
    page.evaluate(() => (window as unknown as { __motionWork(): unknown }).__motionWork())
  const idle = await work()
  await page.waitForTimeout(400)
  expect(await work()).toEqual(idle)
  await info.attach('preference-lifecycle', {
    body: JSON.stringify(await read(), null, 2),
    contentType: 'application/json',
  })
  expect(errors).toEqual([])
})
