import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: {
    'nativescript-vue': new URL('./test/native-vue.ts', import.meta.url).pathname,
    '@getcortexlabs/mavis-core/vue': new URL('./packages/core/src/vue/index.ts', import.meta.url).pathname,
    '@getcortexlabs/mavis-core': new URL('./packages/core/src/index.ts', import.meta.url).pathname,
  } },
  test: { include: ['test/**/*.spec.ts'], clearMocks: true },
})
