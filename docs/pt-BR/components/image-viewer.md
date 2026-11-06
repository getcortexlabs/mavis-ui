---
title: ImageViewer
---

# ImageViewer

::: info Em desenvolvimento
Novo componente da próxima versão. Ainda não faz parte da versão alpha.11 publicada.
:::

<ComponentPreview component="image-viewer" :height="850" />

```vue
<MImageViewer v-model="photo" v-model:open="open" :images="images" label="Postcards" />
```

| Prop                                                                                            | Tipo                     | Contrato                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| `images`                                                                                        | `readonly ViewerImage[]` | Obrigatório. key única, src completo, alt descritivo; thumbnail, caption e aspectRatio opcionais. |
| `modelValue / open`                                                                             | `ChoiceValue / boolean`  | Seleção e apresentação controladas. Seleção removida usa a primeira imagem.                       |
| `maxZoom / disabled`                                                                            | `number / boolean`       | 4 / false. A escala de zoom começa em 1.                                                          |
| `closeLabel / previousLabel / nextLabel / zoomInLabel / zoomOutLabel / resetLabel / errorLabel` | `string`                 | Controles e mensagem de falha traduzíveis.                                                        |

Abra uma miniatura para acompanhá-la até a galeria. O shared layout do Jolt conecta as duas apresentações; o controlador de zoom cuida de pinça, arraste, toque duplo e fechamento vertical. Botões oferecem zoom, restauração e navegação sem exigir gestos. Ao fechar com zoom, a imagem retorna primeiro à escala de repouso.

Na Web, o dialog modal contém o foco, fecha com Escape e devolve o foco ao acionador. Na escala inicial, setas na imagem trocam fotos. Com zoom, as setas movem a imagem e Escape primeiro restaura o zoom; outro Escape fecha. +/− ajustam o zoom e 0 restaura. No nativo, use dentro de `MScreen`: sua camada controla a apresentação e o botão Voltar do Android. A transição conectada exige imagens na mesma página/janela e tem fallback quando a origem está indisponível, recortada ou não pode ser capturada. Não é uma transição entre rotas ou células recicladas.

Os eventos `update:modelValue`, `update:open`, `close` e `error` preservam o estado na aplicação. Zoom não modifica o arquivo da imagem.

<<< @/../examples/catalog/shared/demos/ImageViewerDemo.vue
