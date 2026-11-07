---
title: ImageCropper
---

# ImageCropper

::: info In development
Available in this PR for Vue + Vite, Nuxt and NativeScript. Not included in the published RC.12.
:::

<ComponentPreview component="image-cropper" :height="1100" />

```vue
<MImageCropper v-model="crop" :src="image" label="Cover" :aspectRatio="1" @export="saveExport" />
```

| Prop                   | Type                       | Default              | Contract                                                                                                      |
| ---------------------- | -------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src / modelValue`     | string / ImageCrop \| null | required / null      | Decoded image and controlled crop {x,y,width,height,rotation}; coordinates are pixels after quarter rotation. |
| `aspectRatio / output` | number / CropExportOptions | 1 / PNG, quality .92 | Aspect 0.1–10; output mimeType PNG/JPEG, quality 0–1 and optional width. Output dimensions 1–4096px.          |
| `animated / disabled`  | boolean                    | true / false         | Jolt settling and editing/export lock.                                                                        |
| `label / id`           | string                     | required / optional  | Accessible component name and optional stable ID.                                                             |

Drag to pan, pinch to zoom, or use the named direction buttons, zoom slider and 90° rotation button. Escape/pointer cancellation restores the uncommitted crop on Web. The model remains canonical; the app must accept emitted updates. A null model fits the source to the requested aspect. Clear modelValue when changing to an incompatible image/aspect. Web exports a PNG/JPEG data URI through Canvas; remote images must permit CORS. iOS/Android use native image drawing and export a temporary file. The export object includes uri, width, height, mimeType and async dispose(); the consumer owns the result and must call dispose() after using a native temporary file. At most 40 decoded megapixels. This is raster cropping, without filters, arbitrary angles or SVG editing. Loading/export failures emit error; stale loads and exports are released on source changes/deactivation. Native accessibility uses explicit buttons as gesture alternatives.

`update:modelValue` → `ImageCrop`; `export` → `CropExport`; `load` → `{width,height}`; `error` → `{stage,message}`. Exposed `export()` returns `Promise<CropExport | undefined>`.

Motion uses Jolt and respects reduced motion. Use `:animated="false"` for static presentation.

<<< @/../examples/catalog/shared/demos/ImageCropperDemo.vue
