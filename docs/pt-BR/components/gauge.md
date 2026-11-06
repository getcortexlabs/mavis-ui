---
title: Gauge
---

# Gauge

::: info Em desenvolvimento
Disponível nesta branch para Vue + Vite, Nuxt e NativeScript. Ainda não incluído na versão npm publicada.
:::

<ComponentPreview component="gauge" :height="1100" />

```vue
<MGauge :value="balance" label="Weekly balance" suffix="%" semi animateNumber />
```

| Prop                           | Type                       | Default                 | Contrato                                                                |
| ------------------------------ | -------------------------- | ----------------------- | ----------------------------------------------------------------------- |
| `value / min / max`            | number                     | required / 0 / 100      | Intervalo finito; valor limitado tanto visualmente quanto na semântica. |
| `semi`                         | boolean                    | false                   | Usa semicírculo em vez de anel completo.                                |
| `size / strokeWidth`           | number                     | 220 / 7                 | Tamanho >= 80 px/DIP; espessura em unidades do viewBox, (0,18].         |
| `animated / animateNumber`     | boolean                    | true / false            | Interpolação do arco com Jolt; NumberFlow opcional.                     |
| `color / suffix / formatValue` | string / string / function | theme / empty / default | Cor, sufixo e formatação do valor canônico.                             |

O medidor expõe o valor final imediatamente enquanto Jolt anima strokeEnd. O backend compartilhado desenha arcos nativos e SVG na Web; o HTML do servidor inclui SVG estático. O valor textual permanece disponível independentemente do desenho decorativo. O componente mede um valor; use Progress para conclusão de tarefas.

<<< @/../examples/catalog/shared/demos/GaugeDemo.vue
