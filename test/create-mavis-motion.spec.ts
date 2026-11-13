import { describe, expect, it } from 'vitest'
import { revealProps } from '../packages/core/src/vue/props'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { components } from '../packages/create-mavis/templates/macos/scripts/portable/components/index.mjs'
const fixture = async (name: string, root: string) =>
  compileProject(await readShared(new URL(`./portable/${name}`, import.meta.url).pathname), {
    root,
  })
const compile = (files: Record<string, string>) =>
  compileProject(new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text])), {
    root: 'Home',
  })
describe('shared explicit reveal', () => {
  it('reads the same real component and independent column props in TSX and Vue', async () => {
    const tsx = await fixture('reveal', 'Details')
    const vue = await fixture('revealVue', 'Details')
    expect(vue.swift.get('Details.swift').split('\n').slice(1)).toEqual(
      tsx.swift.get('Details.swift').split('\n').slice(1),
    )
    const view = tsx.swift.get('Details.swift')
    expect(view).toContain('MavisReveal(show: self.show)')
    expect(view).toContain('MavisColumn(spacing: 8)')
    expect(view).toContain('.padding(16)')
    expect(tsx.vue.get('Details.vue')).toContain('<MReveal :show="state.show" gap="sm"')
    for (const name of Object.keys(revealProps))
      expect(components.MReveal.props).toHaveProperty(name)
  })
  it('accepts reveal outside a column, with false as the default show value', async () => {
    const out = await compile({
      'Home.vue': '<template><MRow><MReveal><MText>Hidden</MText></MReveal></MRow></template>',
    })
    expect(out.swift.get('Home.swift')).toContain('MavisReveal(show: false)')
  })
  it('uses Jolt for height and opacity, excludes absent space and guards interrupted completions', async () => {
    const out = await fixture('reveal', 'Details')
    const runtime = out.swift.get('MavisControls.swift')
    expect(runtime).toContain('let progress: JoltMotionValue')
    expect(runtime).toContain('self.revision == token')
    expect(runtime).toContain('.layoutValue(key: MavisAbsentKey.self, value: !model.present)')
    expect(runtime).toContain('.allowsHitTesting(show)')
    expect(runtime).toContain('if !moving {')
    expect(runtime).not.toContain('Timer.scheduledTimer')
  })
})
