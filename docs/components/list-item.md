---
title: ListItem
description: Content rows with title, description, slots and an optional action on NativeScript and Web.
---

# ListItem

`MListItem` organizes a title, description and side content. Use informational rows for data, or `interactive` for one action across the whole surface.

::: info Next alpha
Available in the repository for the next alpha; not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="list-item" :height="950" />

## Usage

```vue
<m-list-item title="Marina Costa" description="Design · São Paulo" interactive
  accessibilityLabel="Open Marina Costa, Design, available" @click="openMember">
  <template #leading><m-avatar name="Marina Costa" :accessibilityHidden="true" /></template>
  <template #trailing><m-badge text="Available" tone="success" size="sm" /></template>
</m-list-item>
```

The app owns `openMember`. The row emits `click` without a payload; it does not choose a route, selection or opening policy.

## Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `title` | `string` | required | Non-empty title; wraps. |
| `description` | `string` | `''` | Secondary text, also wraps. |
| `interactive` | `boolean` | `false` | Turns the surface into one action. |
| `disabled` | `boolean` | `false` | Blocks only the interactive row's action. |
| `width` | `number \| % \| auto` | `auto` | Width following the layout contract. |
| `grow / shrink` | `number` | `0 / context` | Layout participation. |
| `accessibilityLabel` | `string` | title + description | Interactive row name. Include meaningful slot content. |
| `accessibilityHidden` | `boolean` | `false` | Hides redundant content. |
| `id` | `string` | — | Optional identifier. |

## Slots and interaction

`leading` accepts an avatar or icon; `trailing`, compact information or a control. There is no default slot: title and description are props. An interactive row without `trailing` shows `chevron-right`; providing that slot replaces the arrow.

**Interactive row:** one action, with focus and Enter/Space on Web and Jolt press feedback on native. Do not nest buttons, links or fields in its slots. The default accessible name combines title and description; supply `accessibilityLabel` when a Badge or other side element adds meaning. Native children are hidden as separate assistive targets.

**Informational row:** does not take focus or emit `click`. Children retain their own text and semantics. An independent button can go in `trailing`; `disabled` does not disable that control. The row is not automatically combined into one accessible element.

The composition reuses Card, Row, Column, Text and Icon: theme surface, `md` padding, `md` radius and no border. Height follows text. Keep side slots compact; large side content competes with the title for space. Compose your own Card for forms or complex content.

Group a few rows in Column/Card with Separator between them. This component does not provide a virtualized collection, swipe actions, reordering or selection management. [Team](../showcase/team) demonstrates details in Sheet and favorites owned by the parent.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/ListItemDemo.vue

</details>
