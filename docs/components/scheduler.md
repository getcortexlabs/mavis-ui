---
title: Scheduler
---

# Scheduler

::: info RC.12.1
Included in RC.12.1 for Vue + Vite, Nuxt and NativeScript.
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

| Prop                                  | Type                                  | Default             | Contract                                                                                                          |
| ------------------------------------- | ------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `modelValue / date / timeZone`        | SchedulerEvent[] / CivilDate / string | required            | Stable id/title and start/end epoch milliseconds; explicit IANA zone. Up to 500 events, maximum duration 31 days. |
| `days / startHour / endHour`          | 1\|7 / number / number                | 7 / 8 / 19          | Day/week view and ordered whole-hour bounds 0–24.                                                                 |
| `slotMinutes / hourHeight / dayWidth` | number                                | 15 / 80 / 180       | A 5–60 minute divisor of one hour; height 48–180 and width 140–500px/DIP.                                         |
| `disambiguation`                      | reject \| earlier \| later            | reject              | Repeated local times require explicit choice; nonexistent times are rejected.                                     |
| `animated / disabled`                 | boolean                               | true / false        | Jolt layout and editing lock. Events may be disabled individually.                                                |
| `label / id`                          | string                                | required / optional | Accessible component name and optional stable ID.                                                                 |

Overlapping events occupy separate lanes; multi-day events are clipped into daily segments. A text list exposes every event, including short/clipped entries, with zone offsets to distinguish repeated times. Select an event to move it by a slot/day or resize using explicit buttons. Large single-day segments expose move/resize gesture handles; short segments use the same explicit controls. Dragging is bounded to the visible day/hour range and snaps to slotMinutes. External model/date/zone changes cancel drafts. Moving preserves elapsed duration; resizing resolves the new wall time in the chosen zone. Intl is used on Web; native formatters on iOS/Android. Reduced motion disables decorative settling. No recurrence, resources, remote persistence, calendar sync or automatic conflict resolution is included.

`update:modelValue` → `SchedulerEvent[]`; `update:date` → `CivilDate`; `change` → `{id,start,end,kind}`; `select` → event ID; `error` → message.

Motion uses Jolt and respects reduced motion. Use `:animated="false"` for static presentation.

<<< @/../examples/catalog/shared/demos/SchedulerDemo.vue
