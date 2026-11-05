---
title: Link
description: "Navegação com semântica Web e rotas controladas pelo app."
---

# Link

`MLink` representa navegação. `MButton` e `MCard` também recebem as mesmas props quando o destino pede a apresentação de botão ou card.

<ComponentPreview component="link" lang="pt" :height="280" />

```vue
<m-link href="https://mavis-ui.getcortexlabs.com/" target="_blank">Documentação</m-link>
<m-button href="/account" :navigate="openRoute">Minha conta</m-button>
<m-card href="/record/42" :navigate="openRoute" accessibilityLabel="Abrir registro">
  <m-text variant="heading">Registro 42</m-text>
</m-card>
```

| Prop | Tipo | Padrão | Finalidade |
| --- | --- | --- | --- |
| `href` | string | — | Destino obrigatório no Link; ativa navegação em Button/Card. |
| `navigate` | (href: string) => void ou Promise | — | Navegação fornecida pelo app. |
| `target` | _self / _blank | `_self` | Contexto de navegação Web. |
| `rel` | string | — | Relação Web. Destinos blank recebem noopener/noreferrer. |
| `text` | string | — | Texto do Link, ou texto puro no slot padrão. |
| `disabled` | boolean | `false` | Bloqueia ativação e remove href/foco de teclado na Web. |
| `inline` | boolean | `false` | Apresentação inline do Link na Web. |

A Web renderiza uma única âncora e preserva copiar link, teclado e cliques com modificadores. Apenas um clique comum com `_self` chama `navigate`. No NativeScript, rotas internas usam o callback do app; URLs externas usam o sistema. `target` e `rel` são indicações exclusivas da Web. Falhas emitem `error`; solicitações de ativação emitem `click` sem payload. Rotas, histórico e estado pertencem ao aplicativo.

## Vue Router / Nuxt

Use o slot customizado para o Mavis ser a única âncora. Adapte o argumento de URL do Mavis ao handler de eventos do router:

```vue
<RouterLink to="/account" custom v-slot="{ href, navigate, isActive }">
  <m-button :href="href" :navigate="() => navigate()" :aria-current="isActive ? 'page' : undefined">
    Minha conta
  </m-button>
</RouterLink>
```

A composição também funciona com `NuxtLink` e `MCard`. Não envolva um componente interativo em outra âncora nem coloque controles em um card de navegação. Um Button sem `href` continua aceitando `type="submit"` para formulários.

<<< @/../examples/catalog/shared/demos/LinkDemo.vue

## Navegação por aplicação

Na alpha.11, `createMavis` e `createMavisServices` aceitam `navigation: createRouterNavigation(router)`. Link, Button e Card com href usam o adaptador sem callbacks por componente. A prop `navigate` explícita tem precedência. Veja [Compartilhar telas](../guide/sharing).
