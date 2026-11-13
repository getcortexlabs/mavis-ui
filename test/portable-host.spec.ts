import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
// @ts-expect-error Conformance helpers are authored as ESM.
import { hostedFixtureFiles } from '../scripts/portable-host.mjs'
import {
  compileProject,
  readShared,
  // @ts-expect-error Experimental portable compiler.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const root = new URL('..', import.meta.url).pathname

describe('portable host preparation', () => {
  it('replaces the TSX input route table, while keeping authored Vue tables and value modules', async () => {
    for (const name of ['routes', 'routesVue']) {
      const files = await readShared(resolve(root, 'test/portable', name))
      const output = await compileProject(files, { root: 'Home' })
      const hosted = new Map<string, string>(hostedFixtureFiles({ files, output }, output.native))
      expect(hosted.has('routes.ts')).toBe(true)
      expect(hosted.get('routes.ts')).toContain('.vue')
      expect([...hosted.values()].some((text) => text.includes("from './Home.lite'"))).toBe(false)
      expect(hosted.has('shared/routes.ts')).toBe(false)
      expect(hosted.has('Home.vue')).toBe(true)
    }
    const files = new Map([
      ['shared/values.ts', 'export const size = 40'],
      ['shared/routes.ts', "import Home from './Home.lite'"],
    ])
    const output = { direct: [], model: { navigation: { path: 'shared/routes.ts' } } }
    const hosted = new Map<string, string>(
      hostedFixtureFiles(
        { files, output },
        new Map([['routes.ts', "import Home from './Home.vue'"]]),
      ),
    )
    expect(hosted.get('shared/values.ts')).toBe('export const size = 40')
  })

  it('prefers TypeScript value modules over same-case-insensitive SFC names in native projects', () => {
    let extensions = ['.vue', '.ts', '.js']
    const webpack = {
      init() {},
      Utils: { addCopyRule() {} },
      chainWebpack(callback: (config: unknown) => void) {
        callback({
          resolve: {
            alias: { set() {} },
            extensions: {
              prepend(value: string) {
                extensions = [value, ...extensions.filter((item) => item !== value)]
              },
            },
          },
        })
      },
      resolveConfig() {
        return { resolve: { extensions } }
      },
    }
    const module = { exports: undefined as unknown }
    runInNewContext(
      readFileSync(
        resolve(root, 'packages/create-mavis/templates/mobile/webpack.config.js'),
        'utf8',
      ),
      {
        module,
        __dirname: '/fixture',
        require(name: string) {
          if (name === 'node:path') return { resolve }
          if (name === '@nativescript/webpack') return webpack
          throw new Error(`Unexpected import ${name}`)
        },
      },
    )
    const configure = module.exports as (env: object) => { resolve: { extensions: string[] } }
    expect(configure({}).resolve.extensions).toEqual(['.ts', '.vue', '.js'])
  })

  it('type-checks the native probe with the actual NativeScript view contracts', () => {
    const program = ts.createProgram([resolve(root, 'test/portable-native/probe.ts')], {
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    })
    const errors = ts
      .getPreEmitDiagnostics(program)
      .map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n'))
    expect(errors).toEqual([])
  })
})
