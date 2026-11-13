import type { App } from 'vue'
import { createCities, citiesKey } from './cities'
export function install(app: App) {
  let failed = false
  app.provide(
    citiesKey,
    createCities({
      async search(query, limit) {
        await new Promise<void>((resolve) => setTimeout(resolve, 30))
        if (query === 'fail' && !failed) {
          failed = true
          throw new Error('Offline')
        }
        const options =
          query === 'fail'
            ? [{ value: 'recovered', label: 'Recovered' }]
            : [
                { value: 'london', label: 'London' },
                { value: 'lisbon', label: 'Lisbon' },
              ].filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
        return options.slice(0, limit)
      },
    }),
  )
}
