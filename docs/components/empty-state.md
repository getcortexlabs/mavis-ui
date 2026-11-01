---
title: Empty State
description: An illustrated empty state with a title, guidance and app-owned recovery actions for NativeScript and Web.
---

# Empty State

`MEmptyState` gives an empty collection or search a clear explanation and a next action. The app decides when to show it.

::: info Next alpha
Available in the repository for the next alpha; not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="empty-state" :height="1000" />

## Usage

```vue
<m-empty-state title="Nothing saved yet."
  description="Keep a reading for later." icon="bookmark" tone="accent">
  <template #actions>
    <m-button @click="explore">Explore readings</m-button>
  </template>
</m-empty-state>
```

## Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `title` | string | required | Nonempty heading; blank/missing throws TypeError. |
| `description` | string | empty | Optional guidance below the title. |
| `icon` | IconName | inbox | Default illustration symbol. |
| `tone` | primary / accent | primary | Illustration palette. |
| `compact` | boolean | false | Smaller illustration, heading and spacing. |
| `titleAs` | h1 / h2 / h3 / h4 / h5 / h6 | h2 | Web heading level; native remains a header. |
| `width / grow / shrink` | dimension / number / number | auto / 0 / context | Layout participation. |
| `id / accessibilityHidden` | string / boolean | — / false | Identifier and accessibility exclusion. |

## Slots and behavior

`illustration` replaces the default artwork. It is always decorative and excluded from accessibility; put meaningful text in the title/description and interactive controls in `actions`. The default artwork uses themed shapes and an icon, without remote assets.

`actions` accepts buttons or other appropriate controls. They retain their own events, disabled/loading states and labels. Multiple actions wrap when necessary. There is no default slot and no component event.

Text and layout grow naturally, including long translations and larger system text on native. Use compact inside smaller sections. The component does not fetch data, infer loading/error states, announce updates, move focus or start motion automatically. Use Skeleton for loading, Alert for inline messages, and app-owned focus or live feedback when a changing result needs it.

[Library](../showcase/library) combines topic chips, search and empty saved readings with recovery actions.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/EmptyStateDemo.vue

</details>
