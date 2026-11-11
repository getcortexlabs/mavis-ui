import { defineConfig } from 'vitepress'
import { existsSync } from 'node:fs'
import { librarySidebar, categoryLabel } from './navigation.mjs'

const site = 'https://mavis-ui.getcortexlabs.com'
const socialImage = `${site}/images/mavis-ui-social.jpg`
const socialImageAlt =
  'Mavis UI — Native UI. Made with character. Mavis Vermillion on a dark background.'
const repo = 'https://github.com/getcortexlabs/mavis-ui'
const cortex = '<a href="https://getcortexlabs.com/">Cortex Labs</a>'

function theme(prefix, pt = false) {
  return {
    nav: [
      { text: pt ? 'Estúdio' : 'Studio', link: `${prefix}/#studio` },
      { text: pt ? 'Guia' : 'Guide', link: `${prefix}/guide/`, activeMatch: `${prefix}/guide/` },
      {
        text: pt ? 'Componentes' : 'Components',
        link: `${prefix}/components/`,
        activeMatch: `${prefix}/components/`,
      },
      {
        text: pt ? 'Composições' : 'Compositions',
        link: `${prefix}/compositions/`,
        activeMatch: `${prefix}/compositions/`,
      },
      { text: 'Showcase', link: `${prefix}/showcase/`, activeMatch: `${prefix}/showcase/` },
    ],
    sidebar: [
      {
        text: pt ? 'Comece aqui' : 'Start here',
        items: [
          { text: pt ? 'Introdução' : 'Introduction', link: `${prefix}/guide/` },
          { text: pt ? 'Começar' : 'Getting started', link: `${prefix}/guide/foundation` },
          { text: pt ? 'Criar um projeto' : 'Create a project', link: `${prefix}/guide/create` },
          { text: pt ? 'Compartilhar telas' : 'Share screens', link: `${prefix}/guide/sharing` },
          {
            text: pt ? 'Instalação modular' : 'Modular installation',
            link: `${prefix}/guide/modular`,
          },
          { text: pt ? 'Ícones do aplicativo' : 'App icons', link: `${prefix}/guide/app-icons` },
          {
            text: pt ? 'Contrato dos componentes' : 'Component contract',
            link: `${prefix}/guide/component-contract`,
          },
          { text: pt ? 'Layout e texto' : 'Layout and text', link: `${prefix}/guide/layout` },
          { text: pt ? 'Acessibilidade' : 'Accessibility', link: `${prefix}/guide/accessibility` },
          { text: pt ? 'Temas' : 'Themes', link: `${prefix}/guide/themes` },
          {
            text: pt ? 'Capacidades Jolt Web' : 'Jolt Web capabilities',
            link: `${prefix}/guide/web-motion`,
          },
          {
            text: pt ? 'Compartilhar com a Web' : 'Sharing with the Web',
            link: `${prefix}/guide/web`,
          },
          { text: 'Nuxt, SSR & SSG', link: `${prefix}/guide/nuxt` },
          {
            text: pt ? 'Web, Nativo e Mac' : 'Web, Native and Mac',
            link: `${prefix}/guide/macos-experimental`,
          },
          {
            text: pt ? 'Exemplo Tasks' : 'Tasks example',
            link: `${prefix}/guide/tasks-example`,
          },
          {
            text: pt ? 'Arquitetura e suporte' : 'Architecture and support',
            link: `${prefix}/guide/architecture`,
          },
        ],
      },
      { text: pt ? 'Todos os componentes' : 'All components', link: `${prefix}/components/` },
      ...librarySidebar(prefix, pt),
      {
        text: 'Showcase',
        items: [
          { text: pt ? 'Exemplos completos' : 'Complete examples', link: `${prefix}/showcase/` },
          { text: 'Atlas', link: `${prefix}/showcase/atlas` },
          { text: 'Lustre', link: `${prefix}/showcase/lustre` },
          { text: 'Current', link: `${prefix}/showcase/current` },
          {
            text: pt ? 'Controles de veículo' : 'Vehicle controls',
            link: `${prefix}/showcase/vehicle`,
          },
          { text: pt ? 'Sessão de foco' : 'Focus session', link: `${prefix}/showcase/focus` },
          { text: pt ? 'Perfil' : 'Profile', link: `${prefix}/showcase/profile` },
          { text: pt ? 'Equipe' : 'Team', link: `${prefix}/showcase/team` },
          { text: pt ? 'Biblioteca' : 'Library', link: `${prefix}/showcase/library` },
          { text: pt ? 'Central de ajuda' : 'Help center', link: `${prefix}/showcase/help` },
          { text: 'Atelier', link: `${prefix}/showcase/studio` },
          { text: 'Morrow', link: `${prefix}/showcase/morrow` },
          { text: 'Kinetic', link: `${prefix}/showcase/kinetic` },
          { text: 'Forma', link: `${prefix}/showcase/forma` },
          { text: 'Gather', link: `${prefix}/showcase/gather` },
          { text: 'Field Guide', link: `${prefix}/showcase/field-guide` },
          { text: 'Afterglow', link: `${prefix}/showcase/afterglow` },
        ],
      },
      {
        text: pt ? 'O projeto' : 'The project',
        collapsed: true,
        items: [
          {
            text: pt ? 'Princípios de design' : 'Design principles',
            link: `${prefix}/guide/design`,
          },
          { text: 'Roadmap', link: `${prefix}/guide/roadmap` },
          { text: pt ? 'Ecossistema' : 'Ecosystem', link: `${prefix}/guide/ecosystem` },
        ],
      },
    ].map((group) =>
      group.items
        ? { ...group, text: categoryLabel(group.text, group.items.length), collapsed: true }
        : group,
    ),
    outline: { level: [2, 3], label: pt ? 'Nesta página' : 'On this page' },
    editLink: {
      pattern: `${repo}/edit/main/docs/:path`,
      text: pt ? 'Editar esta página no GitHub' : 'Edit this page on GitHub',
    },
    footer: {
      message: pt
        ? 'Componentes para NativeScript e Web. Começando por Vue.'
        : 'Components for NativeScript and Web. Starting with Vue.',
      copyright: pt
        ? `Mantido por Rafael Augusto e ${cortex}`
        : `Maintained by Rafael Augusto and ${cortex}`,
    },
    ...(pt
      ? {
          docFooter: { prev: 'Anterior', next: 'Próxima' },
          darkModeSwitchLabel: 'Aparência',
          lightModeSwitchTitle: 'Mudar para o tema claro',
          darkModeSwitchTitle: 'Mudar para o tema escuro',
          sidebarMenuLabel: 'Menu',
          returnToTopLabel: 'Voltar ao topo',
          langMenuLabel: 'Mudar o idioma',
          notFound: {
            title: 'Página não encontrada',
            quote: 'Esta página ainda não está aqui.',
            linkText: 'Voltar ao início',
          },
        }
      : {}),
  }
}

