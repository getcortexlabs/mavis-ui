import { describe, expect, it } from 'vitest'
import { createSSRApp, h, Fragment, createTextVNode, createCommentVNode } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { inlineContent, MSpan } from '../packages/core/src/vue/index.js'
import { MText } from '../packages/web/src/components/MText.js'

describe('portable inline text', () => {
  it('keeps internal whitespace, nested emphasis and text escapes in one heading', async () => {
    const nodes = [
      createTextVNode('A '),
      h(MSpan, { emphasis: 'strong' }, () => [
        createTextVNode('clear '),
        h(MSpan, { emphasis: 'em', tone: 'primary' }, () => '<idea>'),
      ]),
      createTextVNode(' stays.'),
    ]
    const runs = inlineContent(nodes)
    expect(runs.map((run) => run.text).join('')).toBe('A clear <idea> stays.')
    expect(runs[2]).toMatchObject({ strong: true, italic: true, weight: 'bold', tone: 'primary' })
    const html = await renderToString(
      createSSRApp({ render: () => h(MText, { as: 'h1' }, () => nodes) }),
    )
    expect(html).toContain('<h1')
    expect(html).toContain('<strong')
    expect(html).toContain('<em>&lt;idea&gt;</em>')
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(html).not.toContain('<idea>')
  })
  it('accepts keyed fragments and ignores comments without joining words', () => {
    const runs = inlineContent([
      h(Fragment, {}, [
        h(MSpan, { key: 'a', text: 'one', weight: '500' }),
        createCommentVNode('hidden'),
        createTextVNode(' two'),
      ]),
    ])
    expect(runs.map((run) => run.text).join('')).toBe('one two')
  })
  it('rejects layout trees, event handlers, unknown weights and standalone spans', async () => {
    expect(() => inlineContent([h('strong', {}, 'No HTML')])).toThrow(/MSpan/)
    expect(() => inlineContent([h(MSpan, { onClick: () => {}, text: 'Click' } as never)])).toThrow(
      /onClick/,
    )
    expect(() => inlineContent([h(MSpan, { weight: 'heavy', text: 'bad' } as never)])).toThrow(
      /weight/,
    )
    await expect(
      renderToString(createSSRApp({ render: () => h(MSpan, { text: 'orphan' }) })),
    ).rejects.toThrow(/inside MText/)
  })
})
