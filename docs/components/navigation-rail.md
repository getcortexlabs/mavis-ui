---
title: NavigationRail
---

# NavigationRail

::: info Added in alpha.11
Included in Mavis 0.1.0-alpha.11 for Vue + Vite, Nuxt and NativeScript iOS/Android. Keep core and renderers on the same version.
:::

<ComponentPreview component="navigation-rail" :height="1000" />

```vue
<MNavigationRail v-model:collapsed="collapsed" :modelValue="routeKey" :groups="groups" label="Workspace" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `groups` | `readonly NavigationGroup[]` | required | Unique groups with key, label and NavigationItem entries. Item values are unique across groups. |
| `modelValue` | `ChoiceValue or null` | null | App-owned current destination; successful routing determines the active item. |
| `collapsed / collapsible / disabled` | `boolean` | false / true / false | Compact 80 px/DIP or expanded 256 px/DIP presentation. |
| `header / footer` | `slots` | — | Receive { collapsed } for branding and account content. |

Links use the installed Mavis navigation adapter or an item navigate callback. Web retains href and browser link behavior. Current state is controlled by the application rather than optimistic clicks. Compact buttons keep accessible names and badge context. Jolt animates current-item signals and button feedback; the application chooses when to collapse for its layout.

Events: `update:collapsed(boolean)`, `error(unknown)`.

## Mac

In a shared screen for the [experimental Mac target](../guide/macos-experimental), `MNavigationRail` draws the same groups, 256 points wide or 80 collapsed, and marks the destination the source names as current; Jolt moves the mark and the width. `collapsed` stays with the source: write `:collapsed` with `@update:collapsed` (`collapsed` and `onCollapse` in a `.lite.tsx` file); `v-model:collapsed` is not read yet. The `header` and `footer` slots take `{ collapsed }`. A destination on another site opens in the browser; one inside the app needs the app's navigation, which the Mac target does not have yet, and reports `error` until it does. Items are data there: an item's own `navigate` function is not accepted, values are strings and `badge` is text.

<<< @/../examples/catalog/shared/demos/NavigationRailDemo.vue
