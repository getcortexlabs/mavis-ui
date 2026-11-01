import {
  MListItem,
  MSeparator,
  MAvatar,
  MBadge,
  MSkeleton,
  MTabs,
  MDialog,
  MToast,
  useToast,
} from '../packages/web/src/index.js'
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
  MCheckbox,
  MRadioGroup,
  MSelect,
  midnight,
  mavis,
  MIcon,
  iconGlyph,
  MInput,
  MSheet,
} from '../packages/web/src/index.js'

describe('Web rendering without browser globals', () => {
  it('renders ListItem title, slots and one named action in SSR', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            MListItem,
            { title: 'Marina <Costa>', description: 'Design', interactive: true },
            {
              leading: () => h('span', 'Avatar'),
              trailing: () => h(MBadge, { text: 'Available' }),
            },
          ),
      }),
    )
    expect(html).toContain('role="button"')
    expect(html).toContain('aria-label="Marina &lt;Costa&gt;. Design"')
    expect(html).toContain('>Avatar</span>')
    expect(html).toContain('Available')
    expect(html).toContain('tabindex="0"')
  })
  it('renders a decorative empty separator without an interactive or semantic separator role', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            MSeparator,
            { orientation: 'vertical', length: 32, spacing: 'sm' },
            { default: () => h('button', 'Must not render') },
          ),
      }),
    )
    expect(html).toContain('width:1px')
    expect(html).toContain('height:32px')
    expect(html).toContain('margin-left:8px')
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('Must not render')
    expect(html).not.toContain('role=')
  })
  it('renders an avatar fallback before hydration with one accessible identity', async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(MAvatar, { src: '/photo.png', name: 'Marina Costa' }) }),
    )
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="Marina Costa"')
    expect(html).toContain('>MC</span>')
    expect(html).toContain('visibility:hidden')
    expect(html).toMatch(/<img[^>]+ alt(?:="")? aria-hidden="true"/)
    expect(html).not.toContain('tabindex')
  })
  it('escapes Badge text and preserves a numeric zero in SSR', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => h('div', [h(MBadge, { text: '<New>' }), h(MBadge, { text: 0 })]),
      }),
    )
    expect(html).toContain('&lt;New&gt;')
    expect(html).toContain('>0</span>')
    expect(html).not.toContain('aria-live')
  })
  it('renders Skeleton geometry without exposing a focus target or slot content', async () => {
    const app = createSSRApp({
      render: () =>
        h(
          MSkeleton,
          { width: 48, height: 48, radius: 'full', animated: false, tabindex: 0 },
          { default: () => h('button', 'Hidden real content') },
        ),
    })
    const html = await renderToString(app)
    expect(html).toContain('width:48px')
    expect(html).toContain('height:48px')
    expect(html).toContain('border-radius:999px')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('inert')
    expect(html).toContain('data-animated="false"')
    expect(html).not.toContain('tabindex=')
    expect(html).not.toContain('Hidden real content')
  })
  it('renders Select labels, selected text and error semantics without an open popup', async () => {
    const app = createSSRApp({
      render: () =>
        h(MSelect, {
          label: 'Interest',
          modelValue: 0,
          error: 'Check this choice',
          options: [{ value: 0, label: 'Zero <value>' }],
        }),
    })
    app.use(createMavis())
    const html = await renderToString(app)
    expect(html).toContain('Zero &lt;value&gt;')
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-invalid="true"')
    expect(html).toContain('Check this choice')
    expect(html).not.toContain('role="option"')
    expect(html).not.toContain('modelValue=')
  })

  it('renders distinct labelled Radio groups with typed values and initial selection in SSR', async () => {
    const app = createSSRApp({
      render: () =>
        h(MColumn, null, {
          default: () =>
            [0, 1].map(() =>
              h(MRadioGroup, {
                label: 'Pace <now>',
                modelValue: 1,
                options: [
                  { value: 1, label: 'Number' },
                  { value: '1', label: 'String', disabled: true },
                ],
              }),
            ),
        }),
    })
    app.use(createMavis())
    const html = await renderToString(app)
    expect(html.match(/role="radiogroup"/g)).toHaveLength(2)
    expect(html.match(/aria-checked="true"/g)).toHaveLength(2)
    expect(html).toContain('Pace &lt;now&gt;')
    const names = [...html.matchAll(/name="([^"]+)"/g)].map((match) => match[1])
    expect(names[0]).toBe(names[1])
    expect(names[2]).toBe(names[3])
    expect(names[0]).not.toBe(names[2])
    expect(html).not.toContain('modelValue=')
  })

  it('renders Checkbox labels, mixed semantics and help without browser globals', async () => {
    const app = createSSRApp({
      render: () =>
        h(MCheckbox, {
          label: 'All <topics>',
          helperText: 'Two selected',
          indeterminate: true,
          disabled: true,
        }),
    })
    app.use(createMavis())
    const html = await renderToString(app)
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('aria-checked="mixed"')
    expect(html).toContain(' disabled')
    expect(html).toContain('All &lt;topics&gt;')
    expect(html).toContain('aria-describedby=')
    expect(html).not.toContain('modelValue=')
  })

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
    expect(html).toContain('padding-left:calc(var(--m-input-padding-x, 16px) + 30px)')
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

describe('Toast SSR', () => {
  it('keeps host output client-only without touching browser globals', async () => {
    const app = createSSRApp({
      setup() {
        const toast = useToast()
        toast.show({ message: '<pending notice>' })
        return () => h(MToast, { controller: toast })
      },
    })
    expect(await renderToString(app)).not.toContain('pending notice')
  })
})

describe('Dialog SSR', () => {
  it('renders escaped content without opening a browser modal on the server', async () => {
    const app = createSSRApp({
      render: () =>
        h(MDialog, { open: true, title: '<Decision>', description: '<script>no</script>' }),
    })
    app.use(createMavis())
    const html = await renderToString(app)
    expect(html).toContain('&lt;Decision&gt;')
    expect(html).toContain('&lt;script&gt;no&lt;/script&gt;')
    expect(html).toContain('aria-labelledby=')
    expect(html).not.toContain(' open')
  })
})

describe('Tabs SSR', () => {
  it('renders named relationships and only the active scoped slot without browser globals', async () => {
    const app = createSSRApp({
      render: () =>
        h(
          MTabs,
          {
            tabs: [
              { value: 0, label: '<Zero>' },
              { value: 'other', label: 'Other' },
            ],
            modelValue: 0,
            label: 'Content',
          },
          {
            default: ({ value }: { value: string | number }) =>
              h('p', `Active ${typeof value}: ${value}`),
          },
        ),
    })
    app.use(createMavis())
    const html = await renderToString(app)
    expect(html).toContain('role="tablist"')
    expect(html).toContain('role="tabpanel"')
    expect(html).toContain('&lt;Zero&gt;')
    expect(html).toContain('Active number: 0')
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1)
    expect(html).not.toContain('Active string')
  })
})
