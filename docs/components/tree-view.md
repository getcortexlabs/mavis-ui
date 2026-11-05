---
title: TreeView
---

# TreeView

::: info Added in alpha.11
Included in Mavis 0.1.0-alpha.11 for Vue + Vite, Nuxt and NativeScript iOS/Android. Keep core and renderers on the same version.
:::

<ComponentPreview component="tree-view" :height="850" />

```vue
<MTreeView v-model="selected" v-model:expanded="expanded" :nodes="nodes" label="Files" @load="loadChildren" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `nodes` | `readonly TreeNode[]` | `required` | key, label, disabled, children and hasChildren. |
| `modelValue / v-model` | `ChoiceValue or null` | `null` | Selected key, independent of expansion. |
| `expanded / v-model:expanded` | `readonly ChoiceValue[]` | `[]` | Expanded branch keys. |
| `loadingKeys` | `readonly ChoiceValue[]` | `[]` | Loading branches; prevents repeated requests while waiting. |
| `disabled / emptyLabel` | `boolean / string` | `false / No items` | Global disabled state and empty fallback. |

Keys are unique across the entire tree; cycles and depth over 100 are rejected. hasChildren with absent children emits load when expanded. The application fetches children, updates nodes and controls loadingKeys; use [] for an empty result. Requests, errors and cancellation belong to the application. Web provides roving tabindex, arrow navigation, Home/End, initial-letter search and Enter/Space; expansion arrows follow the left/right tree convention. Native exposes explicit expand/select actions. MReveal/Jolt animates expansion with reduced-motion support. Cascading selection and virtualization are not part of this version.

<<< @/../examples/catalog/shared/demos/TreeViewDemo.vue
