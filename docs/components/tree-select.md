---
title: TreeSelect
---

# TreeSelect

::: info RC.12.1
Included in RC.12.1 for Vue + Vite, Nuxt and NativeScript.
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
| `multiple / disabled / animated` | boolean                   | false / false / true | Multiple choice, editing lock and Jolt entry fades.                                      |
| `label / id`                     | string                    | required / optional  | Accessible component name and optional stable ID.                                        |

Search reveals matching descendants with their ancestors, without changing the controlled expansion. Disabled parents disable their descendants. Selection is explicit per node, without cascading or implicit partial states. Unknown selected IDs are retained. Clearing removes only selectable, enabled IDs. Standard buttons and checkboxes support Tab, Enter and Space; Escape closes the popover and restores its trigger. All control labels are localizable. No virtualization or asynchronous tree loading is included.

`update:modelValue` → `string[]`; `update:expanded` → `string[]`.

New rows fade in with Jolt while their controls stay in their final positions, so expanding or filtering never slides another option over a clickable target. Selection does not restart row motion. Use `:animated="false"` for static presentation.

<<< @/../examples/catalog/shared/demos/TreeSelectDemo.vue
