---
title: ColorPicker
---

# ColorPicker

::: info Included in RC.12
Available in Mavis 0.1.0-rc.12 for Vue + Vite, Nuxt and NativeScript. Keep the Mavis packages at the same version.
:::

<ComponentPreview component="color-picker" :height="1100" />

```vue
<MColorPicker v-model="color" label="Signature color" alpha />
```

| Prop                                                                                                   | Type              | Default      | Contract                                                          |
| ------------------------------------------------------------------------------------------------------ | ----------------- | ------------ | ----------------------------------------------------------------- |
| `modelValue`                                                                                           | string            | #9C5270      | HEX or RGB(A) input; updates emit uppercase #RRGGBB or #RRGGBBAA. |
| `alpha / animated`                                                                                     | boolean           | false / true | Alpha channel and optional Jolt preview transition.               |
| `palette`                                                                                              | readonly string[] | six colors   | Valid HEX/RGB colors presented as selectable buttons.             |
| `disabled / readonly`                                                                                  | boolean           | false        | Prevent changes through every input and palette action.           |
| `colorLabel / hueLabel / saturationLabel / brightnessLabel / alphaLabel / paletteLabel / invalidLabel` | string            | English      | Labels and validation text can be localized.                      |

Invalid editor drafts stay visible without changing the model. Sliders operate on HSV and opacity; a remembered hue allows choosing a hue while saturation is zero. The large preview animates an opaque decorative gradient; the canonical color retains its alpha. Colors are not inferred from arbitrary CSS variables.

<<< @/../examples/catalog/shared/demos/ColorPickerDemo.vue
