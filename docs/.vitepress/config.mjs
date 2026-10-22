import { defineConfig } from 'vitepress'

const site = 'http://mavis-ui.getcortexlabs.com'
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
    ['meta', { property: 'og:image', content: `${site}/images/mavis.webp` }],
    ['meta', { name: 'twitter:card', content: 'summary' }]
  ],
  transformHead({ pageData }) {
    if (pageData.isNotFound) return []
    const path = pageData.relativePath.replace(/index\.md$/, '').replace(/\.md$/, '')
    return [
      ['link', { rel: 'canonical', href: `${site}/${path}` }],
      ['meta', { property: 'og:title', content: pageData.title ? `${pageData.title} | Mavis UI` : 'Mavis UI' }],
      ['meta', { property: 'og:description', content: pageData.description || 'Native UI components with character. Built for NativeScript, starting with Vue.' }]
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
