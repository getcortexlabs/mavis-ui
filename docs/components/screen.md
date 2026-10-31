---
title: Screen
description: "Screen in Mavis UI. A themed screen surface with optional scrolling."
---

# Screen

`m-screen` · A themed screen surface with optional scrolling.

<ComponentPreview component="screen" :height="380" />

## Usage

```vue
<m-screen scroll>
  <m-column padding="lg" gap="md">
    <m-text as="h1" variant="title">Your screen</m-text>
    <m-card><m-text>Your content.</m-text></m-card>
  </m-column>
</m-screen>
```

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `scroll` | boolean | `false` | Enables vertical scrolling. |
| `dismissKeyboard` | boolean | `true` | Puts the software keyboard away on a tap outside the editor and, with `scroll`, on a drag towards it. |

On NativeScript, Screen represents a Page and needs a navigation host such as RouterView. Use one Screen per page; do not nest Pages. On the Web, it renders main, takes at least the viewport height and, with `scroll`, keeps scrolling inside that area. The preview above uses a separate document.

## Safe areas and keyboards

Screen owns one page viewport. On NativeScript, Page supplies the system insets; the scrolling viewport stays inside them, including after rotation. Add padding for your design, not a second status-bar or home-indicator offset.

Use `scroll` for long content and editable forms. On iOS, Screen reserves the part of its scroll area covered by a docked keyboard and brings the focused native field into view. It restores the original insets and releases observers when the page unloads. Avoid applying a second keyboard-inset manager to this same scroll view. Floating keyboards and custom overlays do not reserve a full-width strip.

On Android, the host Activity must use `android:windowSoftInputMode="adjustResize"`; the catalog already does. Android then resizes the available area and scrolls to the focused field. Screen does not change the app's window policy.

With `dismissKeyboard`, the default, a tap anywhere on the page that is not an editor puts the keyboard away and blurs the field, including a tap on a button, so a form does not wire this itself. With `scroll`, dragging the content towards the keyboard does the same: on iOS the keyboard follows the finger, on Android it hides as soon as the downward drag starts; dragging the other way still scrolls the form while typing. A touch that starts on an editor keeps the keyboard, so moving between fields and selecting text work as before, and the observers never consume the touch: buttons, cards and sheets receive it unchanged. Set `dismissKeyboard=false` for a composer whose buttons must keep the keyboard open. Without `scroll`, native screens dismiss on tap only.

On Web, the browser already moves focus away on a tap outside the field; Screen adds the drag dismissal for scrolling screens, and `dismissKeyboard=false` only disables that. A scrolling Screen follows the visual viewport when browser controls or a keyboard change its height. It accounts for the document movement Safari can introduce when focusing an input and keeps the focused control visible. Pinch zoom keeps the layout size so the reader can pan. Use the normal device-width viewport configuration; a host opting into `viewport-fit=cover` owns its additional CSS safe-area spacing.

`scroll=false` does not provide keyboard avoidance or make overflowing native content reachable. One Screen is one page: do not nest Screens or add another vertical scroller around it.

## Navigation and lifecycle

Screen does not own a router, history or application state. The catalog focuses `main` after Web navigation, including a direct route; the native host manages page focus. A native page kept in the back stack can remain mounted while unloaded, and the platform may restore its field focus and keyboard on return or app resume. Screen reapplies its viewport handling when loaded again.

Use the router/platform lifecycle to pause application work while a page is hidden; Vue unmount is for disposal. Keep state that must survive Web route remounting in a store or shared context. Mavis releases its own viewport observers and press feedback separately from your application work.

## Screen checks

The [verification screen](https://mavis-ui.getcortexlabs.com/playground/#/checks/screen) uses a platform input solely to exercise Screen; it is not a new Mavis input API. See [the reproducible native checks](https://github.com/getcortexlabs/mavis-ui/blob/main/test/native-screen.md) for safe-area bounds, the software keyboard, rotation, navigation and app resume. Browser checks also cover focus after direct routes, viewport contraction and listener cleanup.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/ScreenDemo.vue

</details>

## In context

[See the components in a complete vehicle controls screen](../showcase/vehicle).

[Accessible names, focus and screen-reader checks](../guide/accessibility).
