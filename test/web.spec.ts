import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  createMavis,
  MButton,
  MColumn,
  MText,
  MSlider,
  midnight,
  mavis,
} from '../packages/web/src/index.js'

describe('Web rendering without browser globals', () => {
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
