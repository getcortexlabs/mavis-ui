export default defineNuxtConfig({
  compatibilityDate: '2026-11-02',
  devtools: { enabled: false },
  runtimeConfig: { privateMarker: 'mavis-server-only-fixture' },
  css: ['@getcortexlabs/mavis-web/style.css', '~/assets/main.css'],
  experimental: { defaults: { nuxtLink: { prefetch: false } } },
  routeRules: {
    '/static': { prerender: true },
    '/dates-static': { prerender: true },
    '/workflows-static': { prerender: true },
    '/motion-static': { prerender: true },
  },
  nitro: {
    prerender: {
      crawlLinks: false,
      routes: ['/static', '/dates-static', '/workflows-static', '/motion-static'],
      ignore: [/^\/(?:saved|failure|pending|controls|components|dates|workflows)?$/],
    },
  },
  vite: { define: { __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true } },
})
