---
title: VirtualList
---

# VirtualList

::: info Alpha.10
Disponível no Mavis alpha.11 para Vue Web e NativeScript. Mantenha core e renderizadores na mesma versão.
:::

<ComponentPreview component="virtual-list" :height="800" />

```vue
<MVirtualList
  :items="items"
  itemKey="id"
  :rowHeight="72"
  :height="360"
  label="Collections"
><template #default="{ item }">…</template></MVirtualList>
```

| Propriedade          | Tipo                                      | Padrão                | Descrição                                                      |
| -------------------- | ----------------------------------------- | --------------------- | -------------------------------------------------------------- |
| `items`              | `readonly T[]`                            | `required`            | Coleção controlada pelo app.                                   |
| `itemKey`            | `keyof T / (item: T) => string or number` | `id`                  | Identidade única estável; índices não servem para reordenação. |
| `rowHeight`          | `number`                                  | `required`            | Altura fixa positiva em px/DIP.                                |
| `height`             | `number`                                  | `required`            | Altura finita da área de rolagem.                              |
| `overscan`           | `number`                                  | `3`                   | Linhas extras Web; nativo controla o buffer.                   |
| `initialIndex`       | `number`                                  | `0`                   | Destino inicial de rolagem.                                    |
| `label / emptyLabel` | `string`                                  | `required / No items` | Nome da lista e fallback vazio.                                |

Coleção vertical com altura fixa de linha. Web renderiza a viewport mais overscan; NativeScript usa ListView com reciclagem. O slot padrão tipado recebe `{ item, index, itemKey }`; `empty` substitui o estado vazio. O método público `scrollToIndex(index)` rejeita índices inválidos. Use substituição imutável do array ou itens reativos. Chaves ausentes/duplicadas falham cedo; números e strings mantêm identidades distintas. Ao reordenar preserva o primeiro item lógico visível quando possível: no nativo restaura a linha e na Web também o deslocamento em pixels.

Mantenha drafts, seleção e carregamento no item ou em store pela chave. Estado local da célula não sobrevive à desmontagem; no nativo o filho com chave é recriado ao reciclar para outro item. Na Web a linha focada continua montada ao rolar e, se removida, o foco retorna à lista. Não há promessa de preservar foco de editores nativos arbitrários fora da viewport. Escolha rowHeight que comporte texto e fonte de acessibilidade; altura variável, paginação, arrastar para reordenar e restauração automática entre rotas ficam fora deste primeiro contrato. Dê à lista uma viewport limitada e evite colocá-la dentro de outro scroller vertical. SSR renderiza a mesma janela inicial limitada e hidrata sua posição.

<<< @/../examples/catalog/shared/demos/VirtualListDemo.vue
