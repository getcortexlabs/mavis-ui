---
title: Scheduler
---

# Scheduler

::: info RC.12.1
Incluído na RC.12.1 para Vue + Vite, Nuxt e NativeScript.
:::

<ComponentPreview component="scheduler" :height="1100" />

```vue
<MScheduler
  v-model="events"
  v-model:date="date"
  timeZone="America/Sao_Paulo"
  label="Studio"
  :days="7"
/>
```

| Prop                                  | Type                                  | Default             | Contract                                                                                                                  |
| ------------------------------------- | ------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `modelValue / date / timeZone`        | SchedulerEvent[] / CivilDate / string | required            | ID/title estáveis e start/end em milissegundos de época; fuso IANA explícito. Até 500 eventos, duração máxima de 31 dias. |
| `days / startHour / endHour`          | 1\|7 / number / number                | 7 / 8 / 19          | Vista diária/semanal e limites inteiros ordenados de 0–24 horas.                                                          |
| `slotMinutes / hourHeight / dayWidth` | number                                | 15 / 80 / 180       | Divisor de uma hora de 5–60 minutos; altura 48–180 e largura 140–500px/DIP.                                               |
| `disambiguation`                      | reject \| earlier \| later            | reject              | Horários locais repetidos exigem escolha explícita; horários inexistentes são rejeitados.                                 |
| `animated / disabled`                 | boolean                               | true / false        | Layout Jolt e bloqueio de edição. Eventos podem ser bloqueados individualmente.                                           |
| `label / id`                          | string                                | required / optional | Nome acessível do componente e ID estável opcional.                                                                       |

Eventos sobrepostos ocupam faixas separadas; eventos de vários dias são divididos em segmentos diários. Uma lista textual expõe todos os eventos, inclusive curtos/recortados, com deslocamentos de fuso para distinguir horários repetidos. Selecione um evento para mover por intervalo/dia ou redimensionar com botões explícitos. Segmentos grandes de um único dia oferecem alças de movimento/redimensionamento; segmentos curtos usam os mesmos controles explícitos. O arraste fica limitado aos dias/horários visíveis e segue slotMinutes. Alterações externas de modelo/data/fuso cancelam rascunhos. Mover preserva a duração transcorrida; redimensionar resolve o horário local no fuso escolhido. Usa Intl na Web e formatadores nativos em iOS/Android. Movimento reduzido desliga a acomodação decorativa. Não inclui recorrência, recursos, persistência remota, sincronização de calendários ou resolução automática de conflitos.

`update:modelValue` → `SchedulerEvent[]`; `update:date` → `CivilDate`; `change` → `{id,start,end,kind}`; `select` → event ID; `error` → message.

O movimento usa Jolt e respeita movimento reduzido. Use `:animated="false"` para apresentação estática.

<<< @/../examples/catalog/shared/demos/SchedulerDemo.vue
