import { nextTick } from 'vue'
import { mavis, midnight } from '@mavis-ui/core'
import type { MavisThemeContext } from '@mavis-ui/core/vue'
import { workload } from './state'

export interface PerformanceReport {
  version: 1
  environment: Record<string, unknown>
  samples: Record<string, number[]>
  allocations: Record<string, number[]>
  checks: Record<string, unknown>
  stage: string
  complete: boolean
  error?: string
}

export interface PerformanceAdapter {
  environment: Record<string, unknown>
  now(): number
  allocatedBytes?(): number | undefined
  frame(): Promise<unknown>
  write(report: PerformanceReport): void
  navigate(path: string): Promise<unknown>
  back(): Promise<unknown>
  slider(value: number): void
  press(down: boolean): void | Promise<void>
  capture(route?: boolean): () => Record<string, unknown>
  idle(): Promise<Record<string, unknown>>
}

let adapter: PerformanceAdapter
let started = false
let boot = 0
export function configurePerformance(value: PerformanceAdapter) {
  adapter = value
  boot = adapter.now()
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
async function settle() {
  await nextTick()
  await adapter.frame()
  await adapter.frame()
}

// Two frame callbacks include scheduling latency. These are update-to-frame measurements,
// not GPU presentation timestamps, input-device latency, or full process cold starts.
export async function runPerformance(theme: MavisThemeContext) {
  if (started) return
  started = true
  const report: PerformanceReport = {
    version: 1,
    environment: adapter.environment,
    samples: {},
    allocations: {},
    checks: {},
    stage: 'first-render',
    complete: false,
  }
  const stage = (name: string) => {
    report.stage = name
    adapter.write(report)
  }
  async function measure(name: string, action: () => unknown) {
    const allocated = adapter.allocatedBytes?.()
    const start = adapter.now()
    await action()
    await settle()
    ;(report.samples[name] ??= []).push(adapter.now() - start)
    const after = adapter.allocatedBytes?.()
    if (allocated !== undefined && after !== undefined) {
      ;(report.allocations[name] ??= []).push(after - allocated)
    }
  }
  let stopFrames = () => {}
  try {
    await settle()
    report.samples['bootstrap-to-frame'] = [adapter.now() - boot]
    if (adapter.environment.suite === 'catalog') {
      stage('catalog')
      await measure('navigate/', () => adapter.navigate('/'))
      report.complete = true
      stage('complete')
      return
    }
    await pause(500)
    let slowDepth = Infinity
    for (const [count, depth] of [
      [4, 0],
      [4, 2],
      [4, 4],
      [4, 6],
      [8, 0],
      [32, 0],
      [64, 0],
    ] as const) {
      if (depth > slowDepth) {
        report.checks[`skipped-depth-${depth}`] = 'Previous depth median exceeded 250 ms'
        continue
      }
      const name = `mount-${count}-depth-${depth}`
      stage(name)
      for (let iteration = 0; iteration < 6; iteration++) {
        workload.active = false
        await settle()
        await measure(name, () => {
          Object.assign(workload, { count, depth, active: true })
        })
        adapter.write(report)
      }
      const warm = report.samples[name]!.slice(1).sort((a, b) => a - b)
      if (warm[2]! > 250) slowDepth = depth
    }
    workload.active = false
    await settle()
    Object.assign(workload, { active: true, count: 32, depth: 0 })
    await settle()
    stage('theme-and-text')
    for (let i = 0; i < 20; i++) {
      await measure('theme-32', () => theme.setTheme(i % 2 ? mavis : midnight))
      await measure('text-32', () => workload.revision++)
    }
    for (let i = 0; i < 20; i++) {
      await measure('loading-32', () => {
        workload.busy = !workload.busy
      })
    }
    const detached = adapter.capture()
    workload.active = false
    await settle()
    report.checks.detachedCards = detached()
    workload.controls = true
    await settle()
    stage('slider')
    for (let i = 1; i <= 30; i++) {
      await measure('slider', () => adapter.slider(i * 3))
      if (workload.value !== i * 3) throw new Error('Slider did not update its model')
    }
    stage('motion')
    let recordingFrames = true
    stopFrames = () => {
      recordingFrames = false
    }
    const frameIntervals: number[] = []
    const frames = (async () => {
      let previous = adapter.now()
      while (recordingFrames) {
        await adapter.frame()
        const current = adapter.now()
        if (recordingFrames) frameIntervals.push(current - previous)
        previous = current
      }
    })()
    for (let i = 0; i < 10; i++) {
      await measure('reveal-update', () => {
        workload.revealed = !workload.revealed
      })
      await pause(250)
      await measure('press-down', () => adapter.press(true))
      await pause(220)
      await measure('press-up', () => adapter.press(false))
      await pause(500)
    }
    recordingFrames = false
    await frames
    report.samples['motion-frame-interval'] = frameIntervals
    report.checks.idleWithControls = await adapter.idle()
    const removed = adapter.capture()
    await adapter.press(true)
    workload.controls = false
    await settle()
    await pause(550)
    report.checks.detachedDuringPress = removed()
    await adapter.press(false)
    report.checks.idleAfterRemoval = await adapter.idle()
    stage('navigation')
    for (const path of ['/components/input', '/showcase/profile', '/showcase/focus']) {
      for (let i = 0; i < 6; i++) {
        stage(`navigation${path}-${i}`)
        await measure(`navigate${path}`, () => adapter.navigate(path))
        await pause(350)
        const popped = adapter.capture(true)
        await measure(`back${path}`, () => adapter.back())
        await pause(350)
        report.checks[`popped${path}-${i}`] = popped()
      }
    }
    report.checks.idleAfterNavigation = await adapter.idle()
    report.complete = true
    stage('complete')
  } catch (error) {
    report.error = String(error)
    adapter.write(report)
    console.error(error)
  } finally {
    stopFrames()
  }
}
