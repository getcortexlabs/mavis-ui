import { describe, it, expect } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { normalizePin, pinLength, uniqueActions } from '../packages/core/src/screen-components.js'
import {
  createMavis,
  MAnimatedText,
  MComposer,
  MPinInput,
  MSpeedDial,
  MCollapsibleHeader,
  MRefreshControl,
} from '../packages/web/src/index.js'

describe('screen component contracts', () => {
  it('preserves leading zeros and normalizes pasted separators/full-width digits', () => {
    expect(normalizePin('０１２ ３-４５', 6)).toBe('012345')
    expect(normalizePin('12xx3456789', 6)).toBe('123456')
    expect(normalizePin('', 6)).toBe('')
  })
  it('bounds cell count and rejects indistinguishable action identities', () => {
    for (const length of [0, 1, 13, NaN, 3.5]) expect(() => pinLength(length)).toThrow()
    expect(() =>
      uniqueActions([
        { value: 'a', label: 'A' },
        { value: 'a', label: 'Again' },
      ]),
    ).toThrow(/unique/)
    expect(() =>
      uniqueActions([
        { value: 1, label: 'One' },
        { value: '1', label: 'String' },
      ]),
    ).not.toThrow()
  })
})

async function render(component: Parameters<typeof h>[0], props: Record<string, unknown>) {
  const app = createSSRApp({
    render: () => h(component as never, props, { default: () => h('p', 'Retained content') }),
  })
  app.use(createMavis())
  return renderToString(app)
}
describe('screen component SSR', () => {
  it('renders final text and a single named PIN editor without client globals', async () => {
    const text = await render(MAnimatedText, { text: 'Make room for wonder.' })
    expect(text).toContain('Make room for wonder.')
    const pin = await render(MPinInput, {
      label: 'Verification code',
      modelValue: '001234',
      name: 'code',
      required: true,
    })
    expect(pin.match(/<input /g)).toHaveLength(1)
    expect(pin).toContain('autocomplete="one-time-code"')
    expect(pin).toContain('value="001234"')
    expect(pin).toContain('pattern="[0-9]{6}"')
    expect(pin).toContain('aria-hidden="true"')
  })
  it('preserves message drafts and attachment names in server HTML', async () => {
    const html = await render(MComposer, {
      label: 'Message',
      modelValue: 'Do not lose this draft',
      attachments: [{ id: 'a', name: 'note.pdf' }],
    })
    expect(html).toContain('Do not lose this draft')
    expect(html).toContain('note.pdf')
    expect(html).toContain('Send message')
  })
  it('retains scroll content and headers; no gestures or refresh run during SSR', async () => {
    let requests = 0
    const header = await render(MCollapsibleHeader, { title: 'A wider view' })
    expect(header).toContain('A wider view')
    expect(header).toContain('Retained content')
    const refresh = await render(MRefreshControl, {
      label: 'Morning edition',
      refresh: () => {
        requests++
      },
    })
    expect(requests).toBe(0)
    expect(refresh).toContain('Retained content')
    expect(refresh).toContain('Morning edition')
  })
  it('renders a named action trigger and rejects invalid geometry before attaching motion', async () => {
    expect(
      await render(MSpeedDial, {
        label: 'Create',
        actions: [{ value: 'note', label: 'Write a note' }],
      }),
    ).toContain('Create')
    await expect(
      render(MCollapsibleHeader, { title: 'Invalid', expandedHeight: 10, collapsedHeight: 64 }),
    ).rejects.toThrow(/expandedHeight/)
    await expect(render(MAnimatedText, { text: 'Hello', duration: 0 })).rejects.toThrow(/duration/)
  })
})
