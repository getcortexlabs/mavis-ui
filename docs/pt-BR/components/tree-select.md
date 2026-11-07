---
title: TreeSelect
---

# TreeSelect

::: info Em desenvolvimento
Disponível neste PR para Vue + Vite, Nuxt e NativeScript. Ainda não incluído na RC.12 publicada.
:::

<ComponentPreview component="tree-select" :height="1100" />

```vue
<MTreeSelect
  v-model="selected"
  v-model:expanded="expanded"
  :nodes="nodes"
  multiple
  label="Disciplines"
/>
```

| Prop                             | Type                      | Default              | Contract                                                                                  |
| -------------------------------- | ------------------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| `nodes`                          | readonly TreeSelectNode[] | required             | ID único, label, children/disabled/selectable opcionais; até 2000 nós e 32 níveis.        |
| `modelValue / expanded`          | readonly string[]         | [] / []              | IDs selecionados e expandidos, ambos controlados. Seleção simples aceita no máximo um ID. |
| `multiple / disabled / animated` | boolean                   | false / false / true | Seleção múltipla, bloqueio de edição e layout Jolt.                                       |
| `label / id`                     | string                    | required / optional  | Nome acessível do componente e ID estável opcional.                                       |

A busca revela descendentes correspondentes e seus ancestrais sem alterar a expansão controlada. Pais desabilitados desabilitam seus descendentes. A seleção é explícita por nó, sem cascata nem estados parciais implícitos. IDs selecionados desconhecidos são preservados. Limpar remove apenas IDs habilitados e selecionáveis. Botões e checkboxes usam Tab, Enter e Espaço; Escape fecha o popover e devolve o foco ao acionador. Os rótulos dos controles são traduzíveis. Não inclui virtualização nem carregamento assíncrono da árvore.

`update:modelValue` → `string[]`; `update:expanded` → `string[]`.

O movimento usa Jolt e respeita movimento reduzido. Use `:animated="false"` para apresentação estática.

<<< @/../examples/catalog/shared/demos/TreeSelectDemo.vue
