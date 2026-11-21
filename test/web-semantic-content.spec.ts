import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { MWebElement, MWebButton, MWebLink } from '../packages/web/src/experimental.js'
import { createMavis } from '../packages/web/src/index.js'

describe('experimental Web document composition', () => {
  it('keeps semantic structure, rich names, link attributes and external form ownership in SSR', async () => {
    const app = createSSRApp(() =>
      h(MWebElement, { as: 'nav', 'aria-label': 'Account' }, () => [
        h(MWebLink, { href: '/profile', target: '_blank' }, () => h('strong', 'Profile')),
        h(MWebButton, { form: 'profile', type: 'submit', name: 'intent', value: 'save' }, () =>
          h('em', 'Save'),
        ),
        h(MWebButton, { loading: true, accessibilityLabel: 'Saving' }),
      ]),
    ).use(createMavis())
    const html = await renderToString(app)
    expect(html).toContain('<nav aria-label="Account">')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('<strong>Profile</strong></a>')
    expect(html).toContain('type="submit"')
    expect(html).toContain('form="profile"')
    expect(html).toContain('<em>Save</em></button>')
    expect(html).toMatch(/<button[^>]*disabled[^>]*aria-busy="true"/)
  })

  it('restricts document hosts and rejects executable destinations', async () => {
    const invalidTag = 'script' as never
    await expect(
      renderToString(createSSRApp(() => h(MWebElement, { as: invalidTag }))),
    ).rejects.toThrow('Unsupported')
    await expect(
      renderToString(
        createSSRApp(() => h(MWebLink, { href: 'javascript:invalid' }, () => 'Test')).use(
          createMavis(),
        ),
      ),
    ).rejects.toThrow('destinations')
  })
})
