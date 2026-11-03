---
title: Popover
---

# Popover

::: info In development
Available in this PR; not yet published to npm. The published baseline remains alpha.9.
:::

<ComponentPreview component="popover" :height="800" />

```vue
<MPopover v-model:open="open" label="Filters" triggerLabel="Filters">…</MPopover>
```

| Property               | Type                                              | Default        | Description                                               |
| ---------------------- | ------------------------------------------------- | -------------- | --------------------------------------------------------- |
| `open / v-model:open`  | `boolean`                                         | `false`        | App-owned visibility.                                     |
| `label / triggerLabel` | `string`                                          | `required`     | Accessible panel name and visible trigger text.           |
| `placement`            | `bottom-start / bottom-end / top-start / top-end` | `bottom-start` | Preferred anchor alignment; flips and clamps when needed. |
| `width`                | `number`                                          | `280`          | Preferred CSS-pixel/DIP panel width.                      |
| `padding`              | `token / number`                                  | `md`           | Panel spacing.                                            |
| `disabled`             | `boolean`                                         | `false`        | Prevents opening and requests closure.                    |

An anchored surface for filters and small forms. The component owns its trigger, positioning and return focus. The default slot receives `close()`. `update:open` requests visibility changes; `close(reason)` identifies trigger, outside, Escape, Android back, selection or programmatic requests. `opened` runs after presentation. Web follows anchor/viewport size, scroll and RTL; native dismisses on ancestor scrolling. Escape/outside interaction closes the surface; native Android back participates in the installed navigation back claimant. Native requires an `MScreen` ancestor. Panels stay within the safe viewport; use Sheet for a long or full-screen workflow. Popover is nonmodal on Web; native presents a modal accessibility layer over its screen. Web Tab can leave the panel. Open panels are deferred until client mount during SSR. Theme and dependency injections remain those of the declaration.

<<< @/../examples/catalog/shared/demos/PopoverDemo.vue
