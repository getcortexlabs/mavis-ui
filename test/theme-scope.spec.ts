import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick, ref, type Component } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { defineTheme, mavis, midnight } from '../packages/core/src/index.js'
import {
  createThemeContext,
  MThemeProvider,
  themeKey,
  useMavisTheme,
  type Appearance,
  type AppearanceMode,
  type MavisThemeContext,
} from '../packages/core/src/vue/index.js'
import { MText } from '../packages/web/src/components/MText.js'
import { renderer, node } from './renderer.js'

const brand = defineTheme({ name: 'brand', colors: { primary: '#61264B' } })
const night = defineTheme({ name: 'brand-night', colors: { primary: '#F6BDDF' } }, midnight)

describe('theme scope', () => {
  it('renders nested scopes on the server and keeps siblings on the app theme', async () => {
    const app = createSSRApp({
      render: () =>
        h('div', [
          h(MText, { tone: 'primary', text: 'Outside' }),
          h(MThemeProvider, { theme: brand }, () => [
            h(MText, { tone: 'primary', text: 'Local' }),
            h(MThemeProvider, { theme: night }, () =>
              h(MText, { tone: 'primary', text: 'Nested' }),
            ),
          ]),
        ]),
    })
    app.provide(themeKey, createThemeContext(mavis))
    const html = await renderToString(app)
    expect(html).toContain('color:#B83670')
    expect(html).toContain('color:#61264B')
    expect(html).toContain('color:#F6BDDF')
    expect(html).not.toContain('m-theme-provider')
  })

  it('shares one device listener, inherits pairs, follows live props and requests controlled changes', async () => {
    let changed: ((value: Appearance) => void) | undefined
    const stop = vi.fn()
    const observe = vi.fn((listener: (value: Appearance) => void) => {
      changed = listener
      return stop
    })
    const parent = createThemeContext({
      theme: mavis,
      darkTheme: midnight,
      source: { current: () => 'light', observe },
    })
    const mode = ref<AppearanceMode>('system')
    const local = ref(brand)
    const shown = ref(true)
    let scope!: MavisThemeContext, nested!: MavisThemeContext
    const capture = (set: (value: MavisThemeContext) => void): Component => ({
      setup() {
        set(useMavisTheme())
        return () => null
      },
    })
    const root = node('root')
    const app = renderer.createApp({
      render: () =>
        shown.value
          ? h(
              MThemeProvider,
              {
                theme: local.value,
                appearance: mode.value,
                'onUpdate:appearance': (next: AppearanceMode) => {
                  mode.value = next
                },
                'onUpdate:theme': (next) => {
                  local.value = next
                },
              },
              () => [
                h(
                  capture((value) => {
                    scope = value
                  }),
                ),
                h(MThemeProvider, {}, () =>
                  h(
                    capture((value) => {
                      nested = value
                    }),
                  ),
                ),
              ],
            )
          : null,
    })
    app.provide(themeKey, parent)
    app.mount(root)
    expect(scope.theme.value.name).toBe('brand')
    expect(nested.theme.value.name).toBe('brand')
    changed!('dark')
    await nextTick()
    expect(scope.theme.value.name).toBe('midnight')
    expect(nested.theme.value.name).toBe('midnight')
    scope.setTheme(night)
    await nextTick()
    expect(scope.theme.value.name).toBe('brand-night')
    expect(parent.theme.value.name).toBe('midnight')
    scope.setAppearance('light')
    await nextTick()
    expect(scope.theme.value.name).toBe('mavis')
    expect(parent.appearance.value).toBe('system')
    shown.value = false
    await nextTick()
    expect(observe).toHaveBeenCalledOnce()
    expect(stop).not.toHaveBeenCalled()
    app.unmount()
    parent.dispose()
    expect(stop).toHaveBeenCalledOnce()
  })
  it('rejects a mismatched dark theme and unknown appearance during SSR', async () => {
    for (const props of [{ darkTheme: mavis }, { appearance: 'night' as never }]) {
      await expect(
        renderToString(createSSRApp({ render: () => h(MThemeProvider, props) })),
      ).rejects.toThrow(RangeError)
    }
  })
})
