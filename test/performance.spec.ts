import { describe, expect, it } from 'vitest'
import { compareReports, summarize, validateReport } from './performance/report'

function report() {
  const samples: Record<string, number[]> = {}
  const checks: Record<string, unknown> = {
    detachedCards: { captured: 32, loaded: 0, touchObservers: 0, unrestoredScale: 0 },
    detachedDuringPress: { captured: 1, loaded: 0, touchObservers: 0, unrestoredScale: 0 },
  }
  const add = (name: string, count: number) => {
    samples[name] = Array(count).fill(33)
  }
  add('bootstrap-to-frame', 1)
  for (const name of ['theme-32', 'text-32', 'loading-32']) add(name, 20)
  add('slider', 30)
  for (const name of ['reveal-update', 'press-down', 'press-up']) add(name, 10)
  add('motion-frame-interval', 100)
  for (const [count, depth] of [
    [4, 0],
    [4, 2],
    [4, 4],
    [4, 6],
    [8, 0],
    [32, 0],
    [64, 0],
  ])
    add(`mount-${count}-depth-${depth}`, 6)
  for (const path of ['/components/input', '/showcase/profile', '/showcase/focus']) {
    add(`navigate${path}`, 6)
    add(`back${path}`, 6)
    for (let i = 0; i < 6; i++)
      checks[`popped${path}-${i}`] = {
        captured: 2,
        loaded: 0,
        touchObservers: 0,
        unrestoredScale: 0,
      }
  }
  for (const name of ['idleWithControls', 'idleAfterRemoval', 'idleAfterNavigation'])
    checks[name] = { duration: 750, views: 6, viewsAfter: 6, layoutEvents: 0 }
  return {
    version: 1,
    complete: true,
    environment: { renderer: 'ios', model: 'test-device', build: 'debug' },
    samples,
    checks,
  }
}

describe('performance reports', () => {
  it('separates the first observation from warm samples', () => {
    expect(summarize([900, 10, 20, 30, 40, 50], true)).toEqual({
      count: 6,
      first: 900,
      median: 30,
      p95: 50,
      max: 50,
    })
    expect(() => summarize([Number.NaN])).toThrow('Invalid')
  })

  it('rejects missing workloads and retained press observers', () => {
    const data = report()
    expect(() => validateReport(data)).not.toThrow()
    data.checks.detachedDuringPress = {
      captured: 1,
      loaded: 0,
      touchObservers: 1,
      unrestoredScale: 0,
    }
    expect(() => validateReport(data)).toThrow('touchObservers')
    data.checks.detachedDuringPress = {
      captured: 1,
      loaded: 0,
      touchObservers: 0,
      unrestoredScale: 0,
    }
    delete data.samples['slider']
    expect(() => validateReport(data)).toThrow('Missing slider')
  })

  it('rejects idle work and a growing view tree after navigation', () => {
    const data = report()
    data.checks.idleAfterNavigation = { duration: 750, views: 7, viewsAfter: 7, layoutEvents: 0 }
    expect(() => validateReport(data)).toThrow('original view count')
    data.checks.idleAfterNavigation = { duration: 750, views: 6, viewsAfter: 6, layoutEvents: 1 }
    expect(() => validateReport(data)).toThrow('layoutEvents')
  })

  it('compares equivalent environments with an absolute noise allowance', () => {
    const baseline = report()
    const current = report()
    current.samples.slider = Array(30).fill(80)
    expect(compareReports(current, baseline)).toEqual([])
    current.samples.slider = Array(30).fill(100)
    expect(compareReports(current, baseline)).toHaveLength(2)
    current.environment.model = 'different-device'
    expect(() => compareReports(current, baseline)).toThrow('different model')
  })
})
