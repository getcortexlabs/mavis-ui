---
title: SwipeDeck
---

# SwipeDeck

::: info Included in RC.12
Available in Mavis 0.1.0-rc.12 for Vue + Vite, Nuxt and NativeScript. Keep the Mavis packages at the same version.
:::

<ComponentPreview component="swipe-deck" :height="1100" />

```vue
<MSwipeDeck
  v-model="currentId"
  :items="cards"
  label="Discover"
  :canUndo="history.length > 0"
  @decide="history.push($event)"
  @undo="undo"
/>
```

| Prop                                                 | Type                     | Default      | Contract                                                              |
| ---------------------------------------------------- | ------------------------ | ------------ | --------------------------------------------------------------------- |
| `items`                                              | readonly SwipeCard[]     | required     | Unique id, title, optional description/image.                         |
| `modelValue`                                         | string \| number \| null | null         | Current card identity. null or a missing id displays the empty state. |
| `threshold / height`                                 | number                   | 90 / 340     | Swipe decision distance and card height in px/DIP.                    |
| `animated / disabled`                                | boolean                  | true / false | Exit/return motion and input availability.                            |
| `canUndo`                                            | boolean                  | false        | Enables the undo action; the application owns history.                |
| `acceptLabel / rejectLabel / undoLabel / emptyLabel` | string                   | English      | Localized actions and empty state.                                    |

Jolt owns dragging, spring return and the rotated exit. Buttons provide the same decisions without a gesture. decide({item, decision}) emits accept/reject; update:modelValue proposes the next item. Undo only emits undo; restore the previous id in your application. Rejected updates settle the same card. The item slot receives {item, index}; keep actions outside the drag surface.

<<< @/../examples/catalog/shared/demos/SwipeDeckDemo.vue
