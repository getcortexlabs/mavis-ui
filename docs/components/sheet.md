---
title: Sheet
description: "Sheet in Mavis UI. Present content and actions in a layer above the screen, with native gestures on NativeScript and a modal dialog on the Web."
---

# Sheet

`m-sheet` · Content and actions in a layer above the screen.

<ComponentPreview component="sheet" :height="440" />

## Usage

```vue
<m-button @click="open = true">Filters</m-button>
<m-sheet v-model:open="open" title="Filters" @close="last = $event">
  <m-text>Choose what to show.</m-text>
  <m-button @click="open = false">Apply</m-button>
</m-sheet>
```

Values and handlers in this snippet belong to your component. The full example below includes their setup.

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `open` | boolean | `false` | Presents or dismisses the sheet. Bind it with `v-model:open`. |
| `title` | string | — | Heading and accessible name. Without it, `accessibilityLabel` is required. |
| `dismissible` | boolean | `true` | Allows the scrim, Escape, the back gesture, a swipe down and the close button. |
| `fullscreen` | boolean | `false` | Fills the usable height instead of fitting the content. |
| `closeLabel` | string | `Close` | Accessible name of the close button. |
| `padding` | token \| number | `lg` | Inner spacing of the panel. |
| `gap`, `align` | Column props | `none`, `stretch` | Apply to the content column. |

| Event | Payload | When |
| --- | --- | --- |
| `update:open` | boolean | The sheet asks to open or close. |
| `close` | `button` \| `backdrop` \| `escape` \| `back` \| `swipe` \| `program` | Every close request, with its reason. `program` means the app set `open` to false. |

The sheet is controlled: a dismissal emits `update:open` with `false` and `close` with its reason, and the panel leaves when `open` changes. Content mounts when the sheet opens and is removed after it settles closed. A sheet without `title` or `accessibilityLabel` throws a RangeError. `dismissible` and `fullscreen` are read when the sheet opens.

## NativeScript

The panel lives inside the page, above the Screen content, and is driven by [Jolt's bottom sheet](https://jolt.rafaelaugusto.dev/guide/bottom-sheet): a drag handle with Expand, Collapse and Dismiss accessibility actions, a spring that follows the finger, scroll handoff inside the content, a scrim, keyboard following and Android back. The content snaps to its own height, or to the usable height with `fullscreen`. `MSheet` needs an `MScreen` ancestor. While a sheet is presented, the Screen hides the covered content from assistive technology and VoiceOver treats the panel as modal; focus returns to the previous element after the sheet settles.

Core's Frame navigation honors the cancelled back event. A router that owns the Android back press, such as vue-router-ns, asks a claimant first:

```ts
app.use(
  createMavis({
    theme: mavis,
    darkTheme: midnight,
    claimSystemBack: (claimant) => router.claimSystemBack(claimant),
  }),
)
```

Routed modals with their own stack remain a vue-router-ns feature; `MSheet` is a component inside a page.

## Web

The Web renderer uses a modal `<dialog>`: focus stays inside, Escape and a click on the scrim close a dismissible sheet, and focus returns to the opener when it closes. The panel slides in from the bottom with CSS and respects reduced motion. The browser may still close a non-dismissible dialog after repeated Escape presses; the bound `open` follows. Page scrolling pauses while a sheet is open.

## Limits

- Snap points other than the content height and the full height are not exposed yet.
- The Expand and Collapse accessibility actions on the native handle use Jolt's English labels.
- A native sheet caught mid-dismissal springs back open and emits `update:open` with `true`.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/SheetDemo.vue

</details>

## In context

[Accessible names, focus and screen-reader checks](../guide/accessibility).

[Jolt bottom sheet](https://jolt.rafaelaugusto.dev/guide/bottom-sheet) · [Jolt Web · #236](https://github.com/rafaelaugustos/jolt/issues/236)
