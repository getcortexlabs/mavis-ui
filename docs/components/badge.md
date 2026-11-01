---
title: Badge
description: Compact labels, counts and status on NativeScript and Web.
---

# Badge

`MBadge` adds context with text or a number: a category, a status or a count. It conveys information and has no built-in action.

::: info Next alpha
Available in the repository for the next alpha; not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="badge" :height="950" />

## Usage

```vue
<m-badge text="Published" tone="success" />
<m-badge :text="0" tone="accent" accessibilityLabel="0 unread messages" />
<m-badge text="99+" size="sm" accessibilityLabel="More than 99 messages" />
```

## Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `text` | `string \| number` | required | Content; zero is displayed. |
| `tone` | `neutral \| primary \| accent \| success \| warning \| danger` | `neutral` | Theme colors. |
| `size` | `sm \| md` | `md` | Text and spacing scale. |
| `accessibilityLabel` | `string` | — | Describes the count in context when needed. |
| `accessibilityHidden` | `boolean` | `false` | Hides redundant information. |
| `id` | `string` | — | Optional identifier. |

Primary and accent use their soft surfaces; neutral and semantic states use the elevated surface. Visible content should convey meaning without relying on color alone. Height follows text and long labels can wrap. Use a wrapping Row to allow a list of badges to continue on another line.

## State and composition

The app controls the value, translation, limits and formatting. `99+` is an app-selected string, not a component rule. There are no slots, events, close button, keyboard focus or automatic announcements on updates. Supply an app status region when an update needs to be announced.

`accessibilityLabel` can announce “3 unread ideas” while the count shows `3`. Web uses an image role with alternative text for that label; native exposes one named text element. Do not nest an interactive control inside a badge. For overlaid indicators, compose with Box and own the positioning in the app layout.

[Profile](../showcase/profile) uses Badge for the category and form editing state.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/BadgeDemo.vue

</details>
