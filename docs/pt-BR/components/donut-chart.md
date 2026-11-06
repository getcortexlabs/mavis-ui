---
title: DonutChart
---

# DonutChart

::: info Incluído na RC.12
Disponível no Mavis 0.1.0-rc.12 para Vue + Vite, Nuxt e NativeScript. Mantenha os pacotes Mavis na mesma versão.
:::

<ComponentPreview component="donut-chart" :height="1000" />

```vue
<MDonutChart v-model="selected" :segments="segments" label="Hours" animateNumber />
```

| Prop | Type | Default | Contract |
| --- | --- | --- | --- |
| `segments` | readonly DonutSegment[] | required | ID único, rótulo, valor finito não negativo e cor HEX de seis dígitos opcional. Até 24. |
| `modelValue` | string or null | null | ID do segmento selecionado; selecionar novamente limpa. |
| `size / strokeWidth` | number | 220 / 12 | Diâmetro 100–800px/DIP, traço 1–20 na caixa de 100 unidades. |
| `animated / animateNumber / disabled` | boolean | true / false / false | Arcos Jolt, apresentação numérica opcional e bloqueio da seleção. |
| `formatValue / totalLabel / emptyLabel` | function / string / string | default / Total / No data | Formatação numérica pelo app e textos traduzíveis. |

Botões da legenda mostram valores exatos e percentuais arredondados imediatamente; o anel decorativo interpola com Jolt. IDs estáveis preservam a identidade dos segmentos. Valores todos zero mostram uma trilha vazia, sem divisão inválida. Arrays vazios são válidos. O centro mostra o valor selecionado ou total. O SVG SSR é legível antes da ativação; no nativo, o desenho usa camadas Jolt. Movimento reduzido aplica o resultado imediatamente.

`update:modelValue` → `string | null`.

<<< @/../examples/catalog/shared/demos/DonutChartDemo.vue
