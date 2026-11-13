import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { choiceKey, validateChoices } from '../packages/core/src/choice'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler is JavaScript.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const portable = new URL('./portable/', import.meta.url).pathname
const fixtures = [
  ['typedSelect', 'TypedSelect'],
  ['typedRadios', 'TypedRadios'],
  ['typedMulti', 'TypedChoices'],
  ['typedTransfer', 'TypedChoices'],
  ['typedCombobox', 'TypedCombo'],
] as const
const body = (files: Map<string, string>) =>
  [...files].map(([name, text]) => [name, text.split('\n').slice(1).join('\n')])

describe('published choice value identity', () => {
  it.each(fixtures)(
    'preserves the numeric and textual events of %s in both formats',
    async (name, root) => {
      const tsx = await compileProject(await readShared(join(portable, name)), { root })
      const vue = await compileProject(await readShared(join(portable, `${name}Vue`)), { root })
      expect(body(tsx.swift)).toEqual(body(vue.swift))
      const types = tsx.swift.get('MavisTypes.swift')!
      expect(types).toContain('MavisChoiceValue')
      for (const output of [tsx.vue, tsx.native]) {
        const source = output.get(`${root}.vue`)!
        expect(source).not.toContain('String(choice)')
        expect(source).not.toContain('choices.map(String)')
        expect(source).not.toContain('String(option.value)')
        expect(source).toContain('value: 1')
        expect(source).toContain("value: '1'")
      }
    },
  )

  it('keeps the public core types in value modules and preserves strict equality', async () => {
    const out = await compileProject(
      new Map([
        [
          'shared/options.ts',
          `import type { ChoiceOption, ChoiceValue } from '@getcortexlabs/mavis-core'
export const options: ChoiceOption[] = [{value:1,label:'Number'}, {value:'1',label:'Text'}]
export function name(value: ChoiceValue): string { return value === 1 ? 'number' : value === '1' ? 'text' : 'other' }`,
        ],
        [
          'shared/Home.vue',
          `<script setup lang="ts">
import {ref} from 'vue'
import type {ChoiceValue} from '#mavis'
import {options,name} from './options'
const chosen=ref<ChoiceValue | null>(null)
</script><template><MColumn><MSelect label="Choice" v-model="chosen" :options="options"/><MText>{{name(chosen ?? 0)}}</MText></MColumn></template>`,
        ],
      ]),
      { root: 'Home' },
    )
    expect(out.swift.get('OptionsModule.swift')).toContain('value == MavisChoiceValue.number(1.0)')
    expect(out.swift.get('OptionsModule.swift')).toContain('value == MavisChoiceValue.text("1")')
    const values = out.swift.get('MavisValues.swift')!
    expect(values).toContain('a.utf16.elementsEqual(b.utf16)')
    expect(values).toContain('default: return false')
    expect(values).toContain('hasher.combine(value == 0 ? 0 : value)')
    expect(() =>
      validateChoices(
        [
          { value: 1, label: 'Number' },
          { value: '1', label: 'Text' },
          { value: 0, label: 'Zero' },
        ],
        null,
      ),
    ).not.toThrow()
    expect(choiceKey(1)).not.toBe(choiceKey('1'))
    expect(() =>
      validateChoices(
        [
          { value: 0, label: 'Zero' },
          { value: -0, label: 'Minus zero' },
        ],
        null,
      ),
    ).toThrow('Duplicate')
  })

  it('rejects unsupported value unions and unsafe narrowing instead of stringifying them', async () => {
    const source = (script: string, view: string) =>
      new Map([
        [
          'shared/Home.vue',
          `<script setup lang="ts">import {ref} from 'vue'\n${script}</script><template>${view}</template>`,
        ],
      ])
    await expect(
      compileProject(
        source('const value=ref<string | boolean>(false)', '<MText>{{value}}</MText>'),
        { root: 'Home' },
      ),
    ).rejects.toThrow('Unsupported union')
    await expect(
      compileProject(
        source(
          "import type {ChoiceOption} from '#mavis'\nconst value=ref('')\nconst options: ChoiceOption[]=[{value:1,label:'Number'}]",
          '<MSelect label="Choice" v-model="value" :options="options"/>',
        ),
        { root: 'Home' },
      ),
    ).rejects.toThrow('not assignable')
  })
})
