import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { componentContracts, describeContract } from '../packages/core/src/contracts.js'
import { componentProps } from '../packages/core/src/vue/props.js'
import { MButton, MInput, MRow, MColumn, MBox, MText } from '../packages/web/src/index.js'

describe('framework-neutral foundation', () => {
  it('retains resolved defaults and controlled Input/activation boundaries in the Vue consumer', async () => {
    const app = createSSRApp({
      render: () =>
        h(MColumn, {}, () => [
          h(MRow, {}, () => h(MBox, {}, () => h(MText, {}, () => 'Hello'))),
          h(MInput, { label: 'Name', modelValue: 'Ada', name: 'name' }),
          h(MButton, {}, () => 'Continue'),
        ]),
    })
    const html = await renderToString(app)
    expect(html).toContain('align-items:var(--m-layout-align, stretch)')
    expect(html).toContain('align-items:var(--m-layout-align, center)')
    expect(html).toContain('value="Ada"')
    expect(html).toContain('name="name"')
    expect(html).toContain('type="button"')
    expect(componentContracts.MInput.binding).toEqual({
      prop: 'modelValue',
      event: 'valueChange',
      owner: 'parent',
    })
    expect(componentContracts.MButton.events.activate).toBe('none')
  })

  it('serializes the same property source consumed by Vue, with explicit unset/runtime-only values', () => {
    for (const name of Object.keys(componentContracts) as (keyof typeof componentContracts)[]) {
      const description = JSON.parse(JSON.stringify(describeContract(name)))
      const vue = componentProps[name] as Record<
        string,
        { default?: unknown; required?: boolean; type: unknown }
      >
      expect(Object.keys(description.props).sort()).toEqual(Object.keys(vue).sort())
      for (const [key, field] of Object.entries(description.props) as [
        string,
        Record<string, unknown>,
      ][]) {
        expect(field.required === true).toBe(vue[key]!.required === true)
        if ('default' in field) {
          expect(vue[key]!.default).toEqual(
            JSON.stringify(field.default) === '{"unset":true}' ? undefined : field.default,
          )
        } else expect('default' in vue[key]!).toBe(false)
      }
    }
    expect(describeContract('MButton').props.motionSurface?.runtimeOnly).toBe(true)
    expect(describeContract('MInput').props.label?.required).toBe(true)
  })
})
