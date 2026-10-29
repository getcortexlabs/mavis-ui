import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: {
    'nativescript-vue': 'vue',
    '@mavis-ui/core/vue': new URL('./packages/core/src/vue/index.ts', import.meta.url).pathname,
    '@mavis-ui/core': new URL('./packages/core/src/index.ts', import.meta.url).pathname,
  } },
  test: { include: ['test/**/*.spec.ts'], clearMocks: true },
})
