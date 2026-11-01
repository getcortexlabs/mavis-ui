import { expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { checkChipLabels, checkEmptyStateTitle } from '../packages/core/src/index.js'
import { MChip, MEmptyState, MButton, createMavis } from '../packages/web/src/index.js'
it('requires visible titles and contextual removal names', () => {
  expect(() => checkChipLabels(' ', false)).toThrow(TypeError)
  expect(() => checkChipLabels('Vue', true)).toThrow(TypeError)
  expect(() => checkChipLabels('Vue', true, ' ')).toThrow(TypeError)
  expect(() => checkChipLabels('Vue', true, 'Remove Vue')).not.toThrow()
  expect(() => checkEmptyStateTitle('')).toThrow(TypeError)
})
it('renders static and interactive content on the server without implicit live regions', async () => {
  const app = createSSRApp({
    render: () =>
      h('div', [
        h(MChip, {
          label: 'Design',
          selectable: true,
          modelValue: true,
          removable: true,
          removeLabel: 'Remove Design',
        }),
        h(MChip, { label: 'Editorial' }),
        h(
          MEmptyState,
          { title: 'Nothing saved', titleAs: 'h3', compact: true },
          { actions: () => h(MButton, {}, { default: () => 'Explore' }) },
        ),
      ]),
  })
  app.use(createMavis())
  const html = await renderToString(app)
  expect(html).toContain('aria-pressed="true"')
  expect(html).toContain('aria-label="Remove Design"')
  expect(html.match(/<button/g)).toHaveLength(3)
  expect(html).toContain('<h3')
  expect(html).toContain('inert')
  expect(html).not.toMatch(/aria-live|role="(?:alert|status)"/)
})