export default defineConfig({
  vite: { server: { proxy: { '/playground': 'http://127.0.0.1:5173' } } },
  title: 'Mavis UI',
  description:
    'Thoughtful Vue components for Web, iOS and Android, with an experimental Mac target. Interfaces with character.',
  lang: 'en-US',
  cleanUrls: true,
  appearance: true,
  sitemap: { hostname: site },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#f9f8f4' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Mavis UI' }],
    ['meta', { property: 'og:image', content: socialImage }],
    ['meta', { property: 'og:image:type', content: 'image/jpeg' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: socialImageAlt }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: socialImage }],
    ['meta', { name: 'twitter:image:alt', content: socialImageAlt }],
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
      ['x-default', sourcePath, `${site}/${translatedPath}`],
    ].filter(([, file]) => existsSync(new URL(`../${file}`, import.meta.url)))
    const title = pageData.title ? `${pageData.title} | Mavis UI` : 'Mavis UI'
    const description =
      pageData.description ||
      (portuguese
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
          inLanguage: ['en', 'pt-BR'],
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
            height: 630,
          },
        },
      ],
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
      [
        'script',
        { type: 'application/ld+json' },
        JSON.stringify(structuredData).replace(/</g, '\\u003c'),
      ],
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
                footer: { selectText: 'selecionar', navigateText: 'navegar', closeText: 'fechar' },
              },
            },
          },
        },
      },
    },
  },
  locales: {
    root: { label: 'English', lang: 'en-US', link: '/', themeConfig: theme('') },
    'pt-BR': {
      label: 'Português',
      lang: 'pt-BR',
      link: '/pt-BR/',
      description:
        'Componentes Vue para Web, iOS e Android, com Mac em fase experimental. Interfaces com personalidade.',
      themeConfig: theme('/pt-BR', true),
    },
  },
})
