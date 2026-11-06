---
title: TransferList
---

# TransferList

::: info Included in RC.12
Available in Mavis 0.1.0-rc.12 for Vue + Vite, Nuxt and NativeScript. Keep the Mavis packages at the same version.
:::

<ComponentPreview component="transfer-list" :height="1100" />

```vue
<MTransferList v-model="selectedIds" :options="options" label="Expedition kit" />
```

| Prop                                                                                 | Type                    | Default      | Contract                                                     |
| ------------------------------------------------------------------------------------ | ----------------------- | ------------ | ------------------------------------------------------------ |
| `options`                                                                            | readonly ChoiceOption[] | required     | Unique value, label and optional disabled.                   |
| `modelValue`                                                                         | readonly ChoiceValue[]  | []           | Selected identities; application owns acceptance of changes. |
| `animated / disabled`                                                                | boolean                 | true / false | Jolt list layout and input availability.                     |
| `availableLabel / selectedLabel / searchLabel / addLabel / removeLabel / emptyLabel` | string                  | English      | Panel names, filtering and movement actions.                 |

Checkboxes work with Tab/Space; movement has explicit buttons, so no dragging is required. Filtering preserves checked items: the action transfers all checked, enabled items on that side, including those hidden by the filter. Disabled items cannot move. Unknown selected ids are preserved for application-owned asynchronous catalogs. Both lists become columns below 620px/DIP.

<<< @/../examples/catalog/shared/demos/TransferListDemo.vue
