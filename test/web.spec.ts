import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  createMavis,
  MButton,
  MCard,
  MColumn,
  MText,
  MSlider,
  MSwitch,
  midnight,
  mavis,
  MIcon,
  iconGlyph,
  MInput,
  MSheet,
} from '../packages/web/src/index.js'

describe('Web rendering without browser globals', () => {
  it('renders a labeled boolean switch with help and disabled state in SSR', async () => {
    const app = createSSRApp({
      render: () =>
        h(MSwitch, {
          label: 'Updates <daily>',
          helperText: 'Your choice',
          modelValue: true,
          disabled: true,
        }),
    })
    app.use(createMavis())
    const html = await renderToString(app)
    expect(html).toContain('role="switch"')
    expect(html).toContain('aria-checked="true"')
    expect(html).toContain(' disabled')
    expect(html).toContain('Updates &lt;daily&gt;')
    expect(html).toContain('aria-describedby=')
    expect(html).not.toContain('modelValue=')
  })
  it('makes an accessibility-hidden container and its controls inert', async () => {
    const app = createSSRApp({
      render: () =>
        h(
          MColumn,
          { accessibilityHidden: true },
          {
            default: () => h(MButton, { text: 'Decorative control' }),
          },
        ),
    })
    const html = await renderToString(app)
    expect(html).toContain('aria-hidden="true" inert')
    expect(html).toContain('Decorative control')
  })
  it('exposes a disabled interactive card as one action without leaking its control props', async () => {
    const app = createSSRApp({
      render: () =>
        h(
          MCard,
          { interactive: true, disabled: true, accessibilityLabel: 'Open collection' },
          { default: () => h(MText, { text: 'Collection' }) },
        ),
    })
    app.use(createMavis())
    const html = await renderToString(app)
    expect(html).toContain('role="button"')
    expect(html).toContain('tabindex="-1"')
    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('aria-label="Open collection"')
    expect(html).not.toContain(' interactive=')
  })
  it('renders semantic HTML with escaped text, an accessible label and disabled state', async () => {
    const app = createSSRApp({
      render: () =>
        h(
          MColumn,
          { gap: 'md' },
          {
            default: () => [
              h(MText, { as: 'h1', text: 'Save <draft>' }),
              h(
                MButton,
                { disabled: true, accessibilityLabel: 'Save draft' },
                { default: () => 'Save' },
              ),
            ],
          },
        ),
    })
    app.use(createMavis())
    const html = await renderToString(app)
    expect(html).toContain('<h1')
    expect(html).toContain('Save &lt;draft&gt;')
    expect(html).toContain('aria-label="Save draft"')
    expect(html).toContain('type="button" disabled')
    expect(html).not.toMatch(/accessibilityLabel|GridLayout|FlexboxLayout/)
  })

  it('isolates theme state between server-rendered applications', async () => {
    const render = (theme: typeof mavis) => {
      const app = createSSRApp({ render: () => h(MButton, { text: 'Continue' }) })
      app.use(createMavis({ theme }))
      return renderToString(app)
    }
    const [light, dark] = await Promise.all([render(mavis), render(midnight)])
    expect(light).toContain(mavis.colors.primary)
    expect(dark).toContain(midnight.colors.primary)
    expect(light).not.toContain(midnight.colors.primary)
  })

  it('renders button and input icons on the server from the bundled font', async () => {
    const app = createSSRApp({
      render: () => [
        h(MButton, { icon: 'plus', text: 'Add' }),
        h(MInput, { label: 'Email', modelValue: '', icon: 'mail' }),
      ],
    })
    app.use(createMavis())
    const html = await renderToString(app)
    expect(html).toContain(iconGlyph('plus'))
    expect(html).toContain(iconGlyph('mail'))
    expect(html).toContain('>Add</span>')
    expect(html).toContain('padding-left:46px')
  })

  it('renders icons as hidden glyphs unless they carry a label', async () => {
    const app = createSSRApp({
      render: () => [
        h(MIcon, { name: 'search' }),
        h(MIcon, { name: 'circle-check', label: 'Done' }),
      ],
    })
    app.use(createMavis())
    const html = await renderToString(app)
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('role="img" aria-label="Done"')
    expect(html).toContain(iconGlyph('circle-check'))
    expect(html).toContain('font-family:lucide')
  })

  it('renders the configured theme on the server when the appearance follows the device', async () => {
    const app = createSSRApp({ render: () => h(MButton, { text: 'Continue' }) })
    app.use(createMavis({ theme: mavis, darkTheme: midnight }))
    const html = await renderToString(app)
    expect(html).toContain(mavis.colors.primary)
    expect(html).not.toContain(midnight.colors.primary)
  })

  it('renders a sheet as a labelled dialog that presents its content on the client', async () => {
    const render = (open: boolean) =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              MSheet,
              { open, title: 'Filters' },
              { default: () => h(MText, { text: 'Sheet body' }) },
            ),
        }),
      )
    const closed = await render(false)
    expect(closed).toContain('<dialog')
    expect(closed).toMatch(/aria-labelledby="m-sheet-[^"]+"/)
    expect(closed).not.toContain(' open')
    expect(closed).not.toContain('Sheet body')
    expect(await render(true)).not.toContain('Sheet body')
  })
  it('exposes the semantic slider range, including a final partial step', async () => {
    const app = createSSRApp({
      render: () => h(MSlider, { min: 0, max: 1, step: 0.3, modelValue: 1, label: 'Level' }),
    })
    const html = await renderToString(app)
    expect(html).toContain('aria-valuemin="0"')
    expect(html).toContain('aria-valuemax="1"')
    expect(html).toContain('aria-valuenow="1"')
    expect(html).toContain('aria-label="Level"')
  })
})
