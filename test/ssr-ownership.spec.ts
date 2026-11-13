import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, useId } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createMotionSurface } from '../packages/core/src/experimental.js'
import { componentNames, targetCapabilities } from '../packages/core/src/capabilities.js'
import { componentProps } from '../packages/core/src/vue/component-props.js'
import { spanProps } from '../packages/core/src/vue/props.js'
import { themeProviderProps } from '../packages/core/src/vue/theme-provider.js'
import { platformProps } from '../packages/core/src/vue/platform.js'
import * as web from '../packages/web/src/index.js'

afterEach(() => vi.useRealTimers())

describe('request-owned Vue SSR', () => {
  it('keeps all declared components registered and avoids inferred future targets', () => {
    const app = createSSRApp({ render: () => null }).use(web.createMavis())
    const props = {
      ...componentProps,
      MSpan: spanProps,
      MThemeProvider: themeProviderProps,
      MPlatform: platformProps,
    }
    expect(Object.keys(props).sort()).toEqual([...componentNames].sort())
    for (const name of componentNames) expect(app.component(name)).toBe(web[name])
    expect(targetCapabilities.targets.map((t) => t.id)).toEqual([
      'vue-web',
      'vue-nativescript',
      'macos-swiftui',
    ])
    expect(targetCapabilities.targets[0].ssr.availability).toBe('0.1.0-alpha.5')
    expect(targetCapabilities.targets[1].rendering.serverHTML).toBe('unsupported')
  })

  it('renders motion, overlays and queued feedback without browser effects or clocks', async () => {
    vi.useFakeTimers()
    const surface = createMotionSurface()
    const app = createSSRApp(
      defineComponent({
        setup() {
          const toast = web.useToast({ scope: 'app' })
          toast.show({ message: 'Request-only feedback', duration: 3000 })
          return () =>
            h(web.MScreen, {}, () => [
              h(web.MButton, { motionSurface: surface }, () => 'Continue'),
              h(web.MReveal, { show: true }, () => h(web.MText, {}, () => 'Server content')),
              h(web.MSheet, { open: true, title: 'Server sheet' }, () => 'Deferred modal'),
              h(web.MDialog, { open: true, title: 'Server dialog' }),
            ])
        },
      }),
    ).use(web.createMavis())
    const html = await renderToString(app)
    expect(html).toContain('Server content')
    expect(html).not.toContain('Request-only feedback')
    expect(surface.available).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    expect(html).not.toMatch(/<dialog[^>]*\sopen(?:\s|>)/)
  })

  it('isolates overlapping async requests and scopes, including a failed render', async () => {
    let finish!: () => void
    const pending = new Promise<void>((resolve) => {
      finish = resolve
    })
    function render(name: string, dark: boolean, gate?: Promise<void>, fail = false) {
      const component = defineComponent({
        async setup() {
          const id = useId()
          const { theme } = web.useMavisTheme()
          if (gate) await gate
          if (fail) throw new Error('Request failed')
          return () =>
            h(web.MColumn, { id }, () => [
              h(web.MInput, { label: name, modelValue: name }),
              h(web.MText, {}, () => `${name}:${theme.value.name}`),
              h(web.MThemeProvider, { theme: web.midnight }, () =>
                h(web.MText, {}, () => 'Scoped'),
              ),
            ])
        },
      })
      const app = createSSRApp(component).use(
        web.createMavis({ appearance: dark ? 'dark' : 'light', darkTheme: web.midnight }),
      )
      app.config.idPrefix = name
      app.config.errorHandler = (error) => {
        throw error
      }
      return renderToString(app)
    }
    const first = render('first', true, pending)
    const second = await render('second', false)
    await expect(render('failed', true, undefined, true)).rejects.toThrow('Request failed')
    finish()
    const slow = await first
    const after = await render('after', false)
    expect(slow).toContain('first:midnight')
    expect(second).toContain('second:mavis')
    expect(after).toContain('after:mavis')
    expect(slow).not.toContain('second')
    expect(second).not.toContain('first')
    expect(after).not.toContain('failed')
    expect(slow).toContain('id="first-')
    expect(second).toContain('id="second-')
  })
})
