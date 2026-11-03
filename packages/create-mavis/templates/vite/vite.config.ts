import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '#shared-ui': fileURLToPath(new URL('__MAVIS_SHARED_ROOT__', import.meta.url)),
      '#mavis': fileURLToPath(new URL('./src/mavis.ts', import.meta.url)),
    },
    dedupe: ['vue', '@vue/runtime-core', '@vue/reactivity', '@vue/shared'],
  },
})
