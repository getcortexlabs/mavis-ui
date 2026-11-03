import { describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createMavisNavigation as webNavigation } from '../packages/web/src/router-navigation.js'
import { createMavisNavigation as nativeNavigation } from '../packages/nativescript/src/vue/router-navigation.js'
import { defineNavigationTransition } from '../packages/core/src/navigation-transition.js'

describe('router-owned navigation transitions', () => {
  it('preserves Vue Router guards, cancellation and SSR without touching the browser', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: {} },
        { path: '/next', component: {} },
        { path: '/blocked', component: {} },
      ],
    })
    router.beforeEach((to) => (to.path === '/blocked' ? false : undefined))
    const navigation = webNavigation(router, { transition: { name: 'slide' } })
    await navigation.push('/')
    const blocked = await navigation.push('/blocked')
    expect(blocked).toBeTruthy()
    expect(router.currentRoute.value.path).toBe('/')
    await navigation.push('/next')
    expect(router.currentRoute.value.path).toBe('/next')
    await navigation.replace('/')
    expect(router.currentRoute.value.path).toBe('/')
    navigation.dispose()
  })
  it('maps one policy to native push/replace without intercepting native back or failures', async () => {
    const failure = new Error('blocked')
    const router = {
      resolve: (href: string) => ({ href }),
      push: vi.fn(async () => failure),
      replace: vi.fn(),
      back: vi.fn(),
    }
    const navigation = nativeNavigation(router, { transition: { name: 'slide', duration: 180 } })
    expect(await navigation.push('/details')).toBe(failure)
    expect(router.push).toHaveBeenCalledWith('/details', {
      transition: { name: 'slide', duration: 180 },
    })
    await navigation.replace('/replacement')
    await navigation.back()
    expect(router.back).toHaveBeenCalledWith(undefined)
    const staticNavigation = nativeNavigation(router, { transition: { name: 'none' } })
    await staticNavigation.back()
    expect(router.back).toHaveBeenLastCalledWith({ animated: false })
  })
  it('rejects invalid policy before navigating', () => {
    expect(() => defineNavigationTransition({ name: 'unknown' as never })).toThrow()
    expect(() => defineNavigationTransition({ duration: Infinity })).toThrow()
    expect(defineNavigationTransition()).toEqual({ name: 'fade', duration: 220 })
  })
})
