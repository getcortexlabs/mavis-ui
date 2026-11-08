import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
// @ts-expect-error The creator ships native ESM.
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'
// @ts-expect-error The creator ships native ESM.
import { projectSummary, nextSteps, sharedEntry } from '../packages/create-mavis/src/ui.mjs'
// @ts-expect-error The compiler adapter ships in the experimental template.
import { validateSource } from '../packages/create-mavis/templates/macos/scripts/portable.mjs'

const source = await readFile(
  new URL('../packages/create-mavis/templates/macos/shared/Welcome.lite.tsx', import.meta.url),
  'utf8',
)
describe('experimental Mitosis macOS starter', () => {
  it.each(['npm', 'pnpm', 'yarn'])(
    'plans a real compiler and two hosts with %s instructions',
    async (packageManager) => {
      const { preset, files } = await projectFiles({
        name: 'first-light',
        target: 'macos',
        packageManager,
      })
      const pkg = JSON.parse(files.get('package.json'))
      expect(preset.authoring).toBe('mitosis')
      expect(pkg.devDependencies['@builder.io/mitosis']).toBe('0.14.2')
      expect(files.get('shared/Welcome.lite.tsx')).toBe(source)
      expect(files.get('scripts/portable.mjs')).toContain('componentToSwift')
      expect(files.get('native/Sources/MavisDesktop/App.swift')).toContain(
        'WindowGroup("first-light")',
      )
      expect(files.has('web/Welcome.generated.vue')).toBe(false)
      expect(files.has('native/Sources/MavisDesktop/Welcome.generated.swift')).toBe(false)
      expect(files.get('README.md')).toContain(`${packageManager} run macos`)
      expect(files.get('README.md')).toContain(`${packageManager} run generate`)
      expect(nextSteps(preset)).toContain(`${packageManager} run dev:web`)
      expect(sharedEntry(preset)).toBe('shared/Welcome.lite.tsx')
      expect(projectSummary(preset)).toContain('EXPERIMENTAL')
      expect([...files.values()].join('\n')).not.toMatch(/__MAVIS_[A-Z_]+__/)
    },
  )
  it('keeps Mitosis out of ordinary presets and rejects unsupported combinations', async () => {
    for (const target of ['web', 'mobile', 'both']) {
      const { files } = await projectFiles({ name: 'regular', target })
      expect(files.get('package.json')).not.toContain('@builder.io/mitosis')
    }
    for (const options of [
      { authoring: 'vue' },
      { web: 'nuxt' },
      { rendering: 'ssr' },
      { example: 'directory' },
    ]) {
      await expect(
        projectFiles({ name: 'unsupported', target: 'macos', ...options }),
      ).rejects.toThrow('Experimental macOS')
    }
  })
  it('accepts the actual shared source and rejects code Mitosis would silently drop', () => {
    expect(validateSource(source).get('sparks')).toEqual({ kind: 'number', value: 0 })
    for (const [from, to] of [
      ['<MColumn gap="xl">', '<MColumn gap="xl" class="hidden">'],
      ['<MColumn gap="xl">', '<MColumn gap={window.innerWidth}>'],
      ['state.sparks + 1', 'fetch("/api")'],
      ['state.sparks + 1', '"wrong type"'],
      ['state.sparks + 1', '(console.log("lost"), 1)'],
      ['state.sparks = state.sparks + 1', '{ state.sparks = 1; console.log("lost") }'],
      ['const state =', 'console.log("lost"); const state ='],
      ['sparks: 0', 'body: 0'],
      ['sparks: 0', 'sparks: []'],
      ['sparks: 0', 'sparks: 0, sparks: 1'],
      ['Welcome()', 'Welcome(props)'],
      ['<MText variant="display">One idea.</MText>', '<div>Not portable</div>'],
      ['{state.sparks}</MText>', '{state.sparks.toFixed(2)}</MText>'],
    ] as const)
      expect(() => validateSource(source.replace(from, to)), to).toThrow(
        /Welcome.lite.tsx:\d+:\d+:/,
      )
  })
})
