import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()],
  resolve: { dedupe: ['vue', '@vue/runtime-core', '@vue/reactivity', '@vue/shared'] },
})
