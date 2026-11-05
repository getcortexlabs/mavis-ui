---
title: Rating
---

# Rating

::: info Unreleased
Disponível no código em desenvolvimento para Vue + Vite, Nuxt e NativeScript iOS/Android. Ainda não publicado no npm.
:::

<ComponentPreview component="rating" :height="850" />

```vue
<MRating v-model="score" :step="0.5" label="How was your stay?" />
```

| Prop | Type | Default | Descrição |
| --- | --- | --- | --- |
| `modelValue / v-model` | `number` | `0` | Avaliação de zero até max. |
| `max / step` | `number / 1 or 0.5` | `5 / 1` | De uma a dez estrelas, inteiras ou meias. |
| `readonly / disabled` | `boolean` | `false` | Resumo sem controles ou controles indisponíveis. |
| `clearable / clearLabel` | `boolean / string` | `true / Clear rating` | Ação explícita para zerar. |
| `formatValue` | `(value, max) => string` | `—` | Texto da avaliação e nomes acessíveis. |

Estrelas acionáveis escolhem valores inteiros e recebem o feedback Jolt do MButton. Com step 0.5, um slider permite selecionar meias estrelas com toque, teclado ou leitor de tela. O modo readonly mostra os ícones e a descrição textual, sem ações. Valores são limitados e arredondados; use o modelo numérico, sem extrair texto dos ícones.

<<< @/../examples/catalog/shared/demos/RatingDemo.vue
