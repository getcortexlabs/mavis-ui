---
title: ImageViewer
---

# ImageViewer

::: info In development
New component for the next release. Not included in the published alpha.11 packages.
:::

<ComponentPreview component="image-viewer" :height="850" />

```vue
<MImageViewer v-model="photo" v-model:open="open" :images="images" label="Postcards" />
```

| Prop                                                                                            | Type                     | Contract                                                                                               |
| ----------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `images`                                                                                        | `readonly ViewerImage[]` | Required. Unique `key`, full `src`, descriptive `alt`; optional `thumbnail`, `caption`, `aspectRatio`. |
| `modelValue / open`                                                                             | `ChoiceValue / boolean`  | Controlled selection and presentation. Removed selection falls back to the first image.                |
| `maxZoom / disabled`                                                                            | `number / boolean`       | `4 / false`. Zoom range starts at 1.                                                                   |
| `closeLabel / previousLabel / nextLabel / zoomInLabel / zoomOutLabel / resetLabel / errorLabel` | `string`                 | Localizable controls and failure message.                                                              |

Open a thumbnail to follow it into the viewer. Jolt shared layout connects the two presentations; its zoom controller owns pinch, pan, double tap and vertical dismissal. Buttons provide zoom/reset/navigation without requiring a gesture. At zoom greater than 1, closing first returns to the resting scale. Rapid selection, interrupted closing and unloading release the previous controller.

Web uses a modal dialog with Escape, contained Tab navigation and return focus. At base scale, arrow keys on the image area change photos. While zoomed, Jolt uses arrows to pan and Escape first resets the zoom; another Escape closes. +/− zoom and 0 resets. Native uses the `MScreen` layer host and handles Android back. Keep the viewer inside an `MScreen` on NativeScript. Images must fit in one page/window for the connected transition; Jolt safely falls back when the source is unavailable, clipped or cannot be captured. No cross-route or recycled-cell return is claimed.

`update:modelValue`, `update:open`, `close` and `error` let the app own state and respond to unavailable images. Source values never change as a side effect of zoom.

<<< @/../examples/catalog/shared/demos/ImageViewerDemo.vue
