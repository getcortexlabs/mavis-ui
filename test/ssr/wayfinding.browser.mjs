import { test } from '@playwright/test'
import { checkNuxtWayfinding } from '../../scripts/check-nuxt-wayfinding.mjs'
for (const mode of ['ssr', 'ssg']) {
  test(`six wayfinding controls hydrate: ${mode}`, async () => {
    await checkNuxtWayfinding('http://127.0.0.1:4198', mode)
  })
}
