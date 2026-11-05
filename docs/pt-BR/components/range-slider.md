---
title: RangeSlider
---

# RangeSlider

::: info Unreleased
Disponível no código em desenvolvimento para Vue + Vite, Nuxt e NativeScript iOS/Android. Ainda não publicado no npm.
:::

<ComponentPreview component="range-slider" :height="850" />

```vue
<MRangeSlider v-model="budget" :min="0" :max="1000" :step="25" label="Budget" />
```

| Prop | Type | Default | Descrição |
| --- | --- | --- | --- |
| `modelValue / v-model` | `readonly [number, number]` | `[0, 100]` | Par ordenado; marcadores não atravessam um ao outro. |
| `min / max / step` | `number` | `0 / 100 / 1` | Limites finitos e passo positivo; aceita decimais. |
| `lowerLabel / upperLabel` | `string` | `Minimum / Maximum` | Nome de cada extremo. |
| `formatValue` | `(number) => string` | `—` | Texto de apresentação; o modelo permanece numérico. |
| `disabled / readonly` | `boolean` | `false` | Impede alterações. |

Na Web, dois inputs range compartilham a faixa e mantêm foco e identidade independentes, inclusive quando coincidem. No nativo, marcadores de 48 DIP respondem a pan; campos MNumberInput rotulados oferecem ajuste preciso, teclado e leitor de tela. Jolt anima o feedback dos marcadores nativos. A orientação numérica da faixa é esquerda para direita. Os valores são arredondados ao passo e limitados; entradas não finitas, limites inválidos e pares invertidos são rejeitados.

<<< @/../examples/catalog/shared/demos/RangeSliderDemo.vue
