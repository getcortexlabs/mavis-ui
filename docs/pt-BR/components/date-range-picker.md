---
title: Date Range Picker
description: Intervalos inclusivos de datas civis, rascunhos independentes e calendários temáticos.
---

# Date Range Picker

`MDateRangePicker` edita início e fim inclusivos pelo contrato de [Date Picker](./date-picker). Cada extremidade tem editor ISO com rótulo e calendário temático; o app não precisa compor inputs crus nem seletores nativos.

<ComponentPreview component="date-range-picker" :height="800" />

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { DateRange } from '@getcortexlabs/mavis-core'
const dates = ref<DateRange>({ start: null, end: null })
</script>

<template>
  <MDateRangePicker v-model="dates" label="Período da viagem" locale="pt-BR"
    initialMonth="2026-11" min="2026-11-01" max="2026-12-31"
    :unavailableDates="['2026-11-15']" />
</template>
```

As duas datas fazem parte do intervalo. Datas iguais representam um dia e são válidas. `{ start: null, end: null }` é vazio; qualquer extremidade pode permanecer nula durante a edição, e um par parcial válido é emitido com `complete: false`. O componente não inventa a extremidade ausente nem reordena um par invertido.

Cada rascunho permanece visível. Extremidade incompleta/inválida, `start > end` ou dia indisponível em qualquer ponto do intervalo inclusivo bloqueiam a proposta de modelo sem descartar rascunhos. Corrigir a outra extremidade pode tornar o par válido. Um par parcial valida a extremidade existente. A ação de limpeza esvazia ambos os rascunhos e propõe as duas extremidades nulas; apagar só um editor propõe um par parcial. Uma mudança externa substitui ambos. Propostas válidas rejeitadas voltam ao par do pai. A validação do app continua sendo a autoridade.

Valem as [opções e regras de Date Picker](./date-picker#api), exceto `name`. Props específicas:

| Prop | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `modelValue / v-model` | `DateRange` | `{ start: null, end: null }` | Duas extremidades `CivilDate \| null`. |
| `startLabel / endLabel` | string | traduzido `Início / Fim` | Rótulos das extremidades; incluem o rótulo visível do campo. |
| `startName / endName` | string | ausente | Nomes HTML Web separados; enviam cada rascunho. |

`update:modelValue` emite `DateRange`; `update:draft` emite `{ start: string, end: string }`. `validityChange` usa `DateValidation` e acrescenta `partial`, `reversed` e `unavailable-range`. Vazio e parcial são válidos, mas incompletos; o app pode exigir ambos. `focus()` foca o início e `blur()` encerra edição em qualquer extremidade. Eventos `focus` e `blur` vêm dos editores.

O destaque no calendário mostra um intervalo ordenado; não representa confirmação do host para um rascunho pendente. Selecionar no calendário altera a extremidade correspondente, executa a mesma validação da digitação e fecha aquele calendário. Escolher fim anterior ao início mantém ambos os rascunhos visíveis com erro e preserva o último modelo aceito.

O componente guarda datas civis, não diárias, durações, agendamentos ou instantes. Conversão para instantes e interpretação dos limites inclusivos pertencem ao app. Os locales gregorianos incorporados são `en-US` e `pt-BR`; ambos usam `YYYY-MM-DD` na edição.

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/DateRangePickerDemo.vue

</details>
