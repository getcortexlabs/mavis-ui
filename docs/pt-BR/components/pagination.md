---
title: Pagination
description: Navegação controlada de páginas para resultados pequenos ou grandes.
---

# Pagination

Navegação controlada de páginas para resultados pequenos ou grandes.

::: info Ainda não publicado
Disponível no código-fonte; não faz parte da alpha.4.
:::

<ComponentPreview component="pagination" :height="900" />

| Prop | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `modelValue` | `number` | `1` | Página começando em 1. |
| `total` | `number` | obrigatório | Quantidade inteira segura e não negativa. |
| `pageSize` | `number` | `20` | Tamanho inteiro seguro e positivo. |
| `siblingCount` | `0 \| 1 \| 2` | `1` | Vizinhas ao redor da página atual. |
| `loading / disabled` | `boolean` | `false` | Impede pedidos de mudança. |
| `label` | `string` | `Result pages` | Nome da navegação. |

`update:modelValue(page)` pede outra página válida. Anterior/próxima são desabilitadas nos limites. Uma coleção vazia mantém a página 1 do pai sem inventar páginas numeradas. A quantidade de controles é limitada independentemente do total, com reticências inertes. Na Web, a página selecionada recebe `aria-current="page"`.

Se um filtro ou exclusão invalidar a página do pai, o controle mostra `invalidPageLabel` e deixa a aplicação decidir como recuperar; não altera seleção durante o render. `pagination(total, pageSize, page)` e `pageCount(total, pageSize)` expõem os mesmos cálculos neutros.

Traduza `previousLabel`, `nextLabel`, `pageLabel`, `currentLabel`, `emptyLabel` e `invalidPageLabel`. A aplicação controla carregamento, anúncios dos resultados, cancelamento, erro/repetição e sincronização com rota/query. Mantenha controles e resultados montados durante pedidos para preservar foco. A receita usa dados locais, volta à página 1 ao filtrar e verifica identidade da requisição contra respostas antigas. Paginação por cursor tem outro contrato e não é inferida a partir do total.

`statusText` recebe o anúncio educado dos resultados, definido pela aplicação, como página carregada e quantidade. O carregamento preserva rótulos e foco. Se aceitar uma página desabilitar ou remover a ação focada, o foco vai para a página atual apenas quando nenhum outro controle recebeu foco.

<<< @/../examples/catalog/shared/demos/PaginationDemo.vue
