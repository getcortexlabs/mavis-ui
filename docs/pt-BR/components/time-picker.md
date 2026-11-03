---
title: TimePicker
---

# TimePicker

::: info Em desenvolvimento
Disponível neste PR; ainda não publicado no npm. A versão publicada continua sendo alpha.9.
:::

<ComponentPreview component="time-picker" :height="800" />

```vue
<MTimePicker v-model="time" label="Meeting time" min="08:00" max="18:00" :minuteStep="15" />
```

| Propriedade             | Tipo            | Padrão          | Descrição                                 |
| ----------------------- | --------------- | --------------- | ----------------------------------------- |
| `modelValue / v-model`  | `HH:mm / null`  | `null`          | Horário canônico sem data.                |
| `draft / v-model:draft` | `string`        | `—`             | Texto de edição opcional controlado.      |
| `label`                 | `string`        | `required`      | Rótulo visível.                           |
| `locale`                | `en-US / pt-BR` | `en-US`         | Ciclo de exibição padrão.                 |
| `hourCycle`             | `h12 / h23`     | `locale`        | Exibição explícita em 12/24 horas.        |
| `min / max`             | `HH:mm`         | `00:00 / 23:59` | Limites inclusivos no mesmo dia.          |
| `minuteStep`            | `number`        | `1`             | Divisor de 60 entre 1 e 30.               |
| `disabled / readonly`   | `boolean`       | `false`         | Bloqueia edição e abertura.               |
| `name`                  | `string`        | `—`             | Campo oculto Web envia o modelo canônico. |

O campo mostra h:mm AM/PM em en-US e HH:mm em pt-BR, salvo hourCycle explícito. Texto incompleto permanece visível sem substituir o último modelo válido. `validityChange` informa empty, valid, incomplete, invalid, range ou step; use para bloquear envio enquanto o texto for inválido. `update:draft`, `focus` e `blur` são compartilhados; os métodos públicos são `focus()`/`blur()`. Alterações no seletor são provisórias até Aplicar; Cancelar preserva o modelo. Web usa controles rotulados de hora/minuto/período; iOS e Android usam TimePicker do sistema dentro de MSheet. Limites e intervalo são validados antes de confirmar; rodas nativas podem mostrar um valor que não pode ser confirmado. `required` desabilita Limpar; a validação de negócio pertence ao app. Traduza rótulos de ações, campos e erro.

Um horário isolado não é um instante: este componente não aplica fuso nem horário de verão. Combine data civil, horário e fuso explícito no domínio antes de produzir um instante; depois use o helper existente `formatDateTime` para exibi-lo. `formatTime`, `parseTime` e `validateTime` formatam e validam o horário de modo determinístico nos renderizadores e no SSR. Limites min/max que atravessam a meia-noite são rejeitados.

<<< @/../examples/catalog/shared/demos/TimePickerDemo.vue
