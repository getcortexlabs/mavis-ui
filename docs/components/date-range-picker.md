---
title: Date Range Picker
description: Inclusive civil-date ranges with independent drafts and two themed calendars.
---

# Date Range Picker

`MDateRangePicker` edits an inclusive start/end pair using the [Date Picker](./date-picker) contract. Each endpoint has a labelled editor (ISO by default) and a themed calendar; applications do not need to compose raw inputs or native pickers.

<ComponentPreview component="date-range-picker" :height="800" />

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { DateRange } from '@getcortexlabs/mavis-core'
const dates = ref<DateRange>({ start: null, end: null })
</script>

<template>
  <MDateRangePicker v-model="dates" label="Travel dates" locale="en-US"
    initialMonth="2026-11" min="2026-11-01" max="2026-12-31"
    :unavailableDates="['2026-11-15']" />
</template>
```

Both endpoints are included. Equal endpoints describe one day and are accepted. `{ start: null, end: null }` is empty; either endpoint may remain null while editing, and a valid partial pair is emitted with `complete: false`. The component does not invent a missing endpoint or silently reorder a reversed pair.

Each raw draft remains visible. An incomplete/invalid endpoint, `start > end`, or an unavailable day anywhere in the inclusive interval blocks the model proposal while preserving both drafts. Fixing the other endpoint can make the pair valid. A partial pair checks its existing endpoint. The clear action clears both drafts and proposes both endpoints as null; manually clearing just one editor proposes a partial pair. A changed external model replaces both drafts. Rejected valid proposals return to the parent's pair. Application validation remains authoritative.

All [Date Picker options and lifecycle rules](./date-picker#api) apply except `name`. Range-specific props are:

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `modelValue / v-model` | `DateRange` | `{ start: null, end: null }` | Two `CivilDate \| null` endpoints. |
| `startLabel / endLabel` | string | localized `Start / End` | Endpoint labels; the visible field label is included. |
| `startName / endName` | string | unset | Separate Web HTML names; submit each visible draft. |

`update:modelValue` emits a `DateRange`; `update:draft` emits `{ start: string, end: string }`. `validityChange` uses the same `DateValidation`, adding `partial`, `reversed` and `unavailable-range` reasons. Empty and partial ranges are valid but incomplete; an app can require both dates. `focus()` focuses the start editor and `blur()` dismisses either editor. The component also emits `focus` and `blur` from its text editors.

Calendar shading displays an ordered draft interval; it does not imply that a host accepted a pending draft. Calendar selection changes the endpoint whose calendar was opened, runs the same range validation as typing, and closes that calendar. If selecting an end before the start, both drafts stay visible with an error and the prior accepted model is preserved.

This component stores civil dates, not nights, durations, appointments or instants. Any conversion to instants or business interpretation of inclusive endpoints belongs to the host application. The built-in Gregorian locales are `en-US` and `pt-BR`; default parsing remains `YYYY-MM-DD` for both.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/DateRangePickerDemo.vue

</details>

## Restore an unfinished edit

`draft` controls the visible text independently of the valid `modelValue`. Use `v-model:draft` with a string for DatePicker or `{ start: string, end: string }` for DateRangePicker. An incomplete value such as `2026-11-` can be saved and restored without inventing a valid date. Calendar selection/clear propose both draft and model updates; bind both when the app owns both. If a draft update is rejected, the editor returns to the supplied draft on the next render. Omitting `draft` preserves the uncontrolled editing behavior.

```vue
<m-date-picker v-model="date" v-model:draft="draft" label="Date" />
```

Web SSR renders the text editor immediately, with calendar/clear actions disabled until mounting. Hydration enables those actions. The calendar trigger takes focus on primary mousedown before opening, so closing the calendar returns focus consistently, including Safari. No consumer DOM directive or mount-only button wrapper is needed.


Source development also supports `dateFormat` on both editors, with calendar actions embedded in each input. See [localized editing and timezone helpers](./date-picker#localized-editing-and-instant-formatting). Range models remain canonical civil dates; drafts retain their displayed format.
