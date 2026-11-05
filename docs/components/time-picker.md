---
title: TimePicker
---

# TimePicker

::: info Alpha.10
Available in Mavis alpha.11 for Vue Web and NativeScript. Keep core and renderer versions aligned.
:::

<ComponentPreview component="time-picker" :height="800" />

```vue
<MTimePicker v-model="time" label="Meeting time" min="08:00" max="18:00" :minuteStep="15" />
```

| Property                | Type            | Default         | Description                                   |
| ----------------------- | --------------- | --------------- | --------------------------------------------- |
| `modelValue / v-model`  | `HH:mm / null`  | `null`          | Canonical wall-clock time.                    |
| `draft / v-model:draft` | `string`        | `—`             | Optional controlled editor text.              |
| `label`                 | `string`        | `required`      | Visible field label.                          |
| `locale`                | `en-US / pt-BR` | `en-US`         | Default display cycle.                        |
| `hourCycle`             | `h12 / h23`     | `locale`        | Explicit 12/24-hour display.                  |
| `min / max`             | `HH:mm`         | `00:00 / 23:59` | Inclusive same-day bounds.                    |
| `minuteStep`            | `number`        | `1`             | Divisor of 60 from 1 to 30.                   |
| `disabled / readonly`   | `boolean`       | `false`         | Prevents edits and picker opening.            |
| `name`                  | `string`        | `—`             | Web hidden field submits the canonical model. |

The editor displays h:mm AM/PM for en-US and HH:mm for pt-BR unless hourCycle is explicit. Incomplete text remains visible without replacing the last valid model. `validityChange` reports empty, valid, incomplete, invalid, range or step; use it to block application submission while a draft is invalid. `update:draft`, `focus` and `blur` are shared events; public handles provide `focus()`/`blur()`. Picker changes are provisional until Apply; Cancel leaves the model unchanged. Web uses labeled hour/minute/period controls; iOS and Android use the system TimePicker in MSheet. Bounds and interval are validated before confirmation; native wheels may show a value that cannot be confirmed. `required` disables Clear; business validation remains app-owned. Localize action, field and error labels.

A time alone is not an instant: there is no timezone or automatic DST conversion on this component. Combine a civil date, time and explicit timezone in your domain before producing an instant, and use the existing `formatDateTime` helper to display that instant. `formatTime`, `parseTime` and `validateTime` perform deterministic time-only formatting and validation on all renderers, including SSR. Overnight min/max ranges are rejected.

<<< @/../examples/catalog/shared/demos/TimePickerDemo.vue
