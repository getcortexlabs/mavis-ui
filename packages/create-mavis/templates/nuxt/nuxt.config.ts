import { fileURLToPath } from 'node:url'
export default defineNuxtConfig({
  compatibilityDate: '2026-11-02',
  alias: {
    '#shared-ui': fileURLToPath(new URL('__MAVIS_SHARED_ROOT__', import.meta.url)),
    '#mavis': fileURLToPath(new URL('./app/mavis.ts', import.meta.url)),
  },
  devtools: { enabled: false },
  css: ['@getcortexlabs/mavis-web/style.css', '~/assets/main.css'],
  app: { head: { title: '__MAVIS_NAME__', htmlAttrs: { lang: 'en' } } },
})
