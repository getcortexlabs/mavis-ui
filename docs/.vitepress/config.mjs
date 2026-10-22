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
    ['meta', { name: 'theme-color', content: '#f7f5ec' }],
    ['meta', { property: 'og:title', content: 'Mavis UI — A little magic. Entirely native.' }],
    ['meta', { property: 'og:description', content: 'A UI library for NativeScript, starting with Vue. Components, motion, and navigation, designed together.' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: 'http://mavis-ui.getcortexlabs.com/images/mavis-forest.webp' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }]
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
