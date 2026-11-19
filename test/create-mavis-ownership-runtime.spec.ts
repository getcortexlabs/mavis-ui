import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import { compileScript, parse } from '@vue/compiler-sfc'
import { proxyRefs } from 'vue'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships as native ESM.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

// Execute the real Vue setup logic for each JS output. Native UI is covered separately;
// these assertions concern identity, mutation and Vue reactivity, with no mocked refs.
describe('shared value ownership in JavaScript hosts', () => {
  it.each(
    ['ownership', 'ownershipVue'].flatMap((fixture) =>
      ['vue', 'native'].map((target) => [fixture, target]),
    ),
  )('%s on %s preserves independent copies', async (fixture, target) => {
    const root = new URL(`./portable/${fixture}/`, import.meta.url).pathname
    const files = await readShared(root)
    const output = await compileProject(files, { root: 'Ownership' })
    const folder = mkdtempSync(join(tmpdir(), 'mavis-ownership-'))
    try {
      const sources = new Map<string, string>(output[target])
      for (const [path, text] of files as Map<string, string>) {
        if (path.endsWith('.ts') || output.direct.includes(path))
          sources.set(output.direct.length ? path.slice('shared/'.length) : path, text)
      }
      for (const [path, text] of sources) {
        mkdirSync(dirname(join(folder, path)), { recursive: true })
        writeFileSync(join(folder, path), text)
      }
      const { descriptor } = parse(sources.get('Ownership.vue')!, { filename: 'Ownership.vue' })
      const script = compileScript(descriptor, { id: 'ownership' })
      const bundled = await build({
        stdin: { contents: script.content, loader: 'ts', resolveDir: folder },
        bundle: true,
        platform: 'node',
        format: 'cjs',
        write: false,
        external: ['vue'],
        alias: { '#shared-ui': join(folder, 'shared') },
      })
      const module = { exports: {} as { default: { setup: Function } } }
      new Function('module', 'exports', 'require', bundled.outputFiles[0]!.text)(
        module,
        module.exports,
        createRequire(import.meta.url),
      )
      const setup = module.exports.default.setup({}, { expose() {} })
      const state = setup.state ?? proxyRefs(setup)
      const scriptPath = join(
        root,
        fixture === 'ownershipVue' ? '../ownership/steps.json' : 'steps.json',
      )
      const { steps } = JSON.parse(readFileSync(scriptPath, 'utf8'))
      for (const step of steps) {
        if (step.click) state.change()
        if (step.expect)
          expect([
            `Names ${state.names.join(',')}`,
            `Records ${state.first.count}/${state.second.count}`,
            `Nested ${state.group.names.join(',')}/${state.previous.names.join(',')}`,
            `Module ${state.observed}`,
          ]).toEqual(step.expect)
      }
    } finally {
      rmSync(folder, { recursive: true, force: true })
    }
  })
})
