---
title: DataTable
---

# DataTable

::: info Added in alpha.11
Included in Mavis 0.1.0-alpha.11 for Vue + Vite, Nuxt and NativeScript iOS/Android. Keep core and renderers on the same version.
:::

<ComponentPreview component="data-table" :height="850" />

```vue
<MDataTable :items="rows" :columns="columns" v-model:sort="sort" v-model:selected="selected" label="Collections" selectable />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items / itemKey` | `readonly object[] / string or function` | `required / id` | Current page and stable identity. |
| `columns` | `readonly DataColumn[]` | `required` | Key, label, width, alignment and optional value accessor. |
| `sort / v-model:sort` | `DataSort or null` | `null` | Cycles ascending, descending and unsorted; the application sorts the data. |
| `selected / v-model:selected` | `readonly ChoiceValue[]` | `[]` | Selected keys; selection on other pages is preserved. |
| `selectable / rowDisabled / rowLabel` | `boolean / function / function` | `false / — / —` | Optional selection, row availability and accessible row label. |
| `disabled / loading` | `boolean` | `false` | Prevent changes; loading presents a progress indicator. |

The table receives the current page. Sorting, filtering, requests and pagination belong to the application; place MPagination in footer. Slots cell and cell:key receive item, itemKey, column, value and index; actions and empty are also available. Web uses an HTML table with headers and aria-sort. Native columns scroll horizontally and cells retain their column labels. Numeric and string identities remain distinct. This is not an editable grid or virtualized list: paginate large datasets.

<<< @/../examples/catalog/shared/demos/DataTableDemo.vue
