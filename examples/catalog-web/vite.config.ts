import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'check-browser-dependencies',
      generateBundle(_options, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') continue
          for (const id of Object.keys(chunk.modules)) {
            if (
              (/\/@rafaelaugusto\/jolt\/dist\//.test(id) && !/\/dist\/(web|core)\//.test(id)) ||
              /\/(@nativescript\/|nativescript-vue\/|@rafaelaugusto\/jolt-native\/|packages\/nativescript\/)/.test(
                id,
              )
            ) {
              this.error(`Native dependency included in the browser bundle: ${id}`)
            }
          }
        }
      },
    },
  ],
  base: '/playground/',
  resolve: { dedupe: ['vue', '@vue/runtime-core', '@vue/reactivity', '@vue/shared'] },
  build: {
    outDir: '../../docs/.vitepress/dist/playground',
    emptyOutDir: true,
  },
})
