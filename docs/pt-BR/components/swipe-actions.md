---
title: SwipeActions
---

# SwipeActions

::: info Adicionado na RC.11.1
Incluído no Mavis 0.1.0-rc.11.1 para Vue + Vite, Nuxt e NativeScript iOS/Android. Mantenha core e renderizadores na mesma versão.
:::

<ComponentPreview component="swipe-actions" :height="850" />

```vue
<MSwipeActions
  v-model="side"
  label="Message"
  :start="favorites"
  :end="archive"
  @action="handleAction"
>
  <MText text="Weekend plans" />
</MSwipeActions>
```

| Prop                                   | Tipo                        | Contrato                                                                       |
| -------------------------------------- | --------------------------- | ------------------------------------------------------------------------------ |
| `modelValue`                           | `'start' \| 'end' \| null`  | Lado aberto; padrão null.                                                      |
| `start / end`                          | `readonly SwipeAction[]`    | Ações com value única, label visível e icon, disabled e destructive opcionais. |
| `actionWidth / direction`              | `number / 'ltr' or 'rtl'`   | 96 / ltr. Largura por ação e direção lógica de leitura.                        |
| `disabled / actionsLabel / closeLabel` | `boolean / string / string` | Desativa a interação e traduz os controles.                                    |

Arraste horizontalmente para revelar ações. O Jolt acompanha o gesto e acomoda a linha; a velocidade de soltura ajuda a escolher o lado. Deslizar nunca executa uma ação automaticamente. O menu Ações expõe todas as opções ao teclado e à navegação assistiva. Escape e Fechar ações retornam ao repouso. `direction="rtl"` inverte os lados lógicos.

O evento `action` entrega a ação selecionada. A aplicação controla arquivamento, exclusão e desfazer; o componente fecha após uma ação. Use uma ou duas ações curtas por lado para preservar espaço em telas estreitas. Mantenha controles horizontais complexos fora da superfície de deslize.

<<< @/../examples/catalog/shared/demos/SwipeActionsDemo.vue
