---
title: NavigationRail
---

# NavigationRail

::: info Unreleased
Available in development source for Vue + Vite, Nuxt and NativeScript iOS/Android. Not yet published on npm.
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

<<< @/../examples/catalog/shared/demos/NavigationRailDemo.vue
