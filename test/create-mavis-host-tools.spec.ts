import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import ts from 'typescript'
import { formatNumber } from '../packages/core/src/number-input.js'
import { formatDateTime } from '../packages/web/src/date-format.js'
import {
  createUtilities,
  utilitiesKey,
  type PlatformTools,
  type Scheduler,
} from './portable/hostToolsVue/shared/utilities.js'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler source is native ESM.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

async function host() {
  const source = await readFile(join(import.meta.dirname, 'portable/hostToolsVue/host.ts'), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
  const exports: { makeScheduler?: () => Scheduler; makePlatformTools?: () => PlatformTools } = {}
  const imports: Record<string, unknown> = {
    '@getcortexlabs/mavis-core': { formatNumber },
    '#mavis': { formatDateTime },
    './utilities': { createUtilities, utilitiesKey },
  }
  new Function('require', 'exports', compiled)((name: string) => {
    if (!(name in imports)) throw new Error(`Unexpected host import ${name}`)
    return imports[name]
  }, exports)
  return { scheduler: exports.makeScheduler!(), platform: exports.makePlatformTools!() }
}

afterEach(() => vi.useRealTimers())

describe('application-owned host services', () => {
  it('formats a real DST boundary and sends clipboard/URL requests through declared hosts', async () => {
    const { platform, scheduler } = await host()
    const tools = createUtilities(platform, scheduler)
    await tools.demonstrate()
    expect(tools.summary.value).toBe('1234,5; 01:30 → 03:30; copy true; open true; refused true')
  })

  it('settles cancelled timers, rejects invalid delays and permits a fresh schedule', async () => {
    vi.useFakeTimers()
    const { scheduler } = await host()
    const first = scheduler.wait(100)
    scheduler.cancel()
    await expect(first).resolves.toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    const second = scheduler.wait(25)
    await vi.advanceTimersByTimeAsync(25)
    await expect(second).resolves.toBe(true)
    await expect(scheduler.wait(-1)).rejects.toThrow('Timer delay')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps shared generation guards when a cancelled host still completes late', async () => {
    const { platform } = await host()
    const pending: ((elapsed: boolean) => void)[] = []
    const tools = createUtilities(platform, {
      wait: () => new Promise((resolve) => pending.push(resolve)),
      cancel() {},
    })
    const stale = tools.run(100)
    tools.cancel()
    const current = tools.run(25)
    pending[0]!(true)
    await stale
    expect(tools.timer.value).toBe('Waiting')
    expect(tools.completed.value).toBe(0)
    pending[1]!(true)
    await current
    expect(tools.timer.value).toBe('Elapsed')
    expect(tools.completed.value).toBe(1)
    expect(tools.cancelled.value).toBe(1)
  })

  it('surfaces host errors without pretending an operation succeeded', async () => {
    const { platform, scheduler } = await host()
    const tools = createUtilities(
      {
        ...platform,
        async copy() {
          throw new Error('Denied')
        },
      },
      scheduler,
    )
    await tools.demonstrate()
    expect(tools.summary.value).toBe('Host unavailable')
    await tools.run(-1)
    expect(tools.timer.value).toBe('Timer failed')
    expect(tools.completed.value).toBe(0)
  })

  it('generates the same host protocols, store and owned timer lifetime from both formats', async () => {
    const outputs = await Promise.all(
      ['hostTools', 'hostToolsVue'].map(async (name) =>
        compileProject(await readShared(join(import.meta.dirname, 'portable', name)), {
          root: 'HostTools',
        }),
      ),
    )
    const [tsx, vue] = outputs
    const withoutHeader = (source: string) => source.split('\n').slice(1).join('\n')
    for (const file of ['MavisStores.swift', 'HostTools.swift', 'Scheduled.swift'])
      expect(withoutHeader(tsx.swift.get(file))).toEqual(withoutHeader(vue.swift.get(file)))
    expect(vue.direct).toEqual(['shared/HostTools.vue', 'shared/Scheduled.vue'])
    const stores = vue.swift.get('MavisStores.swift')
    expect(stores).toContain('protocol Scheduler')
    expect(stores).toContain('func wait(_ milliseconds: Double) async throws -> Bool')
    expect(stores).toContain('protocol PlatformTools')
    expect(stores).toContain(
      'func formatTime(_ milliseconds: Double, _ timeZone: String) async throws -> String',
    )
    expect(vue.swift.get('Scheduled.swift')).toContain(
      '.mavisComponentLifetime(self.mavisLifetime)',
    )
    expect(vue.swift.get('Scheduled.swift')).toContain('self.tools.cancel()')
    expect(vue.swift.get('Scheduled.swift')).not.toContain('.onDisappear')
  })
})
