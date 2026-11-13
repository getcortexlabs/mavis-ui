---
title: TabBar
---

# TabBar

::: info Alpha.10
Available in Mavis alpha.11 for Vue Web and NativeScript. Keep core and renderer versions aligned.
:::

<ComponentPreview component="tab-bar" :height="800" />

```vue
<MTabBar :modelValue="currentRoute" :items="destinations" label="Main navigation" />
```

| Property     | Type                     | Default    | Description                                                             |
| ------------ | ------------------------ | ---------- | ----------------------------------------------------------------------- |
| `items`      | `NavigationItem[]`       | `required` | Stable value, label, href and optional icon, badge, disabled, navigate. |
| `modelValue` | `string / number / null` | `null`     | Current route identity, supplied by the app.                            |
| `label`      | `string`                 | `required` | Navigation region name.                                                 |
| `disabled`   | `boolean`                | `false`    | Disables all destinations.                                              |
| `safeArea`   | `boolean`                | `false`    | Opt-in Web bottom viewport inset; native already uses MScreen.          |

Route navigation with real Web links and native actions using the installed navigation service. Derive `modelValue` from the confirmed route; no optimistic selection or `update:modelValue` event bypasses route guards. Modified Web clicks retain normal link behavior. `error` forwards navigation failures. Current links expose `aria-current="page"`; native accessible names include `currentLabel`. Badges are included in action names. Use MTabs for local content panels. The bar participates in normal layout; the host decides its position. A small set of short labels is recommended; there is no overflow menu. Keep native MScreen safe-area ownership and enable the Web inset only when placing the bar against the viewport bottom.

## Mac

In a shared screen for the [experimental Mac target](../guide/macos-experimental), `MTabBar` draws the same row of destinations and marks the one the source names as current; Jolt moves the mark. A destination on another site opens in the browser. One inside the app needs the app's navigation, which the Mac target does not have yet: until it does, following one reports `error`. Items are data there: an item's own `navigate` function is not accepted, values are strings and `badge` is text. `safeArea` changes nothing on the Mac.

<<< @/../examples/catalog/shared/demos/TabBarDemo.vue
