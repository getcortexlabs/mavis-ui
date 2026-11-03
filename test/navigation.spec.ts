import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createRouterNavigation, resolveNavigation } from '../packages/core/src/link.js'
import { createMavis, MLink, MButton, MCard } from '../packages/web/src/index.js'
import { navigationAttrs } from '../packages/web/src/navigation.js'
vi.mock('@nativescript/core', () => ({ Utils: { openUrl: vi.fn(() => true) } }))
import { Utils } from '@nativescript/core'
import { navigateNative, nativeDestination } from '../packages/nativescript/src/vue/navigation.js'

function router(base = '/app/') {
  return createRouter({
    history: createMemoryHistory(base),
    routes: [
      { path: '/', component: { render: () => null } },
      { path: '/places/:id', component: { render: () => null } },
    ],
  })
}
const click = (extra = {}) => {
  const event = {
    button: 0,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true
    },
    ...extra,
  }
  return event as unknown as MouseEvent
}
describe('app navigation', () => {
  it('resolves real base URLs and delegates guards, replace and back to the supplied router', async () => {
    const host = router(),
      adapter = createRouterNavigation(host)
    const guard = vi.fn(() => false)
    host.beforeEach(guard)
    expect(adapter.resolve('/places/library?mode=read#title')).toBe(
      '/app/places/library?mode=read#title',
    )
    await adapter.push('/places/library')
    expect(guard).toHaveBeenCalledOnce()
    expect(host.currentRoute.value.path).toBe('/')
    const replace = vi.spyOn(host, 'replace'),
      back = vi.spyOn(host, 'back')
    await adapter.replace('/places/library')
    await adapter.back()
    expect(replace).toHaveBeenCalledWith('/places/library')
    expect(back).toHaveBeenCalledOnce()
    await expect(adapter.push('https://example.com')).rejects.toThrow('in-app')
  })
  it('isolates navigation between SSR apps for Link, Button and Card', async () => {
    const render = async (base: string) => {
      const app = createSSRApp({
        render: () =>
          h('div', [
            h(MLink, { href: '/places/library', text: 'Library' }),
            h(MButton, { href: '/places/library', text: 'Open' }),
            h(MCard, { href: '/places/library', accessibilityLabel: 'Card' }),
          ]),
      })
      app.use(createMavis({ navigation: createRouterNavigation(router(base)) }))
      return renderToString(app)
    }
    const [a, b] = await Promise.all([render('/one/'), render('/two/')])
    expect(a.match(/href="\/one\/places\/library"/g)).toHaveLength(3)
    expect(b.match(/href="\/two\/places\/library"/g)).toHaveLength(3)
    expect(a).not.toContain('/two/')
  })
  it('keeps external URLs and explicit callbacks outside the global adapter', () => {
    const adapter = createRouterNavigation(router())
    for (const href of ['https://example.com', 'mailto:test@example.com', '//example.com/path']) {
      expect(resolveNavigation({ href }, adapter)).toEqual({ href })
    }
    const navigate = vi.fn()
    expect(resolveNavigation({ href: '/places/library', navigate }, adapter)).toEqual({
      href: '/places/library',
      navigate,
    })
    expect(() => resolveNavigation({ href: 'javascript:alert(1)' }, adapter)).toThrow('executable')
  })
  it('preserves modified/new-tab clicks and passes the original route to push', async () => {
    const host = router(),
      push = vi.spyOn(host, 'push'),
      activate = vi.fn(),
      fail = vi.fn()
    const options = resolveNavigation({ href: '/places/library' }, createRouterNavigation(host))
    for (const modifiers of [
      { ctrlKey: true },
      { metaKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
      { defaultPrevented: true },
    ]) {
      const event = click(modifiers)
      navigationAttrs(options, false, activate, fail).onClick(event)
    }
    const blank = click()
    navigationAttrs({ ...options, target: '_blank' }, false, activate, fail).onClick(blank)
    expect(blank.defaultPrevented).toBe(false)
    expect(push).not.toHaveBeenCalled()
    const event = click()
    navigationAttrs(options, false, activate, fail).onClick(event)
    expect(event.defaultPrevented).toBe(true)
    expect(push).toHaveBeenCalledWith('/places/library')
    await vi.waitFor(() => expect(host.currentRoute.value.path).toBe('/places/library'))
    expect(fail).not.toHaveBeenCalled()
  })
  it('blocks disabled links and reports rejected navigation', async () => {
    const fail = vi.fn(),
      navigate = vi.fn(() => Promise.reject(new Error('offline'))),
      activate = vi.fn()
    navigationAttrs({ href: '/places/library', navigate }, true, activate, fail).onClick(click())
    expect(activate).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    navigationAttrs({ href: '/places/library', navigate }, false, activate, fail).onClick(click())
    await vi.waitFor(() =>
      expect(fail).toHaveBeenCalledWith(expect.objectContaining({ message: 'offline' })),
    )
  })
  it('uses native router destinations and preserves system external URL handling', async () => {
    const push = vi.fn(),
      adapter = createRouterNavigation({
        resolve: (fullPath) => ({ fullPath }),
        push,
        replace: vi.fn(),
        back: vi.fn(),
      })
    const options = resolveNavigation({ href: '/places/library' }, adapter)
    expect(nativeDestination(options)).toBe('/places/library')
    await navigateNative(options)
    expect(push).toHaveBeenCalledWith('/places/library')
    await navigateNative(resolveNavigation({ href: 'https://example.com' }, adapter))
    expect(Utils.openUrl).toHaveBeenCalledWith('https://example.com')
    expect(() => nativeDestination({ href: '/places/library' })).toThrow('navigate handler')
  })
})
