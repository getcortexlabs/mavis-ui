---
title: Date Picker
description: Gregorian civil-date editing and a themed calendar, shared by Vue Web and NativeScript.
---

# Date Picker

`MDatePicker` combines a labelled text editor with a themed calendar in [Sheet](./sheet). The value is a Gregorian **civil date**, such as `2026-11-12`, independent of any time, timestamp or time zone.

<ComponentPreview component="date-picker" :height="760" />

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { CivilDate, InputHandle } from '@getcortexlabs/mavis-core'
const date = ref<CivilDate | null>(null)
const field = ref<InputHandle>()
</script>

<template>
  <MScreen scroll>
    <MDatePicker ref="field" v-model="date" label="Workshop date"
      locale="en-US" initialMonth="2026-11"
      min="2026-11-01" max="2026-12-31"
      :unavailableDates="['2026-11-15']"
      helperText="Enter YYYY-MM-DD or choose a calendar day." />
  </MScreen>
</template>
```

Direct components come from `@getcortexlabs/mavis-web` or `@getcortexlabs/mavis/vue`; plugin registration supports the same names. The consumer never needs raw native layouts or `DatePicker` tags.

## Values and drafts

`CivilDate` describes `YYYY-MM-DD`; runtime validation accepts only actual Gregorian dates in years `0001`–`9999`. `civilDate(string)` validates a value and throws for an invalid date; `isCivilDate(value)` provides a predicate. The TypeScript template type alone cannot prove that February has a given day.

`null` means empty. Clearing the editor or using the clear action proposes `null`. Typing a valid available date proposes that exact string. `update:draft` reports every user edit as a string, including empty, incomplete and invalid text. A valid proposal remains controlled: if the parent rejects it, the editor returns to the parent value. Incomplete, malformed and unavailable drafts remain visible and never replace the model. A changed external model replaces the draft; constraint changes preserve it.

The default parsing grammar is exact ISO order. `02/03/2026`, whitespace, short month/day numbers, date-times and `Date` instances are rejected. Changing locale alone does not change the default parsing grammar. The source-only dateFormat option below explicitly selects another numeric grammar. No component operation constructs a `Date`, reads today's date or converts through UTC. Store the string directly. Associating it with a local time, IANA time zone or instant is a separate, explicit application operation.

`validityChange` emits `{ valid, complete, reason }` when validity changes. Empty is valid but incomplete; required-field rules belong to the app. Invalid drafts use `incomplete`, `invalid`, `before-min`, `after-max` or `unavailable`. A complete date can be unavailable. Built-in error text appears for a complete malformed/unavailable draft or after blur; the `error` prop takes precedence. Applications should gate submission using their own rules plus draft validity, rather than assuming the last valid model is the current edit.

## API

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `modelValue / v-model` | `CivilDate \| null` | `null` | Controlled civil date. |
| `label` | string | required | Visible editor label and calendar title; cannot be blank. |
| `helperText / error` | string | `''` | Supporting text and application validation message. |
| `min / max` | `CivilDate` | unset | Inclusive limits. An invalid boundary or `min > max` throws. |
| `unavailableDates` | `readonly CivilDate[]` | `[]` | Exact unavailable dates; no callback or implicit weekday rule. |
| `dateFormat` | `iso / locale / yyyy-MM-dd / dd/MM/yyyy / MM/dd/yyyy` | `iso` | Source-only numeric editor format; models remain ISO civil dates. |
| `locale` | `'en-US' \| 'pt-BR'` | `'en-US'` | Explicit built-in Gregorian labels and validation text. |
| `firstDayOfWeek` | integer `0`–`6` | locale default (`0`) | Sunday is `0`, Monday is `1`. |
| `initialMonth` | `YYYY-MM` string | `'2000-01'` | Deterministic empty-calendar snapshot; never inferred from device time. |
| `disabled / readonly` | boolean | `false` | Block editing, clear and calendar; close an open calendar. |
| `clearable` | boolean | `true` | Show the explicit clear action. |
| `calendarLabel / clearLabel / closeLabel` | string | localized | Action names. The calendar name includes the field label. |
| `name` | string | unset | Web text field's HTML name; ignored natively. |
| `id / width / grow / shrink / accessibilityHidden` | shared props | shared defaults | Editor identity, layout and visibility. |

Events: `update:modelValue(CivilDate | null)`, `update:draft(string)`, `validityChange(DateValidation)`, `focus()` and `blur()`. Opening, cancelling and navigating the calendar do not propose a model. Choosing a date closes it. `focus()` and `blur()` are exposed with the same `InputHandle` contract as [Input](./input), including inferred component refs.

A new min/max or unavailable list never clamps the model, clears a draft or chooses a fallback. The visible error and available calendar days update; the calendar cursor clamps to current bounds. Earlier events recheck the live constraints. Externally supplied, well-formed values outside the limits remain visible with an error. Invalid model strings fail immediately.

## Calendar and keyboard

The calendar opens at a valid draft, otherwise `min`, otherwise `initialMonth`, clamped to min/max. On the Web, focus starts on that day. Arrow keys move by a day or week; Home/End reach the current week's edges; Page Up/Down move a month; Shift + Page Up/Down move a year. Month/year movement keeps the day when possible and clamps at month ends and bounds. Left/Right follow RTL. Navigation never commits. Enter/Space or pointer activation selects an available day. Unavailable days remain reachable for inspection, with `aria-disabled`, and cannot commit. The month header announces changes; full weekday names accompany abbreviations. Tab stays inside the Sheet; Escape, backdrop and close cancel, restoring the opener.

NativeScript uses a text keyboard that can enter digits and hyphens, plus themed native calendar buttons. Opening dismisses text editing; closing restores the calendar opener without deliberately reopening the text keyboard. Native hardware navigation follows native button focus. The native grid can scroll horizontally so seven columns retain their touch targets and grow with large text. Its parent Sheet scrolls vertically. Web calendars also permit horizontal scrolling on narrow screens. The calendar does not use the system's wheel or date picker: this choice preserves theme, blocked-day behavior and exact civil-date semantics across both renderers. Native accessibility labels include the full date and selected value; this is not a claim of identical screen-reader behavior on every device.

Declare native pickers inside `MScreen`, which owns the Sheet layer. The [Sheet hosting and transformed-ancestor boundaries](./sheet) apply. Unloading/unmounting closes the picker. Range entry uses [Date Range Picker](./date-range-picker).

## SSR, hydration and forms

The server and client must receive the same `locale`, `firstDayOfWeek`, model and initial month. Built-in names and pure Gregorian arithmetic produce a stable SSR/SSG snapshot without host locale, clock or time zone. Empty server output contains a closed calendar. Web text edits made before hydration are adopted through Input's existing hydration contract, including incomplete drafts; adopting a valid edit still proposes a controlled model update.

HTML names submit the visible **draft string**, including an invalid draft. They are not hidden canonical-value fields. Apply application validation before submission. Native submission belongs to the app. HTML reset follows Input's controlled reset behavior; change your models explicitly in the reset handler.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/DatePickerDemo.vue

</details>

## Restore an unfinished edit

`draft` controls the visible text independently of the valid `modelValue`. Use `v-model:draft` with a string for DatePicker or `{ start: string, end: string }` for DateRangePicker. An incomplete value such as `2026-11-` can be saved and restored without inventing a valid date. Calendar selection/clear propose both draft and model updates; bind both when the app owns both. If a draft update is rejected, the editor returns to the supplied draft on the next render. Omitting `draft` preserves the uncontrolled editing behavior.

```vue
<m-date-picker v-model="date" v-model:draft="draft" label="Date" />
```

Web SSR renders the text editor immediately, with calendar/clear actions disabled until mounting. Hydration enables those actions. The calendar action takes focus before opening, so closing the calendar returns focus consistently, including Safari. No consumer DOM directive or mount-only button wrapper is needed.

## Localized editing and instant formatting

**Source development; not in alpha.8.** The calendar action is embedded in the input, centered on the editor independently of labels, help and validation messages. Both date pickers support `dateFormat`: `iso` (default), `locale` (DD/MM/YYYY for pt-BR, MM/DD/YYYY for en-US), `yyyy-MM-dd`, `dd/MM/yyyy` or `MM/dd/yyyy`. These are the supported exact numeric patterns, not arbitrary formatter tokens. Leading zeros and four-digit years are required; no ambiguous grammar is guessed. Existing ISO consumers keep their behavior.

```vue
<MDatePicker v-model="date" v-model:draft="draft" label="Date"
  locale="pt-BR" dateFormat="locale" />
