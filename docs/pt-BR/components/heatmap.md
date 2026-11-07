---
title: Heatmap
---

# Heatmap

::: info RC.12.1
Incluído na RC.12.1 para Vue + Vite, Nuxt e NativeScript.
:::

<ComponentPreview component="heatmap" :height="1100" />

```vue
<MHeatmap v-model="selected" :start="start" :end="end" :values="values" label="Practice" />
```

| Prop                                | Type                         | Default               | Contract                                                                                           |
| ----------------------------------- | ---------------------------- | --------------------- | -------------------------------------------------------------------------------------------------- |
| `start / end`                       | CivilDate                    | required              | Datas civis ISO inclusivas; intervalo de 1–366 dias. Sem conversão de fuso.                        |
| `values`                            | readonly HeatmapValue[]      | required              | Data única, valor finito não negativo ou null; label e disabled opcionais. Ausente difere de zero. |
| `modelValue`                        | CivilDate \| null            | null                  | Dia selecionado controlado.                                                                        |
| `colors / cellSize / weekStartsOn`  | string[] / number / 0\|1     | 5 colors / 40 / 1     | 2–8 cores HEX de seis dígitos, células de 28–80px/DIP, domingo ou segunda primeiro.                |
| `animated / disabled / formatValue` | boolean / boolean / function | true / false / String | Interpolação de cor Jolt, bloqueio de seleção e formatação do valor.                               |
| `label / id`                        | string                       | required / optional   | Nome acessível do componente e ID estável opcional.                                                |

As datas formam colunas semanais. Cada dia é um controle nomeado com seu valor exato; Ver dados expõe uma alternativa textual linear. As setas navegam por dia/semana, Home/End ao primeiro/último dia. A paleta inclui zero na primeira cor; valores ausentes ou null ficam sem preenchimento. Jolt interpola a cor enquanto os valores acessíveis são atualizados imediatamente. Movimento reduzido assenta imediatamente. Períodos longos rolam horizontalmente dentro do componente.

`update:modelValue` → `CivilDate`.

O movimento usa Jolt e respeita movimento reduzido. Use `:animated="false"` para apresentação estática.

<<< @/../examples/catalog/shared/demos/HeatmapDemo.vue
