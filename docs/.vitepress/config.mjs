import { defineConfig } from 'vitepress'
import { existsSync } from 'node:fs'

const site = 'https://mavis-ui.getcortexlabs.com'
const socialImage = `${site}/images/mavis-ui-social.jpg`
const socialImageAlt = 'Mavis UI — Native UI. Made with character. Mavis Vermillion on a dark background.'
const repo = 'https://github.com/getcortexlabs/mavis-ui'
const cortex = '<a href="https://getcortexlabs.com/">Cortex Labs</a>'

function theme(prefix, pt = false) {
  return {
    nav: [
      { text: pt ? 'Guia' : 'Guide', link: `${prefix}/guide/`, activeMatch: `${prefix}/guide/(?!roadmap|ecosystem)` },
      { text: 'Roadmap', link: `${prefix}/guide/roadmap` },
      { text: pt ? 'Ecossistema' : 'Ecosystem', link: `${prefix}/guide/ecosystem` }
    ],
    sidebar: {
      [`${prefix}/guide/`]: [
        {
          text: pt ? 'O projeto' : 'The project',
          items: [
            { text: pt ? 'O que é o Mavis UI' : 'What is Mavis UI?', link: `${prefix}/guide/` },
            { text: pt ? 'Princípios de design' : 'Design principles', link: `${prefix}/guide/design` },
            { text: 'Roadmap', link: `${prefix}/guide/roadmap` }
          ]
        },
        {
          text: pt ? 'A base' : 'The foundation',
          items: [
            { text: pt ? 'Ecossistema' : 'Ecosystem', link: `${prefix}/guide/ecosystem` },
            { text: pt ? 'Jolt — animação' : 'Jolt — animation', link: 'https://jolt.rafaelaugusto.dev/' },
            { text: pt ? 'vue-router-ns — navegação' : 'vue-router-ns — navigation', link: 'https://vue-router-ns.rafaelaugusto.dev/' }
          ]
        }
      ]
    },
    outline: { level: [2, 3], label: pt ? 'Nesta página' : 'On this page' },
    editLink: {
      pattern: `${repo}/edit/main/docs/:path`,
      text: pt ? 'Editar esta página no GitHub' : 'Edit this page on GitHub'
    },
    footer: {
      message: pt ? 'Uma biblioteca de UI para NativeScript. Começando por Vue.' : 'A UI library for NativeScript. Starting with Vue.',
      copyright: pt ? `Mantido por Rafael Augusto e ${cortex}` : `Maintained by Rafael Augusto and ${cortex}`
    },
    ...(pt ? {
      docFooter: { prev: 'Anterior', next: 'Próxima' },
      darkModeSwitchLabel: 'Aparência',
      lightModeSwitchTitle: 'Mudar para o tema claro',
      darkModeSwitchTitle: 'Mudar para o tema escuro',
      sidebarMenuLabel: 'Menu',
      returnToTopLabel: 'Voltar ao topo',
      langMenuLabel: 'Mudar o idioma',
      notFound: { title: 'Página não encontrada', quote: 'Esta página ainda não está aqui.', linkText: 'Voltar ao início' }
    } : {})
  }
}

export default defineConfig({
  title: 'Mavis UI',
  description: 'Native UI components with character. Built for NativeScript, starting with Vue.',
  lang: 'en-US',
  cleanUrls: true,
  appearance: true,
  sitemap: { hostname: site },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#b44468' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Mavis UI' }],
    ['meta', { property: 'og:image', content: socialImage }],
    ['meta', { property: 'og:image:type', content: 'image/jpeg' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: socialImageAlt }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: socialImage }],
    ['meta', { name: 'twitter:image:alt', content: socialImageAlt }]
  ],
  transformHead({ pageData }) {
    if (pageData.isNotFound || pageData.relativePath === '404.md') {
      return [['meta', { name: 'robots', content: 'noindex, follow' }]]
    }
    const path = pageData.relativePath.replace(/index\.md$/, '').replace(/\.md$/, '')
    const url = `${site}/${path}`
    const portuguese = pageData.relativePath.startsWith('pt-BR/')
    const language = portuguese ? 'pt-BR' : 'en'
    const sourcePath = pageData.relativePath.replace(/^pt-BR\//, '')
    const translatedPath = sourcePath.replace(/index\.md$/, '').replace(/\.md$/, '')
    const alternates = [
      ['en', sourcePath, `${site}/${translatedPath}`],
      ['pt-BR', `pt-BR/${sourcePath}`, `${site}/pt-BR/${translatedPath}`],
      ['x-default', sourcePath, `${site}/${translatedPath}`]
    ].filter(([, file]) => existsSync(new URL(`../${file}`, import.meta.url)))
    const title = pageData.title ? `${pageData.title} | Mavis UI` : 'Mavis UI'
    const description = pageData.description || (portuguese
      ? 'Componentes de UI para NativeScript, começando por Vue. Conheça o Mavis UI.'
      : 'Native UI components with character. Built for NativeScript, starting with Vue.')
    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${site}/#website`,
          name: 'Mavis UI',
          url: `${site}/`,
          inLanguage: ['en', 'pt-BR']
        },
        {
          '@type': 'WebPage',
          '@id': `${url}#webpage`,
          url,
          name: title,
          description,
          inLanguage: language,
          isPartOf: { '@id': `${site}/#website` },
          primaryImageOfPage: {
            '@type': 'ImageObject',
            contentUrl: socialImage,
            width: 1200,
            height: 630
          }
        }
      ]
    }
    return [
      ['link', { rel: 'canonical', href: url }],
      ...alternates.map(([hreflang, , href]) => ['link', { rel: 'alternate', hreflang, href }]),
      ['meta', { name: 'robots', content: 'index, follow, max-image-preview:large' }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:locale', content: portuguese ? 'pt_BR' : 'en_US' }],
      ['meta', { property: 'og:locale:alternate', content: portuguese ? 'en_US' : 'pt_BR' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['script', { type: 'application/ld+json' }, JSON.stringify(structuredData).replace(/</g, '\\u003c')]
    ]
  },
  themeConfig: {
    logo: '/favicon.svg',
    socialLinks: [{ icon: 'github', link: repo }],
    search: {
      provider: 'local',
      options: {
        locales: {
          'pt-BR': {
            translations: {
              button: { buttonText: 'Buscar', buttonAriaLabel: 'Buscar na documentação' },
              modal: {
                noResultsText: 'Nenhum resultado para',
                resetButtonTitle: 'Limpar busca',
                displayDetails: 'Exibir detalhes',
                footer: { selectText: 'selecionar', navigateText: 'navegar', closeText: 'fechar' }
              }
            }
          }
        }
      }
    }
  },
  locales: {
    root: { label: 'English', lang: 'en-US', link: '/', themeConfig: theme('') },
    'pt-BR': {
      label: 'Português',
      lang: 'pt-BR',
      link: '/pt-BR/',
      description: 'Componentes de UI com personalidade. Para NativeScript, começando por Vue.',
      themeConfig: theme('/pt-BR', true)
    }
  }
})
