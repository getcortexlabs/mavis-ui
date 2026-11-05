---
title: Tooltip
---

# Tooltip

::: info Unreleased
Available in development source for Vue + Vite, Nuxt and NativeScript iOS/Android. Not yet published on npm.
:::

<ComponentPreview component="tooltip" :height="1000" />

```vue
<MTooltip triggerLabel="About this metric" text="Active members in the last seven days." />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text / triggerLabel` | `string` | required | Plain help text and an explicit accessible name for its information button. |
| `icon / variant` | `IconName / ButtonVariant` | info / ghost | Appearance of the component-owned trigger. |
| `placement` | `PopoverPlacement` | top-start | top-start, top-end, bottom-start or bottom-end; flips and clamps to available space. |
| `delay / disabled` | `number / boolean` | 350 / false | Web hover delay in milliseconds. Focus and touch do not wait. |

Web help opens on focus, hover or click, remains hoverable and closes on Escape without moving focus. Content is non-interactive. Native exposes the same help through an explicit labelled trigger and MPopover with system-back dismissal; it does not require long press. This component owns its trigger rather than wrapping an arbitrary control. Keep essential instructions visible in the form instead of relying only on a tooltip.

<<< @/../examples/catalog/shared/demos/TooltipDemo.vue
