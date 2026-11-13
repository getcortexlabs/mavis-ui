import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  componentNames,
  macosCapabilities,
  targetCapabilities,
} from '../packages/core/src/capabilities.js'
import { componentProps } from '../packages/core/src/vue/component-props.js'
import { spanProps } from '../packages/core/src/vue/props.js'
import { themeProviderProps } from '../packages/core/src/vue/theme-provider.js'
import { platformProps } from '../packages/core/src/vue/platform.js'
// @ts-expect-error Compiler sources are JavaScript during the package migration.
import { macosComponentCapabilities } from '../packages/create-mavis/templates/macos/scripts/portable/component-capabilities.mjs'
// @ts-expect-error Compiler sources are JavaScript during the package migration.
import { compileProject } from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
// @ts-expect-error Compiler sources are JavaScript during the package migration.
import { components } from '../packages/create-mavis/templates/macos/scripts/portable/components/index.mjs'
// @ts-expect-error Creator metadata is generated JavaScript.
import { macosCapabilities as creatorMac } from '../packages/create-mavis/src/macos-capabilities.generated.mjs'
import {
  describeCapabilities,
  formatCapabilities,
  // @ts-expect-error Creator sources are JavaScript.
} from '../packages/create-mavis/src/capabilities.mjs'
const props = {
  ...componentProps,
  MSpan: spanProps,
  MThemeProvider: themeProviderProps,
  MPlatform: platformProps,
}

describe('Mac component inventory', () => {
  it('keeps every public component, compiler registration and shipped inventory in sync', () => {
    expect(Object.keys(components).sort()).toEqual([...componentNames].sort())
    const generated = macosComponentCapabilities(componentNames, (name: keyof typeof props) =>
      Object.keys(props[name]),
    )
    expect(macosCapabilities).toEqual(generated)
    expect(creatorMac).toEqual(generated)
    expect(describeCapabilities().macos).toEqual(generated)
    const target = targetCapabilities.targets.find((target) => target.id === 'macos-swiftui')!
    expect(target.componentCapabilities).toEqual(generated.components)
    expect(target.rendering.serverHTML).toBe('unsupported')
    expect(target.validation).toBe('not-asserted')
    expect(target.components).toEqual(Object.keys(generated.components))
  })
  it('reports registration separately from support and runtime validation', () => {
    for (const entry of Object.values(macosCapabilities.components)) {
      expect(entry.registered).toBe(true)
      expect(entry.status).toBe('partial')
      expect(entry.issue).toBeGreaterThanOrEqual(344)
      expect(entry.issue).toBeLessThanOrEqual(354)
    }
    const missing = macosComponentCapabilities(['MNotRegistered']).components.MNotRegistered
    expect(missing).toMatchObject({
      registered: false,
      status: 'unsupported',
      issue: 338,
      props: [],
      events: [],
      slots: [],
    })
    expect(macosCapabilities.validation).toBe('not-asserted')
  })
  it('uses the Vue frontend names and records concrete rejected properties and limits', () => {
    expect(macosCapabilities.components.MCalendar.props).toContain('modelValue')
    expect(macosCapabilities.components.MCalendar.events).toContain('update:modelValue')
    expect(macosCapabilities.components.MCalendar.props).not.toContain('onChange')
    expect(macosCapabilities.components.MCalendar.tsxProps).toContain('onChange')
    expect(macosCapabilities.components.MStack.props).not.toContain('onKeyDown')
    for (const name of ['MButton', 'MCard', 'MText'] as const) {
      expect(macosCapabilities.components[name].props).toContain('motionSurface')
      expect(macosCapabilities.components[name].rejectedProps).not.toContain('motionSurface')
    }
    expect(macosCapabilities.components.MParticleField.limits[0].en).toContain(
      'Continuous emission is rejected',
    )
    expect(macosCapabilities.components.MAnimatedText.limits[0].pt).toContain('macOS 15')
    expect(macosCapabilities.components.MKanban.limits[0].en).toContain('Jolt #502')
  })
  it('keeps diagnostic-only readers out of the accepted props and confirms their rejection', async () => {
    for (const [name, property, expression] of [
      ['MBox', 'perspective', '400'],
      ['MScreen', 'motionRegion', 'undefined'],
      ['MScreen', 'motionScroll', 'undefined'],
    ] as const) {
      expect(macosCapabilities.components[name].props).not.toContain(property)
      expect(macosCapabilities.components[name].rejectedProps).toContain(property)
      const files = new Map([
        [
          'shared/Home.lite.tsx',
          `export default function Home(){return <${name} ${property}={${expression}}/>}`,
        ],
      ])
      await expect(compileProject(files, { root: 'Home' })).rejects.toThrow(
        `${property} needs the Mavis motion API`,
      )
    }
    expect(macosCapabilities.components.MVirtualList.props).not.toContain('animated')
    expect(macosCapabilities.components.MVirtualList.rejectedProps).toContain('animated')
    expect(macosCapabilities.components.MVirtualList.limits[0].en).toContain('listChanges')
    expect(macosCapabilities.components.MRefreshControl.ignoredProps).toEqual(['threshold'])
    expect(macosCapabilities.components.MText.props).toContain('text')
    expect(macosCapabilities.components.MSpan.rejectedProps).not.toContain('text')
  })
  it('reports the Vue flags and content spelling that lower to existing component contracts', async () => {
    for (const name of ['MCard', 'MListItem'] as const) {
      expect(macosCapabilities.components[name].props).toContain('interactive')
      expect(macosCapabilities.components[name].rejectedProps).not.toContain('interactive')
    }
    expect(macosCapabilities.components.MButton.slots).toContain('default')
    const files = new Map([
      [
        'shared/Home.vue',
        `<script setup lang="ts">const act = () => {}</script>
      <template><MColumn><MCard interactive @click="act" accessibilityLabel="Story"><MText>Story</MText></MCard><MListItem interactive @click="act" title="Open"/><MButton @click="act">Save</MButton></MColumn></template>`,
      ],
    ])
    const result = await compileProject(files, { root: 'Home' })
    expect(result.swift.get('Home.swift')).toContain('Text(verbatim: "Save")')
  })
  it('exposes every component in CLI output and in the shared EN/PT documentation widgets', () => {
    const text = formatCapabilities()
    for (const name of componentNames) expect(text).toContain(`${name}: partial`)
    expect(text).toContain('not runtime validation')
    const source = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
    expect(source('docs/.vitepress/theme/ComponentPreview.vue')).toContain('<MacCapability')
    expect(source('docs/.vitepress/theme/ContractReference.vue')).toContain('<MacCapability')
    expect(source('docs/.vitepress/theme/MacCapabilityMatrix.vue')).toContain(
      'macosCapabilities.components',
    )
    expect(source('docs/guide/macos-capabilities.md')).toContain('<MacCapabilityMatrix />')
    expect(source('docs/pt-BR/guide/macos-capabilities.md')).toContain(
      '<MacCapabilityMatrix locale="pt" />',
    )
  })
})
