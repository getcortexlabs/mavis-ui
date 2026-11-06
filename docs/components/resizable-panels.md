---
title: ResizablePanels
---

# ResizablePanels

::: info In development
New component for the next release. Not included in the published alpha.11 packages.
:::

<ComponentPreview component="resizable-panels" :height="850" />

```vue
<MResizablePanels v-model="split" label="Notebook layout" collapsible>
  <template #primary><Notes /></template>
  <template #secondary><Editor /></template>
</MResizablePanels>
```

| Prop                                                          | Type                                          | Contract                                                          |
| ------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| `modelValue / min / max`                                      | `number`                                      | First panel percentage: `40 / 20 / 80`.                           |
| `orientation / direction`                                     | `'horizontal' or 'vertical' / 'ltr' or 'rtl'` | `horizontal / ltr`.                                               |
| `height / step / snap`                                        | `number / number / readonly number[]`         | `360 / 2 / [25,50,75]`. Release within 3 percentage points snaps. |
| `collapsible / disabled`                                      | `boolean`                                     | Both `false`; collapsed first panel uses value `0`.               |
| `primaryLabel / secondaryLabel / collapseLabel / expandLabel` | `string`                                      | Localizable panel names and controls.                             |

The primary and secondary slots remain mounted when resizing, switching orientation or collapsing. Dragging updates immediately; programmatic changes, collapse and snap use a Jolt spring. Each panel scrolls independently. The controlled model owns persistence.

Web exposes a named separator with current bounds. Use arrows, Shift+arrows, Home/End; Enter toggles collapse when enabled. Pointer cancellation/Escape restores the gesture's original value. Native adds an accessible slider and explicit adjustment buttons alongside direct dragging. Reduced motion changes layout immediately. Two panels are supported; nested panel systems must manage their own minimum usable sizes.

<<< @/../examples/catalog/shared/demos/ResizablePanelsDemo.vue
