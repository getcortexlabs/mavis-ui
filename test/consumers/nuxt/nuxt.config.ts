export default defineNuxtConfig({
  compatibilityDate: '2026-11-02',
  devtools: { enabled: false },
  runtimeConfig: { privateMarker: 'mavis-server-only-fixture' },
  css: ['@getcortexlabs/mavis-web/style.css', '~/assets/main.css'],
  experimental: { defaults: { nuxtLink: { prefetch: false } } },
  routeRules: { '/static': { prerender: true } },
  nitro: {
    prerender: {
      crawlLinks: false,
      routes: ['/static'],
      ignore: [/^\/(?:saved|failure|pending|controls|components)?$/],
    },
  },
  vite: { define: { __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true } },
})
