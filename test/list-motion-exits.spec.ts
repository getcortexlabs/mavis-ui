import { describe, expect, it, vi } from 'vitest'
import { effectScope, ref, createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { useMavisListMotion } from '../packages/core/src/vue/list-motion.js'
import {
  bindMotionRegion,
  createMotionRegion,
  type MotionLayoutOptions,
  type MotionPlayback,
  type MotionRegionAdapter,
} from '../packages/core/src/experimental.js'

function operation() {
  let resolve!: (done: boolean) => void
  let reject!: (error: Error) => void
  const finished = new Promise<boolean>((yes, no) => {
    resolve = yes
    reject = no
  })
  const stop = vi.fn(() => resolve(false))
  return { finished, stop, resolve, reject }
}

function host(
  animateLayout: NonNullable<MotionRegionAdapter['animateLayout']>,
): MotionRegionAdapter {
  return {
    kind: 'web',
    animateLayout,
    viewportEnter() {
      throw new Error('Unexpected viewport owner')
    },
    sharedLayout() {
      throw new Error('Unexpected shared-layout owner')
    },
  }
}

describe('bounded keyed-list exits', () => {
  it.each([
    { exit: 'fadeOut', maxSnapshotPixels: 1 },
    { exit: false, maxSnapshotPixels: 32_000_000 },
    { exit: { opacity: 0.15, x: -20, y: 8, scale: 0.95 }, maxSnapshotPixels: 400_000 },
  ] satisfies MotionLayoutOptions[])(
    'delegates %j unchanged to the sole layout owner',
    async (options) => {
      const region = createMotionRegion(),
        current = operation()
      const animate = vi.fn((change: () => void) => {
        change()
        return current
      })
      const release = bindMotionRegion(region, host(animate))
      const change = vi.fn()
      const result = region.animateLayout(change, options)
      expect(animate).toHaveBeenCalledExactlyOnceWith(change, options)
      expect(change).toHaveBeenCalledOnce()
      release()
      expect(await result.finished).toBe(false)
      expect(current.stop).toHaveBeenCalledOnce()
    },
  )

  it.each([
    { exit: 'slideOut' },
    { exit: null },
    { exit: { rotate: 30 } },
    { exit: { opacity: -0.1 } },
    { exit: { opacity: 1.1 } },
    { exit: { x: Infinity } },
    { exit: { y: '8' } },
    { exit: { scale: 0 } },
    { exit: { scale: NaN } },
    { maxSnapshotPixels: 0 },
    { maxSnapshotPixels: 0.5 },
    { maxSnapshotPixels: 32_000_001 },
    { maxSnapshotPixels: Infinity },
  ])('rejects %j before mutation or interruption', (invalid) => {
    const region = createMotionRegion(),
      active = operation()
    const animate = vi.fn((change: () => void) => {
      change()
      return active
    })
    const release = bindMotionRegion(region, host(animate))
    region.animateLayout(() => {}, { exit: 'fadeOut' })
    const change = vi.fn()
    expect(() => region.animateLayout(change, invalid as MotionLayoutOptions)).toThrow()
    expect(change).not.toHaveBeenCalled()
    expect(animate).toHaveBeenCalledTimes(1)
    expect(active.stop).not.toHaveBeenCalled()
    release()
  })

  it('lets Jolt capture the current pose before interrupting and releases every pending call on scope disposal', async () => {
    const scope = effectScope()
    const list = scope.run(() => useMavisListMotion({ exit: 'fadeOut' }))!
    const first = operation(),
      second = operation()
    let calls = 0
    const release = bindMotionRegion(
      list.region,
      host((change) => {
        expect(first.stop).not.toHaveBeenCalled()
        change()
        return calls++ === 0 ? first : second
      }),
    )
    const rows = ref([1, 2, 3])
    const removing = list.update(() => {
      rows.value = [3, 1, 4]
    })
    const reinserted = list.update(() => {
      rows.value = [2, 4, 1, 3]
    })
    expect(rows.value).toEqual([2, 4, 1, 3])
    expect(first.stop).not.toHaveBeenCalled()
    scope.stop()
    expect(await removing.finished).toBe(false)
    expect(await reinserted.finished).toBe(false)
    expect(first.stop).toHaveBeenCalledOnce()
    expect(second.stop).toHaveBeenCalledOnce()
    expect(() => list.update(() => {})).toThrow(/disposed/)
    release()
  })

  it('forgets completed and rejected operations before later scope teardown', async () => {
    const scope = effectScope()
    const list = scope.run(() => useMavisListMotion())!
    const complete = operation(),
      failed = operation()
    let calls = 0
    const release = bindMotionRegion(
      list.region,
      host((change) => {
        change()
        return calls++ === 0 ? complete : failed
      }),
    )
    const first = list.update(() => {})
    complete.resolve(true)
    expect(await first.finished).toBe(true)
    const second = list.update(() => {})
    failed.reject(new Error('capture failed'))
    await expect(second.finished).rejects.toThrow('capture failed')
    scope.stop()
    release()
    expect(complete.stop).not.toHaveBeenCalled()
    expect(failed.stop).not.toHaveBeenCalled()
  })

  it('releases work when the mutation synchronously disposes its scope or replaces the host', async () => {
    const scope = effectScope()
    const list = scope.run(() => useMavisListMotion({ exit: 'fadeOut' }))!
    const current = operation()
    const release = bindMotionRegion(
      list.region,
      host((change) => {
        change()
        return current
      }),
    )
    const result = list.update(() => scope.stop())
    expect(await result.finished).toBe(false)
    expect(current.stop).toHaveBeenCalledOnce()
    release()

    const region = createMotionRegion(),
      removed = operation()
    const detach = bindMotionRegion(
      region,
      host((change) => {
        change()
        return removed
      }),
    )
    const unmounted = region.animateLayout(detach, { exit: 'fadeOut' })
    expect(await unmounted.finished).toBe(false)
    expect(removed.stop).toHaveBeenCalledOnce()
    unmounted.stop()
    expect(removed.stop).toHaveBeenCalledOnce()
  })

  it('mutates during SSR without allocating a renderer and keeps exit validation identical before mount', async () => {
    let playback: MotionPlayback | undefined
    const app = createSSRApp({
      setup() {
        const list = useMavisListMotion({ exit: { opacity: 0, y: 12 }, maxSnapshotPixels: 100 })
        const rows = ref([1, 2, 3])
        playback = list.update(() => {
          rows.value = [3, 1]
        })
        expect(list.region.available).toBe(false)
        return () => h('div', rows.value.join(','))
      },
    })
    expect(await renderToString(app)).toBe('<div>3,1</div>')
    expect(await playback!.finished).toBe(false)
    const scope = effectScope()
    expect(() => scope.run(() => useMavisListMotion({ maxSnapshotPixels: 0 }))).toThrow(
      /maxSnapshotPixels/,
    )
    const options: MotionLayoutOptions = { exit: 'fadeOut' }
    const list = scope.run(() => useMavisListMotion(options))!
    const change = vi.fn()
    options.maxSnapshotPixels = -1
    expect(() => list.update(change)).toThrow(/maxSnapshotPixels/)
    expect(change).not.toHaveBeenCalled()
    scope.stop()
  })

  it('rejects async mutations before their first side effect, mounted or not', () => {
    const scope = effectScope()
    const list = scope.run(() => useMavisListMotion({ exit: 'fadeOut' }))!
    const change = vi.fn()
    const update = async () => {
      change()
    }
    expect(() => list.update(update)).toThrow(/synchronous/)
    const animate = vi.fn()
    const release = bindMotionRegion(list.region, host(animate))
    expect(() => list.update(update)).toThrow(/synchronous/)
    expect(change).not.toHaveBeenCalled()
    expect(animate).not.toHaveBeenCalled()
    release()
    scope.stop()
  })
})
