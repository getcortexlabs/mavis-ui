---
title: Kanban
---

# Kanban

::: info Em desenvolvimento
Disponível nesta branch para Vue + Vite, Nuxt e NativeScript. Ainda não incluído no npm publicado.
:::

<ComponentPreview component="kanban" :height="1000" />

```vue
<MKanban v-model="cards" :columns="columns" label="Studio" :query="query" />
```

| Prop | Type | Default | Contract |
| --- | --- | --- | --- |
| `columns` | readonly KanbanColumn[] | required | ID único, título e limite inteiro positivo opcional. |
| `modelValue` | readonly KanbanCard[] | required | ID único, coluna, título e description/disabled opcionais. Metadados do consumidor são preservados. |
| `query` | string | '' | Filtra título/descrição sem remover cartões ocultos. |
| `animated / draggable / disabled` | boolean | true / true / false | Layout/acomodação Jolt, alça de arraste e bloqueio de edição. |
| `moveLabel / upLabel / downLabel / emptyLabel / fullLabel` | string | English | Rótulos dos controles e estados traduzíveis. |

As colunas empilham em contêineres estreitos e ficam lado a lado a partir de 760px/DIP. Arraste a alça para ordenar ou transferir; setas do teclado na alça, menu e botões de subir/descer oferecem alternativas. Colunas cheias rejeitam entradas, inclusive ao filtrar. Mudanças externas no modelo/filtro cancelam o arraste; atualizações controladas rejeitadas mantêm o modelo original. Sem virtualização (até 500 cartões / 12 colunas). O arraste usa destinos visíveis: use o menu para colunas distantes. O slot `card` recebe `{ card, column }`; persistência, edição e navegação pertencem ao app.

`update:modelValue` → `KanbanCard[]`; `move` → `{ id, from, to, before }`.

<<< @/../examples/catalog/shared/demos/KanbanDemo.vue
