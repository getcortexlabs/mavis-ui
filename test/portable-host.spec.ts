import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
const root = new URL('..', import.meta.url).pathname

describe('portable host preparation', () => {
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
