import type { App } from 'vue'
import { createComboboxSearch } from '@getcortexlabs/mavis-core'
import { createSearchProbe, searchProbeKey } from './probe'

const pause = (time: number) => new Promise<void>((resolve) => setTimeout(resolve, time))
const option = (value: string) => ({ value, label: value })

export function install(app: App) {
  app.provide(
    searchProbeKey,
    createSearchProbe({
      async run() {
        let checks = 0
        const check = (value: boolean) => {
          if (!value) throw new Error(`Search check ${checks + 1}`)
          checks++
        }
        let calls = 0
        const cached = createComboboxSearch({
          search: async () => {
            calls++
            return []
          },
          initialResults: { query: 'saved', options: [option('saved')] },
        })
        cached.request('saved')
        check(calls === 0 && cached.state.options[0]?.value === 'saved')
        cached.dispose()

        const delayed = createComboboxSearch({
          debounce: 30,
          search: async () => {
            calls++
            return []
          },
        })
        delayed.request('a')
        delayed.cancel()
        await pause(50)
        check(calls === 0 && delayed.state.status === 'idle')
        delayed.dispose()

        let cancelled = 0
        const stale = createComboboxSearch({
          debounce: 0,
          search: async (query, context) => {
            context.onCancel(() => {
              cancelled++
            })
            await pause(query === 'old' ? 80 : 5)
            return [option(query)]
          },
        })
        stale.request('old')
        await pause(2)
        stale.request('new')
        await pause(100)
        check(cancelled === 1 && stale.state.options[0]?.value === 'new')
        stale.dispose()

        let cleanups = 0
        const cleanup = createComboboxSearch({
          debounce: 0,
          search: async (_query, context) => {
            context.onCancel(() => {
              cleanups++
              throw new Error('Broken host cleanup')
            })
            context.onCancel(() => {
              cleanups++
            })
            await pause(20)
            context.onCancel(() => {
              cleanups++
            })
            return []
          },
        })
        cleanup.request('a')
        await pause(2)
        cleanup.cancel()
        await pause(40)
        check(cleanups === 3 && cleanup.state.status === 'idle')
        cleanup.dispose()

        let attempts = 0
        const retry = createComboboxSearch({
          debounce: 0,
          search: async () => {
            attempts++
            if (attempts === 1) throw new Error('Offline')
            return [option('retried')]
          },
        })
        retry.request('a')
        await pause(5)
        const failed = retry.state.status === 'error'
        retry.retry()
        await pause(5)
        check(failed && attempts === 2 && retry.state.options[0]?.value === 'retried')
        retry.dispose()

        const bounded = createComboboxSearch({
          debounce: 0,
          maxResults: 2,
          search: async () => [option('a'), option('b'), option('c')],
        })
        bounded.request('a')
        await pause(5)
        check(bounded.state.limited && bounded.state.options.length === 2)
        bounded.dispose()

        let disposed = 0
        const gone = createComboboxSearch({
          debounce: 0,
          search: async (_query, context) => {
            context.onCancel(() => {
              disposed++
            })
            await pause(20)
            return [option('late')]
          },
        })
        gone.request('a')
        await pause(2)
        gone.dispose()
        gone.request('b')
        await pause(40)
        check(disposed === 1 && gone.state.query === 'a' && gone.state.options.length === 0)

        const invalid = createComboboxSearch({
          debounce: 0,
          search: async () => [option('a'), option('a')],
        })
        invalid.request('a')
        await pause(5)
        check(invalid.state.status === 'error')
        invalid.dispose()
        return `${checks} search checks passed`
      },
    }),
  )
}
