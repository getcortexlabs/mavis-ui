---
title: ImageCropper
---

# ImageCropper

::: info Em desenvolvimento
Disponível neste PR para Vue + Vite, Nuxt e NativeScript. Ainda não incluído na RC.12 publicada.
:::

<ComponentPreview component="image-cropper" :height="1100" />

```vue
<MImageCropper v-model="crop" :src="image" label="Cover" :aspectRatio="1" @export="saveExport" />
```

| Prop                   | Type                       | Default              | Contract                                                                                                                        |
| ---------------------- | -------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src / modelValue`     | string / ImageCrop \| null | required / null      | Imagem decodificada e recorte controlado {x,y,width,height,rotation}; coordenadas em pixels após rotação de um quarto de volta. |
| `aspectRatio / output` | number / CropExportOptions | 1 / PNG, quality .92 | Proporção 0.1–10; mimeType PNG/JPEG, quality 0–1 e width opcional. Dimensões de saída entre 1–4096px.                           |
| `animated / disabled`  | boolean                    | true / false         | Acomodação Jolt e bloqueio de edição/exportação.                                                                                |
| `label / id`           | string                     | required / optional  | Nome acessível do componente e ID estável opcional.                                                                             |

Arraste para deslocar, faça pinça para ampliar ou use os botões direcionais, o slider de zoom e a rotação de 90°. Escape/cancelamento do ponteiro restaura o recorte não confirmado na Web. O modelo é canônico; a aplicação precisa aceitar as atualizações emitidas. Um modelo null encaixa a imagem na proporção solicitada. Limpe modelValue ao trocar para uma imagem/proporção incompatível. A Web exporta data URI PNG/JPEG via Canvas; imagens remotas precisam permitir CORS. iOS/Android desenham nativamente e exportam um arquivo temporário. O objeto exportado inclui uri, width, height, mimeType e dispose() assíncrono; o consumidor é dono do resultado e deve chamar dispose() após usar o arquivo temporário nativo. Limite de 40 megapixels decodificados. Recorte raster, sem filtros, ângulos arbitrários ou edição SVG. Falhas emitem error; carregamentos e exportações obsoletos são liberados ao trocar a origem/desativar. Botões explícitos oferecem alternativas aos gestos nativos.

`update:modelValue` → `ImageCrop`; `export` → `CropExport`; `load` → `{width,height}`; `error` → `{stage,message}`. Exposed `export()` returns `Promise<CropExport | undefined>`.

O movimento usa Jolt e respeita movimento reduzido. Use `:animated="false"` para apresentação estática.

<<< @/../examples/catalog/shared/demos/ImageCropperDemo.vue
