export default defineNuxtConfig({
  compatibilityDate: '2026-11-02',
  devtools: { enabled: false },
  css: ['@getcortexlabs/mavis-web/style.css', '~/assets/main.css'],
  app: { head: { title: '__MAVIS_NAME__', htmlAttrs: { lang: 'en' } } },
})
