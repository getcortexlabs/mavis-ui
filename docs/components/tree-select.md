---
title: TreeSelect
---

# TreeSelect

::: info In development
Available in this PR for Vue + Vite, Nuxt and NativeScript. Not included in the published RC.12.
:::

<ComponentPreview component="tree-select" :height="1100" />

```vue
<MTreeSelect
  v-model="selected"
  v-model:expanded="expanded"
  :nodes="nodes"
  multiple
  label="Disciplines"
/>
```

| Prop                             | Type                      | Default              | Contract                                                                                 |
| -------------------------------- | ------------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| `nodes`                          | readonly TreeSelectNode[] | required             | Unique id, label, optional children/disabled/selectable; up to 2000 nodes and 32 levels. |
| `modelValue / expanded`          | readonly string[]         | [] / []              | Selected IDs and expanded IDs, both controlled. Single mode accepts at most one ID.      |
| `multiple / disabled / animated` | boolean                   | false / false / true | Multiple choice, editing lock and Jolt layout.                                           |
| `label / id`                     | string                    | required / optional  | Accessible component name and optional stable ID.                                        |

Search reveals matching descendants with their ancestors, without changing the controlled expansion. Disabled parents disable their descendants. Selection is explicit per node, without cascading or implicit partial states. Unknown selected IDs are retained. Clearing removes only selectable, enabled IDs. Standard buttons and checkboxes support Tab, Enter and Space; Escape closes the popover and restores its trigger. All control labels are localizable. No virtualization or asynchronous tree loading is included.

`update:modelValue` → `string[]`; `update:expanded` → `string[]`.

Motion uses Jolt and respects reduced motion. Use `:animated="false"` for static presentation.

<<< @/../examples/catalog/shared/demos/TreeSelectDemo.vue