```

The editor shows `03/11/2026`; its model remains `2026-11-03`. Drafts and named HTML form fields contain the displayed text. Validation, limits and calendar selection use canonical civil dates. Changing format/locale reformats complete uncontrolled drafts and preserves incomplete text. A controlled draft remains application-owned; update it explicitly when changing its format. Server and client must use the same format and locale.

For instants, import the separate formatter:

```ts
import { formatDateTime, dateTimeToCivilDate } from '@getcortexlabs/mavis-web/date-format'
// NativeScript: '@getcortexlabs/mavis/date-format'

const instant = new Date('2026-11-03T01:30:00Z')
formatDateTime(instant, {
  locale: 'pt-BR', timeZone: 'America/Sao_Paulo', dateStyle: 'short',
}) // date in São Paulo: 02/11/2026 (native punctuation/year width can vary)
dateTimeToCivilDate(instant, { timeZone: 'America/Sao_Paulo' }) // '2026-11-02'
```

The helper accepts a valid Date or epoch milliseconds and requires an explicit IANA `timeZone` or `UTC`. It rejects ambiguous strings and unknown zones. `locale` defaults to en-US. `dateStyle` and `timeStyle` accept short, medium, long or full; omitted together they default to medium date plus short time. Supplying just one renders only that part. Web/SSR uses Intl.DateTimeFormat, iOS NSDateFormatter and Android DateFormat with a Gregorian calendar. OS locale and timezone databases control punctuation and daylight-saving rules; output text is not a storage format and need not be byte-identical across platforms. No dependency or timezone database is bundled.

Use `dateTimeToCivilDate` only when explicitly converting an instant to a calendar day. A picker value already is a day and does not accept timeZone or shift through UTC. No inverse conversion from a local day/time to an instant is implied.
