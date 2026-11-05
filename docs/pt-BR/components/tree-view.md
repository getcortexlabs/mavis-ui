---
title: TreeView
---

# TreeView

::: info Unreleased
Disponível no código em desenvolvimento para Vue + Vite, Nuxt e NativeScript iOS/Android. Ainda não publicado no npm.
:::

<ComponentPreview component="tree-view" :height="850" />

```vue
<MTreeView v-model="selected" v-model:expanded="expanded" :nodes="nodes" label="Files" @load="loadChildren" />
```

| Prop | Type | Default | Descrição |
| --- | --- | --- | --- |
| `nodes` | `readonly TreeNode[]` | `required` | key, label, disabled, children e hasChildren. |
| `modelValue / v-model` | `ChoiceValue or null` | `null` | Chave selecionada, independente da expansão. |
| `expanded / v-model:expanded` | `readonly ChoiceValue[]` | `[]` | Chaves dos ramos abertos. |
| `loadingKeys` | `readonly ChoiceValue[]` | `[]` | Ramos carregando; evita repetir pedidos durante a espera. |
| `disabled / emptyLabel` | `boolean / string` | `false / No items` | Indisponibilidade global e estado vazio. |

Cada nó tem uma chave única em toda a árvore; ciclos e profundidade acima de 100 níveis são rejeitados. hasChildren com children ausente emite load ao expandir. O app busca os filhos, atualiza nodes e controla loadingKeys; forneça [] para um resultado vazio. Requisições, erros e cancelamento pertencem ao app. Web oferece roving tabindex, setas, Home/End, busca por inicial e Enter/Space; setas de expansão seguem o padrão de árvore esquerda/direita. Nativo mantém ações explícitas para expandir e selecionar. MReveal/Jolt anima a expansão com movimento reduzido. Não há seleção em cascata nem virtualização nesta versão.

<<< @/../examples/catalog/shared/demos/TreeViewDemo.vue
