import { afterEach, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createMavisNavigation } from '../packages/web/src/router-navigation.js'
import { createNuxtMavisNavigation } from '../packages/web/src/nuxt-navigation.js'

afterEach(() => vi.unstubAllGlobals())

function fixture() {
  const media = new EventTarget()
  const document = {
    activeElement: null as Element | null,
    body: {},
    defaultView: { HTMLElement: null as unknown as typeof Element, matchMedia: () => media },
    querySelector: () => heading,
  }
  class Element extends EventTarget {
    isConnected = true
    id = ''
    tabIndex = -1
    attributes = new Map<string, string>()
    getAttribute(key: string) {
      return this.attributes.get(key) ?? null
    }
    hasAttribute(key: string) {
      return this.attributes.has(key)
    }
    setAttribute(key: string, value: string) {
      this.attributes.set(key, value)
    }
    removeAttribute(key: string) {
      this.attributes.delete(key)
    }
    focus = vi.fn(() => {
      document.activeElement = this
    })
  }
  const heading = new Element()
  document.defaultView.HTMLElement = Element
  document.activeElement = document.body as Element
  vi.stubGlobal('document', document)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: {} },
      { path: '/a', component: {} },
      { path: '/b', component: {} },
    ],
  })
  return { router, heading, document }
}

it('aborts stale readiness without stealing focus and removes hooks on disposal', async () => {
  const { router, heading, document } = fixture()
  await router.push('/')
  const waiting: { signal: AbortSignal; resolve(): void }[] = []
  const navigation = createMavisNavigation(router, {
    ready: (signal) => new Promise<void>((resolve) => waiting.push({ signal, resolve })),
  })
  await router.push('/a')
  await router.push('/b')
  expect(waiting[0]!.signal.aborted).toBe(true)
  waiting[0]!.resolve()
  await Promise.resolve()
  expect(heading.focus).not.toHaveBeenCalled()
  waiting[1]!.resolve()
  await vi.waitFor(() => expect(heading.focus).toHaveBeenCalledTimes(1))
  expect(document.activeElement).toBe(heading)
  expect(heading.getAttribute('tabindex')).toBe('-1')
  navigation.dispose()
  expect(heading.hasAttribute('tabindex')).toBe(false)
  await router.push('/')
  expect(waiting).toHaveLength(2)
})

it('subscribes to Nuxt page readiness before confirmation and releases abandoned subscriptions', async () => {
  const { router, heading } = fixture()
  await router.push('/')
  const callbacks = new Set<() => void>()
  const navigation = createNuxtMavisNavigation({
    $router: router,
    hook(_name, callback) {
      callbacks.add(callback)
      return () => {
        callbacks.delete(callback)
      }
    },
  })
  await router.push('/a')
  expect(callbacks.size).toBe(1)
  expect(heading.focus).not.toHaveBeenCalled()
  for (const callback of callbacks) callback()
  await vi.waitFor(() => expect(heading.focus).toHaveBeenCalledTimes(1))
  expect(callbacks.size).toBe(0)
  await router.push('/b')
  expect(callbacks.size).toBe(1)
  navigation.dispose()
  expect(callbacks.size).toBe(0)
})
