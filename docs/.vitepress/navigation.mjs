import {
  componentCategories,
  componentUpdates,
  statusLabel,
  statusDescription,
} from './catalog.mjs'

const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
export function categoryLabel(label, count) {
  return `<span class="catalog-category">${escape(label)}</span><span class="catalog-count" aria-hidden="true">${count}</span>`
}
function componentLink(prefix, pt, [id, name]) {
  const status = componentUpdates[id]
  const badge = status
    ? `<span class="catalog-status ${status}" title="${escape(statusDescription(id, pt))}" aria-label="${escape(statusDescription(id, pt))}">${statusLabel(id, pt)}</span>`
    : ''
  return {
    text: `<span class="catalog-name">${escape(name)}</span>${badge}`,
    docFooterText: name,
    link: `${prefix}/components/${id}`,
  }
}
export function librarySidebar(prefix, pt) {
  const link = (en, br, path) => ({ text: pt ? br : en, link: `${prefix}${path}` })
  const categories = componentCategories.map((group) => ({
    text: group.name[pt ? 1 : 0],
    items: group.items.map((item) => componentLink(prefix, pt, item)),
  }))
  categories
    .find((group) => group.text === (pt ? 'Movimento' : 'Motion'))
    .items.push(
      link('Motion recipes', 'Receitas de movimento', '/guide/motion'),
      link('Regions & interactions', 'Regiões e interações', '/guide/motion-regions'),
      link('Paths, depth & shadows', 'Trajetórias e profundidade', '/guide/motion-depth'),
      link(
        'Reordering',
        'Reordenação',
        `/guide/visual-motion#${pt ? 'reordenar-as-mesmas-linhas' : 'reordering-the-same-rows'}`,
      ),
      link('Images & physics', 'Imagens e física', '/guide/platform-motion'),
    )
  categories
    .find((group) => group.text === (pt ? 'Texto' : 'Text'))
    .items.push(
      link('Typography', 'Tipografia', '/guide/typography'),
      link(
        'Animated text & numbers',
        'Texto e números animados',
        `/guide/visual-motion#${pt ? 'texto-e-numeros' : 'text-and-numbers'}`,
      ),
    )
  const compositions = {
    text: pt ? 'Composições' : 'Compositions',
    items: [
      link('Overview', 'Visão geral', '/compositions/'),
      link('Auth form', 'Formulário de autenticação', '/showcase/morrow'),
      link('Step form', 'Formulário por etapas', '/showcase/gather'),
      link('Search & filters', 'Busca e filtros', '/showcase/library'),
      link('Profile editor', 'Editor de perfil', '/showcase/profile'),
      link('Team directory', 'Diretório de equipe', '/showcase/team'),
    ],
  }
  // Keep complete screens in Showcase; these entries expose their reusable compositions.
  categories.splice(6, 0, compositions)
  categories.push({
    text: pt ? 'Fundos' : 'Backgrounds',
    items: [
      link('Gradients', 'Gradientes', `/guide/visual-motion#${pt ? 'gradientes' : 'gradients'}`),
      link('Lustre · surfaces', 'Lustre · superfícies', '/showcase/lustre'),
    ],
  })
  return categories
}
