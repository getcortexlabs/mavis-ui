---
title: SwipeDeck
---

# SwipeDeck

::: info Incluído na RC.12
Disponível no Mavis 0.1.0-rc.12 para Vue + Vite, Nuxt e NativeScript. Mantenha os pacotes Mavis na mesma versão.
:::

<ComponentPreview component="swipe-deck" :height="1100" />

```vue
<MSwipeDeck
  v-model="currentId"
  :items="cards"
  label="Discover"
  :canUndo="history.length > 0"
  @decide="history.push($event)"
  @undo="undo"
/>
```

| Prop                                                 | Type                     | Default      | Contrato                                                           |
| ---------------------------------------------------- | ------------------------ | ------------ | ------------------------------------------------------------------ |
| `items`                                              | readonly SwipeCard[]     | required     | Id único, título e descrição/imagem opcionais.                     |
| `modelValue`                                         | string \| number \| null | null         | Identidade do card atual. null ou id ausente exibe o estado vazio. |
| `threshold / height`                                 | number                   | 90 / 340     | Distância para decidir e altura do card em px/DIP.                 |
| `animated / disabled`                                | boolean                  | true / false | Movimento de saída/retorno e disponibilidade.                      |
| `canUndo`                                            | boolean                  | false        | Habilita desfazer; o histórico pertence à aplicação.               |
| `acceptLabel / rejectLabel / undoLabel / emptyLabel` | string                   | English      | Ações e estado vazio traduzíveis.                                  |

Jolt controla arraste, retorno com mola e saída rotacionada. Botões oferecem as mesmas decisões sem gesto. decide({item, decision}) emite accept/reject; update:modelValue propõe o próximo item. Desfazer só emite undo; restaure o id anterior na aplicação. Atualizações rejeitadas acomodam o mesmo card. O slot item recebe {item, index}; mantenha ações fora da superfície de arraste.

<<< @/../examples/catalog/shared/demos/SwipeDeckDemo.vue
