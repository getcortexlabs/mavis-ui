---
title: Calendar
---

# Calendar

::: info Added in alpha.11
Included in Mavis 0.1.0-alpha.11 for Vue + Vite, Nuxt and NativeScript iOS/Android. Keep core and renderers on the same version.
:::

<ComponentPreview component="calendar" :height="850" />

```vue
<MCalendar v-model="dates" mode="range" label="Your next escape" initialMonth="2026-11" locale="en-US" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue / v-model` | `CivilDate or DateRange or null` | `null` | ISO date in single mode, start/end object in range mode. |
| `mode` | `single or range` | `single` | Single date or inclusive range. |
| `min / max / unavailableDates` | `CivilDate / CivilDate / readonly CivilDate[]` | `— / — / []` | Bounds and unavailable dates. |
| `initialMonth / locale / firstDayOfWeek` | `string / en-US or pt-BR / number` | `2000-01 / en-US / locale` | Deterministic empty month; no implicit clock access. |
| `disabled / readonly` | `boolean` | `false` | Prevents selection; readonly permits month browsing. |

Inline calendar using the same civil-date arithmetic as the date pickers. Dates are not timestamps and no timezone is applied. The first click sets start; the second completes the range and may precede start. A range spanning an unavailable date emits invalid and preserves the first endpoint. Clicking after a complete range starts a new one. Mounting never steals focus. Web provides one Tab stop, arrows, Home/End and PageUp/PageDown; native uses buttons and horizontal scrolling for large text. Use footer for a legend or actions.

<<< @/../examples/catalog/shared/demos/CalendarDemo.vue
