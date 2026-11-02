---
title: Combobox
description: Controlled asynchronous single selection with separate search and selected value.
---

# Combobox

`MCombobox` searches for one option while keeping the edit query, highlighted result and committed value separate. Typing never commits an option. `MSelect` remains a non-searchable choice control.

::: info Unreleased
This component is not included in `0.1.0-alpha.4`.
:::

<ComponentPreview component="combobox" :height="760" />

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceOption, ChoiceValue, ComboboxSearch } from '@getcortexlabs/mavis-core'

const municipality = ref<ChoiceValue | null>(2611606)
const query = ref('Recife')
const selected = ref<ChoiceOption | null>({ value: 2611606, label: 'Recife' })
// The application supplies its own service. Keep credentials and services out of SSR payloads.
const search: ComboboxSearch = async (query, { limit, onCancel }) => {
  const controller = new AbortController()
  onCancel(() => controller.abort())
  const response = await fetch(
    `/api/municipalities?q=${encodeURIComponent(query)}&limit=${limit}`,
    {
      signal: controller.signal,
    },
  )
  if (!response.ok) throw new Error('Search failed')
  return response.json() // Validate your service's response before returning ChoiceOption[].
}
</script>

<template>
  <m-combobox
    v-model="municipality"
    v-model:query="query"
    :selectedOption="selected"
    :search="search"
    :initialResults="{ query: 'Recife', options: [{ value: 2611606, label: 'Recife' }] }"
    label="Municipality"
    @select="selected = $event"
  />
</template>
```

The URL above is an application example, not a Mavis service. On native, use your platform's transport and register its cancellation callback with `onCancel`. No browser `AbortController` is required by the shared contract.

## Controlled state

| Prop or event                                 | Contract                                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue` / `update:modelValue`            | `ChoiceValue \| null`. Numbers and strings are distinct IDs, including `1` and `'1'`. Defaults to `null`.                             |
| `query` / `update:query`                      | Required controlled string shown in the editor. Changes only request a search when accepted by the parent.                            |
| `selectedOption`                              | Optional retained `ChoiceOption` snapshot matching `modelValue`. Supply it for an initial/external selection outside the result page. |
| `select`                                      | Emits the requested result object, or `null` when the user requests Clear. The parent still owns acceptance.                          |
| `search`                                      | Required `(query, { requestId, limit, onCancel }) => Promise<readonly ChoiceOption[]>`.                                               |
| `initialResults`                              | Optional `{ query, options }` snapshot. Read at creation; no initial fetch.                                                           |
| `debounce`                                    | Integer delay in milliseconds, `0…60000`; default `200`.                                                                              |
| `minQueryLength`                              | Integer `0…1000`; default `1`. Uses trimmed length; the service receives the original string.                                         |
| `maxResults`                                  | Integer `1…100`; default `50`. Extra results are omitted with a refinement message.                                                   |
| `disabled`                                    | Blocks edits/actions, closes results and cancels pending work.                                                                        |
| `clearable`                                   | Defaults to `true`. The clear action requests `null` and an empty query.                                                              |
| `label`, `placeholder`, `helperText`, `error` | Named field, search hint and field validation message. `error` takes precedence over help.                                            |
| `focus`, `blur`                               | Events for editor focus. The component ref also exposes `focus()` and `blur()` as `InputHandle`.                                      |

Options use `ChoiceOption`: `{ value, label, helperText?, disabled? }`. Values must be strings or finite numbers, labels must be nonempty and duplicate typed values are rejected. Search does not accept arbitrary text as a selection. It does not change the selected value when results disappear. The latest known selected label remains available even when it is outside the current page; a separate caption shows it while a different query is being edited. Clear and external changes to `null` remove the selection.

A successful user selection requests both the value and its label as the new query. Escape cancels editing and requests the retained selected label, or an empty string for no selection. Blur closes the result presentation without committing or resetting the query. Parents can reject value or query requests independently; keep both bindings when normal editing is desired.

## Search lifecycle

Search starts on focus/open or on an accepted query change while open. A matching initial or last successful result page is reused on reopening. There is one retained result page, no global cache and no page merging. Retry bypasses debounce. Short queries show `idleText`; pending requests show `loadingText`; empty and failed results have separate presentations. A failed search never replaces the selection.

Changing query, starting IME composition, Clear, Escape, blur, disable, unload, route unmount and cached-view deactivation cancel pending timers and invoke host cancellation callbacks. Late success and failure are also rejected by request identity, including repeated queries and hosts that cannot abort. A host should release its own resources when its promise settles. Cancellation callbacks may be registered with `onCancel` even after an asynchronous setup step; already cancelled requests invoke them immediately. Do not serialize `search`, credentials or live transport handles; serialize only plain selection/query/result data.

`initialResults` supports SSR without running a loader. Hydration adopts text edited in the server-rendered field before client ownership, then asks the controlled parent to accept that query. An unchanged snapshot does not refetch. IDs derive from Vue's `useId`; retain the same initial tree and data on server/client.

Localize `clearLabel`, `closeLabel`, `loadingText`, `emptyText`, `searchErrorText`, `retryLabel`, `idleText` and `limitedText`. The public search error message is intentionally supplied by the application, rather than exposing transport exception strings.

## Interaction and limits

**Web:** an editable `role="combobox"` controls an anchored listbox popup with a scrollable viewport. The popup is mounted in its owning dialog, when present, or the document body, preserving modal ownership. Its position and height follow the available viewport; scroll/resize listeners are released on close. DOM focus stays in the editor; Up/Down move the highlighted option and skip disabled results. Enter commits the highlight, or retries an error. Enter without a highlight never implicitly submits the surrounding HTML form. Escape dismisses results and restores the selected label before an enclosing overlay handles another Escape. Home/End, Left/Right and text-selection shortcuts keep browser editing behavior. IME Enter never commits. Option identity survives replacement without forcing the highlight to a different result. The current committed option has a check mark; the keyboard highlight has a separate border/background. The browser interaction follows the [WAI-ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

**NativeScript:** the real native editor remains mounted, followed by bounded inline native choice controls. There is no nested Sheet. Results use the owning Screen/Sheet's scrolling; they do not have a second virtualized list. Tapping a result commits and dismisses editing. Return requests results, rather than selecting the first result automatically. Native editing/focus navigation remains platform-owned; the custom Web arrow-key interaction is not a native hardware-keyboard guarantee. Marked text/composing spans defer searches until composition completes. Close results cancels editing. Unload cancels the search and composition observer. Use a scrolling `MScreen` for long result pages; inside a Sheet, retain its existing owner and drag constraints.

This first version is single selection, one result page, at most 100 rendered choices. It does not implement infinite scrolling, pagination controls, virtualization, tags, arbitrary free text, multiple selection or custom option templates. Ask the host service to rank/filter and respect `limit`; refine the query for larger datasets. If a service truncates results itself, it owns any additional total-count message.

## Shared recipe

The demo uses an application-owned in-memory service with cancellable timers. Its switches trigger one failure or deliberately deliver obsolete short-query responses after newer results. These controls are for demonstrating host behavior; no external API or credentials are included.

<<< @/../examples/catalog/shared/demos/ComboboxDemo.vue
