import { readFileSync, existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { componentNames, targetCapabilities } from '../packages/core/src/capabilities.js'
import { componentContracts, type Property } from '../packages/core/src/contracts.js'
import { inputEmits } from '../packages/core/src/vue/props.js'
import { MButton } from '../packages/web/src/components/MButton.js'
import { references } from '../examples/catalog/shared/reference.js'

const source = (file: string) => readFileSync(file, 'utf8')
const slug = (name: string) =>
  name.slice(1).replace(/[A-Z]/g, (letter, index) => `${index ? '-' : ''}${letter.toLowerCase()}`)
const docsSlug = (name: string) => (name === 'MRadioGroup' ? 'radio' : slug(name))
const normalize = (value: string) => value.replace(/^['"]|['"]$/g, '')

describe('published references and source contracts', () => {
  it('covers every registered component in the catalog and both reference languages', () => {
    const catalog = source('examples/catalog/shared/catalog.ts')
    const tags = [...catalog.matchAll(/tag: '(m-[a-z-]+)'/g)].map((match) => match[1])
    const catalogued = componentNames.filter(
      (name) => !['MSpan', 'MThemeProvider', 'MPlatform', 'MTourTarget'].includes(name),
    )
    expect(tags.sort()).toEqual(catalogued.map((name) => `m-${slug(name)}`).sort())
    for (const locale of ['', 'pt-BR/'])
      expect(source(`docs/${locale}components/tour.md`)).toContain('<MTourTarget')
    for (const name of catalogued)
      for (const locale of ['', 'pt-BR/']) {
        expect(existsSync(`docs/${locale}components/${docsSlug(name)}.md`), name).toBe(true)
      }
  })

  it('checks explicit foundation defaults in the catalog and bilingual reference tables', () => {
    for (const [name, contract] of Object.entries(componentContracts)) {
      const id = slug(name)
      const fields = contract.props as Record<string, Property>
      const reference = references[id]!
      for (const item of reference.properties) {
        const field = fields[item.name.replace(' / v-model', '')]
        if (
          field?.default !== undefined &&
          !Array.isArray(field.default) &&
          typeof field.default !== 'object'
        ) {
          expect(normalize(item.defaultValue), `${id}.${item.name} catalog`).toBe(
            String(field.default),
          )
        }
      }
      for (const locale of ['', 'pt-BR/']) {
        const page = source(`docs/${locale}components/${id}.md`)
        for (const row of page.matchAll(/^\| `([^`]+)` \| [^|]* \| `([^`]+)` \|/gm)) {
          const field = fields[row[1]!]
          if (field?.default !== undefined && typeof field.default !== 'object')
            expect(normalize(row[2]!), `${locale}${id}.${row[1]}`).toBe(String(field.default))
        }
        expect(source(`docs/${locale}guide/component-contract.md`)).toContain(
          `<ContractReference name="${name}"`,
        )
      }
    }
  })

  it('keeps semantic events aligned with Vue and catalog event names', () => {
    const input = Object.keys(componentContracts.MInput.events)
      .map((name) => (name === 'valueChange' ? 'update:modelValue' : name))
      .sort()
    const button = Object.keys(componentContracts.MButton.events)
      .map((name) => (name === 'activate' ? 'click' : name))
      .sort()
    expect(Object.keys(inputEmits).sort()).toEqual(input)
    expect(Object.keys(MButton.emits ?? {}).sort()).toEqual(button)
    for (const [id, expected] of [
      ['input', input],
      ['button', button],
    ] as const) {
      const actual = references[id]!.events!.flatMap((event) =>
        event.name.replace(/^@/, '').split(' / '),
      ).sort()
      expect(actual).toEqual(expected)
    }
  })

  it('derives the capability table and pins its evidence to the actual clean consumer', () => {
    const fixture = JSON.parse(source('test/consumers/nuxt/package.json'))
    const target = targetCapabilities.targets[0]
    expect(target.ssr.hostVersion).toBe(fixture.dependencies.nuxt)
    expect(target.ssr.vueVersion).toBe(fixture.dependencies.vue)
    expect(source('docs/.vitepress/theme/CapabilityTable.vue')).toContain('targetCapabilities')
    expect(source('docs/.vitepress/theme/ContractReference.vue')).toContain('describeContract')
    for (const locale of ['', 'pt-BR/']) {
      expect(source(`docs/${locale}guide/architecture.md`)).toContain('<CapabilityTable')
      expect(source(`docs/${locale}guide/nuxt.md`)).toContain(
        'test/consumers/nuxt/app/plugins/mavis.ts',
      )
    }
  })
})
