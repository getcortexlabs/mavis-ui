---
title: Masonry
---

# Masonry

::: info RC.12.1
Incluído na RC.12.1 para Vue + Vite, Nuxt e NativeScript.
:::

<ComponentPreview component="masonry" :height="1100" />

```vue
<MMasonry
  :items="items"
  label="Inspiration"
  :columns="3"
><template #item="{ item }"><MCard><MText :text="item.id" /></MCard></template></MMasonry>
```

| Prop                       | Type                   | Default             | Contract                                                                                              |
| -------------------------- | ---------------------- | ------------------- | ----------------------------------------------------------------------------------------------------- |
| `items`                    | readonly MasonryItem[] | required            | ID único e estável e estimatedHeight opcional. Até 500 itens; metadados da aplicação são preservados. |
| `columns / minColumnWidth` | number                 | 4 / 220             | Máximo de 1–12 colunas e largura mínima >=40 pixels/DIP. Usa a largura disponível do contêiner.       |
| `gap / animated`           | Spacing / boolean      | md / true           | Espaçamento por token ou número e mudanças de layout com Jolt.                                        |
| `label / id`               | string                 | required / optional | Nome acessível do componente e ID estável opcional.                                                   |

O slot item recebe { item, index, width }. Cada item é medido e colocado na coluna mais curta, preservando a ordem lógica do DOM/nativo e a identidade estável. Leitura e teclado seguem a coleção original. Medidas tardias de imagens/fontes atualizam o layout. O SSR começa com uma coluna estimada, ajustada após a medição. Defina altura ou proporção das imagens para reduzir o movimento inicial. É uma coleção limitada e não virtualizada; use MVirtualList para listas longas. Mudanças de altura, filtros, reordenação e redimensionamento usam Jolt quando animated=true. Os observadores param ao desativar/desmontar.

`item` slot → `{ item, index, width }`.

O movimento usa Jolt e respeita movimento reduzido. Use `:animated="false"` para apresentação estática.

<<< @/../examples/catalog/shared/demos/MasonryDemo.vue
