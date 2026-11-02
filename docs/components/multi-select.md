---
title: MultiSelect
description: Several choices. One place.
---

# MultiSelect

Several choices. One place.

::: info Next release
Available from source after this PR. Not included in the published alpha.6.
:::

<ComponentPreview component="multi-select" />

```vue
<m-multi-select v-model="extras" :options="options" label="Extras" :maxSelected="2" />
```

Local search in a Sheet on both renderers. Every selected value must exist in options; filtering keeps selections. Remote pagination and virtualization are outside this control. Update options and selection consistently.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue / v-model` | `readonly ChoiceValue[]` | `[]` | Unique values controlled by the app. |
| `options` | `readonly ChoiceOption[]` | `required` | Local options with value, label and optional disabled state. |
| `label` | `string` | `required` | Visible label and Sheet title. |
| `maxSelected` | `number` | `—` | Positive selection limit. |
| `searchLabel / closeLabel / removeLabel` | `string` | `Search options / Done / Remove` | Action labels supplied by the app. |

<<< @/../examples/catalog/shared/demos/MultiSelectDemo.vue
