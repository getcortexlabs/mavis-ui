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
| `animated`           | `boolean`                                 | `true`                | Anima mudanças por chave na Web/NativeScript.                  |
| `label / emptyLabel` | `string`                                  | `required / No items` | Nome da lista e fallback vazio.                                |

Coleção vertical com altura fixa de linha. Web renderiza a viewport mais overscan; NativeScript usa ListView com reciclagem. O slot padrão tipado recebe `{ item, index, itemKey }`; `empty` substitui o estado vazio. O método público `scrollToIndex(index)` rejeita índices inválidos. Use substituição imutável do array ou itens reativos. Chaves ausentes/duplicadas falham cedo; números e strings mantêm identidades distintas. Inserções, remoções, ordenação e filtros preservam a primeira chave visível e o deslocamento dentro da linha na Web e no NativeScript. Se essa chave for removida, o índice sobrevivente mais próximo vira a âncora; a posição respeita os limites da rolagem.

Mantenha drafts, seleção e carregamento no item ou em store pela chave. Estado local da célula não sobrevive à desmontagem; no nativo o filho com chave é recriado ao reciclar para outro item. Na Web a linha focada continua montada ao rolar e, se removida, o foco retorna à lista. Não há promessa de preservar foco de editores nativos arbitrários fora da viewport. Escolha rowHeight que comporte texto e fonte de acessibilidade; altura variável, paginação, arrastar para reordenar e restauração automática entre rotas ficam fora deste primeiro contrato. Dê à lista uma viewport limitada e evite colocá-la dentro de outro scroller vertical. SSR renderiza a mesma janela inicial limitada e hidrata sua posição.

### Mudanças por chave com Jolt

A próxima release usa `listChanges` do Jolt RC.15 nas mudanças dos dados. Linhas visíveis mantidas vão para suas novas posições, itens novos visíveis entram e itens visíveis removidos podem sair por cópias visuais limitadas e sem interação. Linhas que chegam à viewport pela rolagem comum não repetem animação de entrada. O `MVirtualList` controla esse movimento: não aplique também `animateLayout` ou outro controlador `listChanges` nas mesmas linhas.

Use `:animated="false"` para atualizar a apresentação imediatamente, preservando as chaves e a âncora de rolagem. Movimento reduzido também finaliza imediatamente. A reciclagem limpa o movimento do item anterior antes de reutilizar a linha; ocultar/desmontar a lista libera o controlador e as cópias de saída. O estado que precisa sobreviver continua nos dados ou numa store por chave.

Numa tela compartilhada para o destino experimental Mac, a lista constrói as mesmas linhas da Web, a área visível mais `overscan`, num scroll view do SwiftUI, e uma referência de lista oferece `scrollToIndex`. O Mac ainda não gera esse movimento de alterações por chave; passar `animated` explicitamente (true ou false) gera um diagnóstico do compilador em vez de ignorar a opção. Omitir a propriedade mantém a lista Mac atual. Veja [Listas longas, cabeçalhos que recolhem e atualização](../guide/macos-experimental#listas-longas-cabecalhos-que-recolhem-e-atualizacao) no guia do Mac.

<<< @/../examples/catalog/shared/demos/VirtualListDemo.vue
