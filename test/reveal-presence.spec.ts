import { expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useRevealState, type RevealHost } from '../packages/core/src/vue/reveal-state.js'
import { node, renderer } from './renderer.js'

it('retains content through reversal, restores focus before hiding and rejects stale completion', async () => {
  const show = ref(false)
  let state!: ReturnType<typeof useRevealState>
  const app = renderer.createApp({
    setup() {
      state = useRevealState(() => show.value)
      return () => null
    },
  })
  app.mount(node('root'))
  const operations: {
    finished: Promise<boolean>
    resolve: (value: boolean) => void
    stop: ReturnType<typeof vi.fn>
  }[] = []
  const order: string[] = []
  const host: RevealHost = {
    animate: vi.fn(() => {
      let resolve!: (value: boolean) => void
      const finished = new Promise<boolean>((done) => {
        resolve = done
      })
      const operation = { finished, resolve, stop: vi.fn() }
      operations.push(operation)
      return operation
    }),
    interactive: (enabled) => {
      order.push(`interactive:${enabled}`)
    },
    restoreFocus: () => {
      order.push('restore')
    },
    captureFocus: vi.fn(),
    release: vi.fn(),
  }
  show.value = true
  await nextTick()
  expect(state.present.value).toBe(true)
  state.attach(host)
  expect(host.animate).toHaveBeenLastCalledWith(true, true)
  show.value = false
  await nextTick()
  expect(state.present.value).toBe(true)
  expect(order.slice(-2)).toEqual(['restore', 'interactive:false'])
  show.value = true
  await nextTick()
  expect(host.animate).toHaveBeenLastCalledWith(true, false)
  expect(operations[1]!.stop).not.toHaveBeenCalled()
  operations[1]!.resolve(true)
  await Promise.resolve()
  expect(state.present.value).toBe(true)
  expect(state.phase.value).toBe('opening')
  operations[2]!.resolve(true)
  await Promise.resolve()
  expect(state.phase.value).toBe('open')
  show.value = false
  await nextTick()
  operations[3]!.resolve(true)
  await Promise.resolve()
  expect(state.present.value).toBe(false)
  app.unmount()
  expect(host.release).toHaveBeenCalledOnce()
})

it('settles a pending mount and releases active work when its owner unloads', async () => {
  const show = ref(false)
  let state!: ReturnType<typeof useRevealState>
  const app = renderer.createApp({
    setup() {
      state = useRevealState(() => show.value)
      return () => null
    },
  })
  app.mount(node('root'))
  show.value = true
  await nextTick()
  show.value = false
  await nextTick()
  expect(state.present.value).toBe(false)
  const stop = vi.fn(),
    release = vi.fn()
  show.value = true
  await nextTick()
  state.attach({
    animate: () => ({ finished: new Promise(() => {}), stop }),
    release,
    captureFocus() {},
    restoreFocus() {},
    interactive() {},
  })
  state.detach()
  expect(stop).toHaveBeenCalledOnce()
  expect(release).toHaveBeenCalledOnce()
  expect(state.phase.value).toBe('open')
  app.unmount()
  expect(stop).toHaveBeenCalledOnce()
})
