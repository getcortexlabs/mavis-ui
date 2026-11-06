---
title: ColorPicker
---

# ColorPicker

::: info Incluído na RC.12
Disponível no Mavis 0.1.0-rc.12 para Vue + Vite, Nuxt e NativeScript. Mantenha os pacotes Mavis na mesma versão.
:::

<ComponentPreview component="color-picker" :height="1100" />

```vue
<MColorPicker v-model="color" label="Signature color" alpha />
```

| Prop                                                                                                   | Type              | Default      | Contrato                                                                  |
| ------------------------------------------------------------------------------------------------------ | ----------------- | ------------ | ------------------------------------------------------------------------- |
| `modelValue`                                                                                           | string            | #9C5270      | Entrada HEX ou RGB(A); eventos emitem #RRGGBB ou #RRGGBBAA em maiúsculas. |
| `alpha / animated`                                                                                     | boolean           | false / true | Canal alfa e transição opcional da prévia com Jolt.                       |
| `palette`                                                                                              | readonly string[] | six colors   | Cores HEX/RGB válidas, oferecidas como botões.                            |
| `disabled / readonly`                                                                                  | boolean           | false        | Impedem mudanças por campos, controles e paleta.                          |
| `colorLabel / hueLabel / saturationLabel / brightnessLabel / alphaLabel / paletteLabel / invalidLabel` | string            | English      | Rótulos e validação podem ser traduzidos.                                 |

Rascunhos inválidos ficam visíveis sem alterar o modelo. Sliders controlam HSV e opacidade; a matiz é preservada quando a saturação está zerada. A prévia grande anima um gradiente decorativo opaco; a cor canônica preserva o alfa. Não interpreta variáveis CSS arbitrárias.

<<< @/../examples/catalog/shared/demos/ColorPickerDemo.vue
