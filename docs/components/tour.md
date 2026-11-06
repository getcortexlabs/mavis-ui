---
title: Tour
---

# Tour

::: info In development
Available on this branch for Vue + Vite, Nuxt and NativeScript. Not yet in the published npm release.
:::

<ComponentPreview component="tour" :height="1100" />

```vue
<MTour v-model="step" :steps="steps" label="Getting started">
  <MTourTarget name="editor"><MInput v-model="name" label="Name" /></MTourTarget>
</MTour>
```

| Prop                                              | Type                | Default  | Contract                                                        |
| ------------------------------------------------- | ------------------- | -------- | --------------------------------------------------------------- |
| `steps`                                           | readonly TourStep[] | required | Unique id, title and description. id matches MTourTarget.name.  |
| `modelValue`                                      | string \| null      | null     | Current step id; null closes the tour.                          |
| `animated`                                        | boolean             | true     | Optional target instruction feedback, alongside Popover motion. |
| `nextLabel / backLabel / skipLabel / finishLabel` | string              | English  | Localized navigation actions.                                   |
| `MTourTarget.name`                                | string              | required | A unique target within the enclosing tour.                      |

Wrap existing content in MTourTarget; it remains mounted throughout the tour. Targets are explicit shared components, without document selectors. The active target gets an outline, is revealed in its scroll container and owns an anchored Popover. Missing targets emit missing(id) and propose the next registered step. finish(reason) distinguishes complete, skip, missing and Popover dismissal. Closing restores prior focus where the platform permits. Web is non-modal; native Popover uses its native overlay. No dimmed spotlight mask is implied.

<<< @/../examples/catalog/shared/demos/TourDemo.vue
