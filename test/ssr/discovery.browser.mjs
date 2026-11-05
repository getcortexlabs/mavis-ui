import { test } from '@playwright/test'
import { checkNuxtDiscovery } from '../../scripts/check-nuxt-discovery.mjs'
for (const mode of ['ssr', 'ssg']) {
  test(`six controls hydrate and preserve edits: ${mode}`, async () => {
    await checkNuxtDiscovery('http://127.0.0.1:4198', mode)
  })
}
