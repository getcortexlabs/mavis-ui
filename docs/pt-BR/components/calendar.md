---
title: Calendar
---

# Calendar

::: info Unreleased
Disponível no código em desenvolvimento para Vue + Vite, Nuxt e NativeScript iOS/Android. Ainda não publicado no npm.
:::

<ComponentPreview component="calendar" :height="850" />

```vue
<MCalendar v-model="dates" mode="range" label="Your next escape" initialMonth="2026-11" locale="en-US" />
```

| Prop | Type | Default | Descrição |
| --- | --- | --- | --- |
| `modelValue / v-model` | `CivilDate or DateRange or null` | `null` | Data ISO no modo single, objeto start/end no modo range. |
| `mode` | `single or range` | `single` | Seleção simples ou intervalo inclusivo. |
| `min / max / unavailableDates` | `CivilDate / CivilDate / readonly CivilDate[]` | `— / — / []` | Limites e dias indisponíveis. |
| `initialMonth / locale / firstDayOfWeek` | `string / en-US or pt-BR / number` | `2000-01 / en-US / locale` | Mês vazio determinístico; sem leitura implícita do relógio. |
| `disabled / readonly` | `boolean` | `false` | Bloqueia seleção; readonly permite explorar meses. |

Calendário embutido, com a mesma aritmética civil dos date pickers. Não converte datas em timestamps nem aplica fuso. O primeiro clique define start; o segundo completa o intervalo e pode preceder start. Intervalos que atravessam dias indisponíveis emitem invalid e preservam o início. Um clique após um intervalo completo inicia outro. Não toma foco ao montar. Web oferece uma parada de Tab, setas, Home/End e PageUp/PageDown; nativo oferece botões e rolagem horizontal para fontes grandes. Use footer para legenda e ações.

<<< @/../examples/catalog/shared/demos/CalendarDemo.vue
