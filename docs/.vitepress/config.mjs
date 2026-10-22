import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Mavis UI',
  description: 'A UI library for NativeScript, starting with Vue.',
  lang: 'en-US',
  appearance: false,
  cleanUrls: true,
  sitemap: { hostname: 'http://mavis-ui.getcortexlabs.com' },
  head: [
    ['link', { rel: 'icon', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#f8f8f2' }],
    ['meta', { property: 'og:title', content: 'Mavis UI — Native, with feeling.' }],
    ['meta', { property: 'og:description', content: 'A UI library for NativeScript, starting with Vue. Components, motion, and navigation, designed together.' }],
    ['meta', { property: 'og:type', content: 'website' }]
  ],
  transformHead({ pageData }) {
    const path = pageData.relativePath.replace(/index\.md$/, '').replace(/\.md$/, '')
    return [['link', { rel: 'canonical', href: `http://mavis-ui.getcortexlabs.com/${path}` }]]
  },
  themeConfig: {
    siteTitle: 'Mavis UI',
    socialLinks: [{ icon: 'github', link: 'https://github.com/getcortexlabs/mavis-ui' }],
    footer: { message: 'Made by Cortex Labs' }
  }
})
