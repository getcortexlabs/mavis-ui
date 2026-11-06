---
title: SwipeActions
---

# SwipeActions

::: info Added in RC.11.1
Included in Mavis 0.1.0-rc.11.1 for Vue + Vite, Nuxt and NativeScript iOS/Android. Keep core and renderers on the same version.
:::

<ComponentPreview component="swipe-actions" :height="850" />

```vue
<MSwipeActions
  v-model="side"
  label="Message"
  :start="favorites"
  :end="archive"
  @action="handleAction"
>
  <MText text="Weekend plans" />
</MSwipeActions>
```

| Prop                                   | Type                        | Contract                                                                                  |
| -------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| `modelValue`                           | `'start' \| 'end' \| null`  | Open side; default `null`.                                                                |
| `start / end`                          | `readonly SwipeAction[]`    | Actions with unique `value`, visible `label`, optional `icon`, `disabled`, `destructive`. |
| `actionWidth / direction`              | `number / 'ltr' or 'rtl'`   | `96 / ltr`. Width per action and logical reading direction.                               |
| `disabled / actionsLabel / closeLabel` | `boolean / string / string` | Disable input and localize controls.                                                      |

Drag horizontally to reveal actions. Jolt follows the gesture and settles the row; release velocity contributes to choosing a side. Swiping never executes an action automatically. The Actions menu exposes every action to keyboard and assistive input. Escape and Close actions return the row to rest. Supply `direction="rtl"` to mirror logical start/end.

The `action` event supplies the selected action. The application owns archiving/deletion and undo; the component closes after an action. Place one or two short actions per side so the row remains usable on narrow screens. Keep complex horizontal controls outside the swipe surface.

<<< @/../examples/catalog/shared/demos/SwipeActionsDemo.vue
