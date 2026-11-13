---
title: ResizablePanels
---

# ResizablePanels

::: info Adicionado na RC.11.1
Incluído no Mavis 0.1.0-rc.11.1 para Vue + Vite, Nuxt e NativeScript iOS/Android. Mantenha core e renderizadores na mesma versão.
:::

<ComponentPreview component="resizable-panels" :height="850" />

```vue
<MResizablePanels v-model="split" label="Notebook layout" collapsible>
  <template #primary><Notes /></template>
  <template #secondary><Editor /></template>
</MResizablePanels>
```

| Prop                                                          | Tipo                                          | Contrato                                                               |
| ------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| `modelValue / min / max`                                      | `number`                                      | Percentual do primeiro painel: 40 / 20 / 80.                           |
| `orientation / direction`                                     | `'horizontal' or 'vertical' / 'ltr' or 'rtl'` | horizontal / ltr.                                                      |
| `height / step / snap`                                        | `number / number / readonly number[]`         | 360 / 2 / [25,50,75]. Soltar a até 3 pontos percentuais faz o encaixe. |
| `collapsible / disabled`                                      | `boolean`                                     | Ambos false; o primeiro painel recolhido usa valor 0.                  |
| `primaryLabel / secondaryLabel / collapseLabel / expandLabel` | `string`                                      | Nomes dos painéis e controles traduzíveis.                             |

Os slots `primary` e `secondary` continuam montados ao redimensionar, trocar orientação ou recolher. O arraste responde imediatamente; mudanças programáticas, recolhimento e encaixe usam uma mola Jolt. Cada painel tem sua própria rolagem. O modelo controlado permite persistir a preferência na aplicação.

Na Web, o separador tem nome e limites acessíveis. Use setas, Shift+setas e Home/End; Enter alterna o recolhimento. Cancelamento do ponteiro/Escape restaura o valor anterior ao gesto. No nativo, um slider acessível e botões de ajuste complementam o arraste. Redução de movimento altera o layout imediatamente. São dois painéis; composições aninhadas devem manter tamanhos mínimos utilizáveis.

Numa tela compartilhada para o destino experimental Mac, o divisor segue o ponteiro e as mesmas teclas, com os mesmos passos, limites e snap, e o valor continua com a fonte. Veja [Masonry e painéis redimensionáveis](../guide/macos-experimental#masonry-e-paineis-redimensionaveis) no guia do Mac.

<<< @/../examples/catalog/shared/demos/ResizablePanelsDemo.vue
