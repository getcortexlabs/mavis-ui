---
title: ImageCompare
---

# ImageCompare

::: info Em desenvolvimento
Novo componente da próxima versão. Ainda não faz parte da versão alpha.11 publicada.
:::

<ComponentPreview component="image-compare" :height="850" />

```vue
<MImageCompare
  v-model="position"
  :before="original"
  :after="edited"
  label="Photo comparison"
  beforeLabel="Original"
  afterLabel="Edited"
/>
```

| Prop                                   | Tipo                                            | Contrato                                                       |
| -------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| `before / after`                       | `string`                                        | Fontes de imagem obrigatórias.                                 |
| `label / beforeLabel / afterLabel`     | `string`                                        | Nome da comparação obrigatório; rótulos padrão Before / After. |
| `modelValue / step`                    | `number`                                        | 50 / 1, limitado a 0–100.                                      |
| `aspectRatio / orientation / disabled` | `number / 'horizontal' or 'vertical' / boolean` | 1.5 / horizontal / false.                                      |

As imagens mantêm sua geometria completa: o divisor revela um recorte, sem espremer a imagem. Arrastar acompanha o gesto; botões ou mudanças externas do modelo animam a revelação por um valor numérico Jolt. Na Web, o slider aceita setas, Shift+setas, Home/End e PageUp/PageDown. No nativo, um slider acessível complementa o controle sobre a imagem. Cancelar restaura o valor inicial. Para antes/depois, use imagens com a mesma composição; imagens diferentes também permitem comparar alternativas. MImage fornece os estados de carregamento e erro.

<<< @/../examples/catalog/shared/demos/ImageCompareDemo.vue
