import { expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import type { App } from 'vue'
import * as core from '../packages/core/src/index'
import * as probeModule from './portable/toastPolicy/shared/probe'

it('runs the published core side of the same native toast policy replay', async () => {
  // The conformance runner places host.ts beside its shared modules. Resolve that same
  // boundary in this unit test, without writing or launching a generated application.
  const source = await readFile(new URL('./portable/toastPolicy/host.ts', import.meta.url), 'utf8')
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
  const host = {} as { install(app: App): void }
  new Function('require', 'exports', js)((name: string) => {
    if (name === './probe') return probeModule
    if (name === '@getcortexlabs/mavis-core') return core
    throw new Error(`Unexpected host import: ${name}`)
  }, host)
  let probe: ReturnType<typeof probeModule.createToastProbe> | undefined
  host.install({
    provide(_key: unknown, store: ReturnType<typeof probeModule.createToastProbe>) {
      probe = store
    },
  } as App)
  await probe!.run()
  expect(probe!.report.value).toBe('10 toast checks passed')
})
