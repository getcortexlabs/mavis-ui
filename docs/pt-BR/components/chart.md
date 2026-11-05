---
title: Chart
---

# Chart

::: info Adicionado na alpha.11
Incluído no Mavis 0.1.0-alpha.11 para Vue + Vite, Nuxt e NativeScript iOS/Android. Mantenha core e renderizadores na mesma versão.
:::

<ComponentPreview component="chart" :height="1000" />

```vue
<MChart v-model="selection" v-model:hiddenSeries="hidden" :categories="days" :series="series" label="Activity" type="line" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `categories / series` | `readonly ChartCategory[] / readonly ChartSeries[]` | required | Chaves e rótulos estáveis; cada série tem um número finito ou null por categoria. |
| `type / height` | `line or bar / number` | line / 240 | Tipo e altura (120–800 px/DIP). Até 100 categorias e 8 séries. |
| `domain` | `readonly [number, number]` | automatic | Limites finitos crescentes contendo todos os valores. Domínio automático inclui zero. |
| `modelValue / hiddenSeries` | `ChartSelection or null / readonly ChoiceValue[]` | null / [] | Seleção por chaves { category, series } e visibilidade da legenda controlada. |
| `formatValue / showData` | `function / boolean` | string / false | Formatação e expansão inicial dos dados textuais. |
| `label / description / categoryLabel / seriesLabel` | `string` | see source | Título, contexto e rótulos de seleção acessíveis. |
| `showDataLabel / hideDataLabel / emptyLabel / missingLabel / clearLabel` | `string` | English labels | Ações e estados vazios/ausentes localizáveis. |

Gráficos categóricos de linhas e barras agrupadas compartilham geometria normalizada. Null cria uma lacuna, nunca zero inventado. Valores negativos usam uma linha de zero comum; ocultar séries preserva o domínio. Web usa SVG; nativo usa formas nativas limitadas, sem WebView. Toque/clique escolhe a série próxima, e seletores rotulados oferecem alternativa em todas as plataformas. Mostrar dados expõe todos os valores, inclusive séries ocultas. Jolt anima entrada/substituição do gráfico; não promete interpolação de valores/eixos. Cores são hex de seis dígitos ou do tema; rótulos e valores complementam a cor. Esta versão não inclui eixos temporais, zoom, empilhamento, gráficos financeiros ou telemetria ilimitada.

Eventos: `update:modelValue(ChartSelection or null)`, `update:hiddenSeries(ChoiceValue[])`.

<<< @/../examples/catalog/shared/demos/ChartDemo.vue
