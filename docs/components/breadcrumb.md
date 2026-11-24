---
title: Breadcrumb
---

# Breadcrumb

::: info Added in alpha.11
Included in Mavis 0.1.0-alpha.11 for Vue + Vite, Nuxt and NativeScript iOS/Android. Keep core and renderers on the same version.
:::

<ComponentPreview component="breadcrumb" :height="1000" />

```vue
<MBreadcrumb :items="path" :maxItems="3" label="Breadcrumb" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `readonly BreadcrumbItem[]` | required | Unique key, label and ancestor href; navigate is optional. Last entry is the current page. |
| `maxItems` | `number` | 4 | At least two. Extra middle ancestors remain reachable through the expansion button. |
| `label / expandLabel` | `string` | Breadcrumb / Show full path | Localizable navigation and expansion labels. |

The last entry is text with current-page semantics. Ancestors are real MLink destinations. Expansion shows the entire path without a second navigation model, and resets when path identities change. Long paths wrap on narrow screens. Separators are decorative.

Events: `error(unknown)`.

<<< @/../examples/catalog/shared/demos/BreadcrumbDemo.vue
