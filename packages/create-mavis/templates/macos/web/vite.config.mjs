import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
// Shared Vue files run here as written: they import Mavis from #mavis.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '#shared-ui': fileURLToPath(new URL('../../shared', import.meta.url)),
      '#mavis': fileURLToPath(new URL('./src/mavis.js', import.meta.url)),
    },
    dedupe: ['vue'],
  },
})
