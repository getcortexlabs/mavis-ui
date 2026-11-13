import { describe, expect, it, vi } from 'vitest'
import ts from 'typescript'
import { runInNewContext } from 'node:vm'
import * as directoryModule from '../packages/create-mavis/templates/directory/shared/directory-store'
import * as storageModule from '../packages/create-mavis/templates/directory/host/directory-storage'
// @ts-expect-error The creator ships native ESM.
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'

describe('generated Nuxt bootstrap execution', () => {
  it.each([false, true])(
    'isolates Directory per request and restores only after hydration (Mac: %s)',
    async (macos) => {
      const { files } = await projectFiles({
        name: 'studio',
        targets: macos ? 'web,native,macos' : 'web,native',
        web: 'nuxt',
        example: 'directory',
      })
      const source = files.get('apps/web/app/plugins/mavis.ts')
      const emitted = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText
      const storage = {
        getItem: vi.fn(() =>
          JSON.stringify(
            directoryModule.directorySeed.map((entry) => ({
              ...entry,
              name: `Saved ${entry.name}`,
            })),
          ),
        ),
        setItem: vi.fn(),
      }
      const ready: (() => void)[] = []
      const theme = { setAppearance: vi.fn() }
      const core = { createRouterNavigation: () => ({}), mavis: {}, midnight: {} }
      const services = { createMavisServices: (options: unknown) => options }
      const modules: Record<string, unknown> = {
        '@getcortexlabs/mavis-core': core,
        '@getcortexlabs/mavis-core/vue': { useMavisTheme: () => theme },
        '@getcortexlabs/mavis-web/services': services,
        '#shared-ui/directory-store': directoryModule,
        '../utils/directory-storage': storageModule,
        '../generated/theme': { appTheme: {}, appDarkTheme: {}, appAppearance: 'system' },
      }
      const exports: { default?: (app: unknown) => void } = {}
      runInNewContext(emitted, {
        exports,
        require: (name: string) => {
          if (!(name in modules)) throw new Error(`Unexpected bootstrap dependency: ${name}`)
          return modules[name]
        },
        defineNuxtPlugin: (plugin: unknown) => plugin,
        useCookie: () => ({ value: undefined }),
        useState: (_key: string, initial: () => unknown) => ({ value: initial() }),
        onNuxtReady: (callback: () => void) => ready.push(callback),
        localStorage: storage,
      })
      const request = () => {
        const provided = new Map<symbol, unknown>()
        exports.default!({
          $router: {},
          vueApp: {
            use: vi.fn(),
            provide: (key: symbol, value: unknown) => provided.set(key, value),
            runWithContext: (callback: () => unknown) => callback(),
          },
        })
        return provided.get(directoryModule.directoryKey) as directoryModule.Directory
      }
      const first = request(),
        second = request()
      expect(storage.getItem).not.toHaveBeenCalled()
      expect(first).not.toBe(second)
      first.query.value = 'private search'
      expect(second.query.value).toBe('')
      expect(second.entries.value[0]?.name).toBe('Community garden')
      expect(ready).toHaveLength(2)
      ready[0]!()
      // restore shares the host's pending load, so awaiting it observes the hydration callback.
      await first.restore()
      expect(storage.getItem).toHaveBeenCalledOnce()
      expect(storage.getItem).toHaveBeenCalledWith('mavis:directory')
      expect(first.entries.value[0]?.name).toBe('Saved Community garden')
      expect(second.entries.value[0]?.name).toBe('Community garden')
      await first.save('garden', 'Confirmed garden')
      expect(storage.setItem).toHaveBeenCalledWith('mavis:directory', expect.any(String))
      expect(second.entries.value[0]?.name).toBe('Community garden')
    },
  )
})
