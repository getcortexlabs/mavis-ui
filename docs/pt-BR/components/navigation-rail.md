---
title: NavigationRail
---

# NavigationRail

::: info Adicionado na alpha.11
Incluído no Mavis 0.1.0-alpha.11 para Vue + Vite, Nuxt e NativeScript iOS/Android. Mantenha core e renderizadores na mesma versão.
:::

<ComponentPreview component="navigation-rail" :height="1000" />

```vue
<MNavigationRail v-model:collapsed="collapsed" :modelValue="routeKey" :groups="groups" label="Workspace" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `groups` | `readonly NavigationGroup[]` | required | Grupos com key, label e itens NavigationItem. Valores dos itens são únicos entre grupos. |
| `modelValue` | `ChoiceValue or null` | null | Destino atual controlado pelo app; navegação concluída determina o item ativo. |
| `collapsed / collapsible / disabled` | `boolean` | false / true / false | Apresentação compacta de 80 px/DIP ou expandida de 256 px/DIP. |
| `header / footer` | `slots` | — | Recebem { collapsed } para marca e conta. |

Links usam o adaptador de navegação Mavis ou navigate do item. A Web preserva href e comportamento de links. O estado atual pertence ao aplicativo e não muda antecipadamente ao clique. Botões compactos mantêm nomes acessíveis e contexto dos badges. Jolt anima indicadores e feedback; o aplicativo escolhe quando recolher conforme seu layout.

Eventos: `update:collapsed(boolean)`, `error(unknown)`.

## Mac

Numa tela compartilhada para o [destino experimental Mac](../guide/macos-experimental), o `MNavigationRail` desenha os mesmos grupos, com 256 pontos de largura ou 80 recolhido, e marca o destino que a fonte indica como atual; o Jolt move a marca e a largura. `collapsed` continua com a fonte: `v-model:collapsed`, ou `:collapsed` com `@update:collapsed`, num arquivo `.vue`, e `collapsed` com `onCollapse` num arquivo `.lite.tsx`. Os slots `header` e `footer` recebem `{ collapsed }`. Um destino em outro site abre no navegador; um dentro do app precisa da navegação do app, que o destino Mac ainda não tem, e emite `error` até lá. Lá os itens são dados: a função `navigate` do próprio item não é aceita, os valores são strings e `badge` é texto.

<<< @/../examples/catalog/shared/demos/NavigationRailDemo.vue
