import { describe, expect, it } from 'vitest'
// @ts-expect-error The compiler is JavaScript.
import { compileProject } from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const compile = (script: string, view: string) =>
  compileProject(
    new Map([
      [
        'shared/Home.vue',
        `<script setup lang="ts">import {ref,computed} from 'vue'\n${script}</script><template>${view}</template>`,
      ],
    ]),
    { root: 'Home' },
  )

describe('bounded string and number union', () => {
  it('keeps union state, comparisons, numeric conversion and list interpolation typed', async () => {
    const result = await compile(
      `const value=ref<string | number>(1)
const items=ref<(string | number)[]>([1,'1',0])
const caption=computed(()=>value.value === 1 ? 'number' : value.value === '1' ? 'text' : String(value.value))
const numeric=computed(()=>Number(value.value))`,
      '<MColumn><MText>{{caption}}</MText><MText>{{numeric}}</MText><MText>{{items.join(", ")}}</MText><MButton text="Text" @click="value = \'1\'"/></MColumn>',
    )
    const swift = result.swift.get('Home.swift')!
    expect(swift).toContain('@State private var value: MavisChoiceValue')
    expect(swift).toContain('self.value == MavisChoiceValue.number(1.0)')
    expect(swift).toContain('self.value == MavisChoiceValue.text("1")')
    expect(swift).toContain('mavisNumber(self.value)')
    expect(swift).toContain('self.items.map { $0.stringValue }.joined(separator: ", ")')
    expect(swift).toContain('self.value = MavisChoiceValue.text("1")')
  })

  it('coerces primitive optional/list values without changing their JavaScript output', async () => {
    const result = await compile(
      `const name=ref<string | null>(null)
const names=ref<string[]>(['one'])
const value=ref<string | number | null>(null)
const values=ref<(string | number)[]>([])
function copy(){value.value=name.value;values.value=names.value}`,
      '<MColumn><MButton text="Copy" @click="copy"/><MText>{{value ?? "none"}}</MText></MColumn>',
    )
    expect(result.swift.get('Home.swift')).toContain(
      'self.value = self.name.map { MavisChoiceValue.text($0) }',
    )
    expect(result.swift.get('Home.swift')).toContain(
      'self.values = self.names.map { MavisChoiceValue.text($0) }',
    )
  })
})
