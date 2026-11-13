import { describe, expect, it } from 'vitest'
// @ts-expect-error The experimental compiler ships JavaScript.
import { compileProject } from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const compile = (source: string) =>
  compileProject(new Map([['shared/Home.vue', source]]), { root: 'Home' })

describe('Vue script block boundaries', () => {
  it.each([
    [
      "import { midnight } from '@getcortexlabs/mavis-core'",
      '<MThemeProvider :theme="midnight"><MText>Night</MText></MThemeProvider>',
    ],
    ["import { ref } from 'vue';const count = ref(1)", '<MText>{{ count }}</MText>'],
    [
      "import { ref } from 'vue';const count = ref(1) // retained comment",
      '<MText>{{ count }}</MText>',
    ],
    [
      "const props = withDefaults(defineProps<{ title?: string }>(), {title:'Title'})",
      '<MText>{{ title }}</MText>',
    ],
  ])('accepts a setup block without a final newline: %s', async (script, template) => {
    const result = await compile(
      `<script setup lang="ts">${script}</script><template>${template}</template>`,
    )
    expect(result.direct).toEqual(['shared/Home.vue'])
    expect(result.swift.has('Home.swift')).toBe(true)
  })
  it('still attributes a template type error to the original single-line Vue file', async () => {
    const source = `<script setup lang="ts">import { ref } from 'vue'; const count = ref(1)</script><template><MButton text="Bad" @click="count = 'wrong'"/></template>`
    try {
      await compile(source)
      throw new Error('Expected a type error')
    } catch (error) {
      const diagnostics = (
        error as { diagnostics: { file: string; line: number; column: number; message: string }[] }
      ).diagnostics
      expect(diagnostics).toBeDefined()
      expect(diagnostics[0]).toMatchObject({ file: 'shared/Home.vue', line: 1 })
      expect(diagnostics[0]!.column).toBeGreaterThan(source.indexOf('<template>'))
      expect(diagnostics[0]!.message).toMatch(/assign|number/)
    }
  })
})
