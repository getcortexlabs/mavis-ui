import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { 'nativescript-vue': 'vue' } },
  test: { include: ['test/**/*.spec.ts'], clearMocks: true },
})
