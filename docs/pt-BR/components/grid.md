---
title: Grid
description: Colunas de largura igual com espaçamento por tokens.
---

# Grid

**Incluído na alpha.10.** `MGrid` distribui colunas de largura igual na Web e no NativeScript. Mantém os filhos com chave montados quando o número de colunas muda.

<ComponentPreview component="grid" :height="370" />

```vue
<m-grid :columns="3" :min-column-width="180" gap="md">
  <m-card v-for="item in items" :key="item.id">{{ item.title }}</m-card>
</m-grid>
```

| Prop | Tipo | Padrão | Finalidade |
| --- | --- | --- | --- |
| `columns` | inteiro positivo | — | Número fixo de colunas; limite quando minColumnWidth está definido. |
| `minColumnWidth` | número positivo | — | Largura mínima desejada em pixels CSS na Web ou DIPs no NativeScript. |
| `gap` | token de espaço / número | `none` | Mesmo espaçamento horizontal e vertical. |

Sem os dois parâmetros de dimensionamento, há uma coluna. Com minColumnWidth, a quantidade acompanha a largura interna, descontando padding e espaços, com pelo menos uma coluna. Um contêiner menor que o mínimo usa uma célula que cabe no espaço disponível. `columns` limita essa quantidade. As propriedades comuns de Box, como width, padding e backgroundColor, também se aplicam.

SSR e a primeira renderização de hidratação usam columns, ou uma coluna quando omitido. A medição de largura atualiza o layout depois, preservando editores com chave. A Web usa CSS Grid; o NativeScript usa GridLayout com colunas star iguais e linhas de altura automática. Mantenha chaves estáveis nos filhos. É uma grade montada, sem virtualização, células que atravessam colunas ou masonry.

<<< @/../examples/catalog/shared/demos/GridDemo.vue
