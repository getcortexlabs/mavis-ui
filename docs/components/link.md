---
title: Link
description: "Navigation with browser semantics and native host routing."
---

# Link

`MLink` represents navigation. `MButton` and `MCard` also accept the same navigation props when the destination needs a button or card presentation.

<ComponentPreview component="link" :height="280" />

```vue
<m-link href="https://mavis-ui.getcortexlabs.com/" target="_blank">Documentation</m-link>
<m-button href="/account" :navigate="openRoute">My account</m-button>
<m-card href="/record/42" :navigate="openRoute" accessibilityLabel="Open record">
  <m-text variant="heading">Record 42</m-text>
</m-card>
```

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `href` | string | — | Required nonempty destination for Link; enables navigation mode in Button/Card. |
| `navigate` | (href: string) => void or Promise | — | Host route handler. |
| `target` | _self / _blank | `_self` | Web browsing context. |
| `rel` | string | — | Web link relationship. Blank targets add noopener/noreferrer. |
| `text` | string | — | Link text, or plain text in the default slot. |
| `disabled` | boolean | `false` | Suppress activation and remove the Web href/tab stop. |
| `inline` | boolean | `false` | Inline Web presentation for Link. |

Web renders one anchor, preserving copy-link, keyboard activation and modified clicks. Only an ordinary click with `_self` calls `navigate`. NativeScript uses the host callback for internal routes and the system opener for external URLs. `target` and `rel` are Web-only hints. Failures emit `error`; successful activation requests emit `click` without payload. The app owns navigation, route state and history.

## Vue Router / Nuxt

Use the router's custom slot so Mavis owns the only anchor. The callback accepts Mavis's URL argument; adapt it to the router's event-oriented handler explicitly:

```vue
<RouterLink to="/account" custom v-slot="{ href, navigate, isActive }">
  <m-button :href="href" :navigate="() => navigate()" :aria-current="isActive ? 'page' : undefined">
    My account
  </m-button>
</RouterLink>
```

The same custom-slot composition works with `NuxtLink` and with `MCard`. Do not wrap an anchor around an interactive Mavis component or nest controls in a linked card. A normal Button without `href` still supports `type="submit"` and native form behavior.

<<< @/../examples/catalog/shared/demos/LinkDemo.vue

## App navigation

In alpha.11, `createMavis` and `createMavisServices` accept `navigation: createRouterNavigation(router)`. Linked Link, Button and Card use the adapter without per-component callbacks. An explicit `navigate` prop takes precedence. See [Share screens](../guide/sharing).

## Mac

In a shared screen for the [experimental Mac target](../guide/macos-experimental), `MLink` hands its destination to `navigate` when the source passes one, and otherwise opens a destination on another site in the browser. A link to a place inside the app without `navigate` is an error when the screen is compiled, until the Mac target has the app's navigation. `target` and `rel` are hints for the Web; with `target="_blank"` the Mac does not call `navigate`, as the Web does not.
