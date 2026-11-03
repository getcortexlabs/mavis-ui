import { describe, expect, it } from 'vitest'
import { createSSRApp, h, defineComponent } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { gridColumns } from '../packages/core/src/grid.js'
import { midnight } from '../packages/core/src/index.js'
import { MGrid, MImage, MText, MIcon, MButton, createMavis } from '../packages/web/src/index.js'
import { createMavisServices } from '../packages/web/src/services.js'

describe('consumer adoption', () => {
  it('resolves adaptive grid columns including gaps, caps, narrow containers and SSR defaults', () => {
    expect(gridColumns(undefined, 180, 16)).toBe(1)
    expect(gridColumns(4, 180, 16)).toBe(4)
    expect(gridColumns(undefined, 180, 16, 571)).toBe(2)
    expect(gridColumns(undefined, 180, 16, 572)).toBe(3)
    expect(gridColumns(3, 180, 16, 1200)).toBe(3)
    expect(gridColumns(4, 180, 16, 100)).toBe(1)
    expect(gridColumns(4, undefined, 16, 100)).toBe(4)
    for (const count of [0, -1, 1.5, Infinity]) expect(() => gridColumns(count, 180, 16)).toThrow()
    for (const min of [0, -1, NaN]) expect(() => gridColumns(3, min, 16)).toThrow()
  })
  it('renders deterministic grid columns and token gaps on the server', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(MGrid, { columns: 3, minColumnWidth: 180, gap: 'md' }, () =>
            h(MText, {}, () => 'Cell'),
          ),
      }),
    )
    expect(html).toContain('grid-template-columns:repeat(3, minmax(0, 1fr))')
    expect(html).toContain('gap:16px')
  })
  it('puts request hints and responsive candidates on the image, preserving wrapper attributes', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(MImage, {
            src: '/small.png',
            srcset: '/small.png 320w, /large.png 960w',
            sizes: '(min-width: 800px) 50vw, 100vw',
            loading: 'lazy',
            decoding: 'sync',
            fetchpriority: 'low',
            alt: 'Sample',
            'data-wrapper': 'kept',
          }),
      }),
    )
    const wrapper = html.slice(0, html.indexOf('>'))
    expect(wrapper).toContain('data-wrapper="kept"')
    expect(wrapper).not.toMatch(/srcset|sizes=|loading=|decoding=|fetchpriority=/)
    expect(html).toMatch(/<img[^>]*srcset="\/small.png 320w, \/large.png 960w"/)
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('decoding="sync"')
    expect(html).toContain('fetchpriority="low"')
  })
  it('installs services or a chosen component set without registering the whole catalog', () => {
    const bare = createSSRApp({ render: () => null }).use(createMavisServices())
    expect(Object.keys(bare._context.components)).toEqual([])
    const optional = createSSRApp({ render: () => null }).use(createMavis({ components: false }))
    expect(Object.keys(optional._context.components)).toEqual([])
    const selected = createSSRApp({ render: () => null }).use(
      createMavis({ components: { MText } }),
    )
    expect(Object.keys(selected._context.components)).toEqual(['MText'])
    const complete = createSSRApp({ render: () => null }).use(createMavis())
    expect(complete.component('MSheet')).toBeDefined()
    expect(complete.component('MGrid')).toBeDefined()
  })
  it('keeps custom SVG icons and themes isolated between applications, including button adornments', async () => {
    const Search = defineComponent({
      render: () =>
        h('svg', { 'data-selected-icon': 'search', viewBox: '0 0 24 24' }, [
          h('path', { d: 'M2 2L22 22' }),
        ]),
    })
    const render = () =>
      h('div', [
        h(MIcon, { name: 'search', label: 'Search' }),
        h(MButton, { icon: 'search', text: 'Find' }),
        h(MIcon, { name: 'house' }),
      ])
    const selected = createSSRApp({ render }).use(
      createMavisServices({ theme: midnight, icons: { search: Search }, iconFallback: 'none' }),
    )
    const font = createSSRApp({ render }).use(createMavisServices())
    const [custom, fallback] = await Promise.all([renderToString(selected), renderToString(font)])
    expect(custom.match(/data-selected-icon="search"/g)).toHaveLength(2)
    expect(custom).not.toContain('font-family:lucide')
    expect(custom).toContain('aria-label="Search"')
    expect(custom).toContain(midnight.colors.text)
    expect(fallback).not.toContain('data-selected-icon')
    expect(fallback).toContain('font-family:lucide')
  })
})
