---
title: DataTable
---

# DataTable

::: info Adicionado na alpha.11
Incluído no Mavis 0.1.0-alpha.11 para Vue + Vite, Nuxt e NativeScript iOS/Android. Mantenha core e renderizadores na mesma versão.
:::

<ComponentPreview component="data-table" :height="850" />

```vue
<MDataTable :items="rows" :columns="columns" v-model:sort="sort" v-model:selected="selected" label="Collections" selectable />
```

| Prop | Type | Default | Descrição |
| --- | --- | --- | --- |
| `items / itemKey` | `readonly object[] / string or function` | `required / id` | Dados da página e identidade estável. |
| `columns` | `readonly DataColumn[]` | `required` | Chave, título, largura, alinhamento e acesso ao valor. |
| `sort / v-model:sort` | `DataSort or null` | `null` | Emite ascendente, descendente e sem ordem; o app ordena os dados. |
| `selected / v-model:selected` | `readonly ChoiceValue[]` | `[]` | Chaves selecionadas; preserva seleção fora da página atual. |
| `selectable / rowDisabled / rowLabel` | `boolean / function / function` | `false / — / —` | Seleção opcional, indisponibilidade por linha e rótulo acessível. |
| `disabled / loading` | `boolean` | `false` | Bloqueiam edição; loading apresenta indicador. |

A tabela recebe os dados da página atual. Ordenação, filtros, requisições e paginação pertencem ao app; use MPagination no slot footer. Os slots cell e cell:chave recebem item, itemKey, column, value e index; actions e empty também estão disponíveis. Web usa tabela HTML com cabeçalhos e aria-sort; no nativo, as colunas têm rolagem horizontal e cada célula mantém o título da coluna. Chaves numéricas e strings são distintas. Não é uma grade editável nem uma lista virtualizada: pagine conjuntos grandes.

<<< @/../examples/catalog/shared/demos/DataTableDemo.vue
