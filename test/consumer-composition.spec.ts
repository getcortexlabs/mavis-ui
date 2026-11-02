import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  defineTheme,
  mavis,
  midnight,
  motionRecipe,
  pressMotion,
  stackLayout,
} from '../packages/core/src/index.js'
import { createThemeContext, MThemeProvider, themeKey } from '../packages/core/src/vue/index.js'
import { MStack } from '../packages/web/src/components/MStack.js'
import { MButton } from '../packages/web/src/components/MButton.js'
import { MCard } from '../packages/web/src/components/MCard.js'
import { MLink } from '../packages/web/src/components/MLink.js'
import { MInput } from '../packages/web/src/components/MInput.js'
import { navigationAttrs } from '../packages/web/src/navigation.js'
import { themeVariables, useMavisTokens } from '../packages/web/src/tokens.js'
import { find, node, renderer } from './renderer.js'

vi.mock('../packages/web/src/motion.ts', () => ({ usePressFeedback: () => ({}) }))

describe('navigation composition', () => {
  it('renders Button and Card as single anchors and preserves native form buttons', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h('div', [
            h(MButton, {
              href: '/account',
              target: '_blank',
              rel: 'opener author',
              text: 'Account',
            }),
            h(MCard, { href: '/record' }, () => h('h2', 'Record')),
            h(MButton, { type: 'submit', text: 'Save' }),
            h(MLink, { href: '/disabled', disabled: true, text: 'Unavailable' }),
          ]),
      }),
    )
    expect(html.match(/<a\b/g)).toHaveLength(3)
    expect(html).toContain('rel="author noopener noreferrer"')
    expect(html).toContain('href="/record"')
    expect(html).toContain('type="submit"')
    expect(html).not.toContain('href="/disabled"')
    expect(html.match(/<button\b/g)).toHaveLength(1)
  })
  it('lets the browser own modified clicks and calls host navigation only for ordinary activation', async () => {
    const navigate = vi.fn(),
      activate = vi.fn(),
      fail = vi.fn()
    const attrs = navigationAttrs({ href: '/next', navigate }, false, activate, fail)
    const event = (extra = {}) =>
      ({
        button: 0,
        defaultPrevented: false,
        preventDefault: vi.fn(),
        ...extra,
      }) as unknown as MouseEvent
    for (const flags of [
      { ctrlKey: true },
      { metaKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
    ]) {
      const click = event(flags)
      attrs.onClick(click)
      expect(click.preventDefault).not.toHaveBeenCalled()
    }
    expect(navigate).not.toHaveBeenCalled()
    const click = event()
    attrs.onClick(click)
    expect(click.preventDefault).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledWith('/next')
    navigationAttrs({ href: '/next', navigate }, true, activate, fail).onClick(event())
    expect(navigate).toHaveBeenCalledOnce()
    const failure = new Error('Navigation rejected')
    navigationAttrs(
      { href: '/next', navigate: () => Promise.reject(failure) },
      false,
      activate,
      fail,
    ).onClick(event())
    await Promise.resolve()
    expect(fail).toHaveBeenCalledWith(failure)
    expect(() => navigationAttrs({ href: 'javascript:alert(1)' }, false, activate, fail)).toThrow()
  })
})

describe('responsive layout', () => {
  it('resolves sorted container breakpoints with a deterministic server default', () => {
    const points = [
      { at: 1000, gap: 'xl' as const },
      { at: 600, direction: 'row' as const, gap: 'lg' as const },
    ]
    expect(stackLayout({ direction: 'column', gap: 'sm' }, points)).toEqual({
      direction: 'column',
      gap: 'sm',
    })
    expect(stackLayout({ direction: 'column' }, points, 800)).toEqual({
      direction: 'row',
      gap: 'lg',
    })
    expect(stackLayout({ direction: 'column' }, points, 1200)).toEqual({
      direction: 'row',
      gap: 'xl',
    })
    expect(points[0]!.at).toBe(1000)
    expect(() => stackLayout({}, [{ at: 600 }, { at: 600 }])).toThrow()
  })
  it('keeps the editor node and changes default child shrink when its content width changes', async () => {
    let resized!: (entries: { contentRect: { width: number } }[]) => void
    const observers: { disconnect: ReturnType<typeof vi.fn>; callback: typeof resized }[] = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(public callback: typeof resized) {
          observers.push(this)
        }
        observe(target: { props?: { class?: string } }) {
          if (target.props?.class === 'm-stack') resized = this.callback
        }
        disconnect = vi.fn()
      },
    )
    const root = node('root')
    const value = ref('Retained draft')
    const app = renderer.createApp({
      render: () =>
        h(MStack, { responsive: { at: 600, direction: 'row', gap: 'lg' } }, () =>
          h(MInput, { label: 'Name', modelValue: value.value }),
        ),
    })
    try {
      app.mount(root)
      const input = find(root, 'input')
      resized([{ contentRect: { width: 800 } }])
      await nextTick()
      expect(find(root, 'input')).toBe(input)
      expect(input.props.value).toBe('Retained draft')
      const stack = find(root, 'div')
      expect(stack.props.style).toMatchObject({ flexDirection: 'row', gap: '24px' })
      resized([{ contentRect: { width: 320 } }])
      await nextTick()
      expect(find(root, 'input')).toBe(input)
      expect(stack.props.style).toMatchObject({ flexDirection: 'column' })
    } finally {
      app.unmount()
      vi.unstubAllGlobals()
    }
    expect(
      observers.find((observer) => observer.callback === resized)!.disconnect,
    ).toHaveBeenCalledOnce()
  })
})

describe('consumer theme integration', () => {
  it('exports complete scoped CSS values on the server and follows the active theme', async () => {
    const brand = defineTheme({ name: 'brand', typography: { title: { fontFamily: 'Georgia' } } })
    expect(themeVariables(brand)).toMatchObject({
      '--m-type-title-font-family': 'Georgia',
      '--m-space-lg': '24px',
      '--m-radius-md': '16px',
    })
    const Surface = {
      setup() {
        const tokens = useMavisTokens()
        return () => h('div', { style: tokens.value })
      },
    }
    const html = await renderToString(
      createSSRApp({ render: () => h(MThemeProvider, { theme: brand }, () => h(Surface)) }),
    )
    expect(html).toContain('--m-color-primary:#B83670')
    const context = createThemeContext(mavis),
      root = node('root')
    const app = renderer.createApp(Surface).provide(themeKey, context)
    app.mount(root)
    context.setTheme(midnight)
    await nextTick()
    expect(find(root, 'div').props.style).toMatchObject({
      '--m-color-primary': midnight.colors.primary,
    })
    app.unmount()
  })
  it('derives entrance and press recipes from the same immutable theme without changing defaults', () => {
    const theme = defineTheme({
      name: 'calm',
      motion: { enterDuration: 320, enterOffset: 12, ease: 'easeInOut', releaseDuration: 600 },
    })
    expect(motionRecipe(theme, 'enter')).toMatchObject({
      keyframes: { y: [12, 0] },
      transition: { duration: 320, ease: 'easeInOut' },
    })
    expect(pressMotion(theme.motion).released[1].duration).toBe(600)
    expect(pressMotion(mavis.motion).released[1].duration).toBe(450)
    for (const motion of [{ enterDuration: -1 }, { releaseBounce: 2 }, { ease: 'unknown' }])
      expect(() => defineTheme({ name: 'invalid', motion } as never)).toThrow()
  })
})
