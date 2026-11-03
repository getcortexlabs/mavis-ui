---
title: Visual motion and collections
description: Gradients, loading, text, circular visibility and retained collections on shared Mavis surfaces.
---

# Visual motion and collections

**Experimental in Mavis 0.1.0-alpha.10.** These adapters require the published [Jolt 0.1.0-rc.10](https://github.com/rafaelaugustos/jolt/releases/tag/v0.1.0-rc.10). Keep all Mavis packages at the same version and rebuild native applications after upgrading. The project creator pins Mavis alpha.10 and Jolt RC.10. The optional `@rafaelaugusto/jolt-native` plugin is not required by these integrations.

| Capability                              | Web          | iOS          | Android                                      |
| --------------------------------------- | ------------ | ------------ | -------------------------------------------- |
| Linear, radial and conic gradients      | Experimental | Experimental | Experimental                                 |
| Shimmer and dots/bars/ring loaders      | Experimental | Experimental | Unsupported; static placeholder/loading text |
| Plain-text entrance and rolling counter | Experimental | Experimental | Experimental                                 |
| Circular reveal/conceal                 | Experimental | Experimental | Unsupported; content remains visible         |
| Retained header, anchors and refresh    | Experimental | Experimental | Experimental                                 |
| Retained keyed reorder                  | Experimental | Experimental | Experimental                                 |

Declare surfaces on `MBox`, `MCard`, `MButton` or `MText`. The same references and callbacks work in the shared Vue screen. Jolt owns animation, native input and frame scheduling. The app owns data, loading, error messages and focus decisions. [Lustre](../showcase/lustre) demonstrates visual effects; [Current](../showcase/current) combines the retained collections.

## Gradients

```ts
const remove = card.use((motion) => {
  const position = motion.motionValue(0.25)
  const paint = motion.gradient({
    type: 'radial',
    colors: ['#214b80', '#d78eae'],
    center: { x: 0.25, y: 0.4 },
    radius: 0.8,
  })
  paint.bind({ center: { x: position } })
  // Event handlers created in this setup can later call position.set(0.8).
  paint.animate({ colors: ['#231b63', '#c975a1'] }, { duration: 650 })
})
```

The resource exposes `set`, `animate`, `bind`, `stop`, `suspend`, `resume` and `dispose`. Colour and geometry bindings borrow values from the same presentation, including child scopes. Disposing a binding leaves its sources alive; disposing a source removes dependent bindings. Component press and application transforms keep their own ownership.

Use two to eight colours. An animation keeps the colour count; replace the resource to change the gradient type or count. Stops and centres use unit coordinates, radius is a multiple of the shorter side, and angles are degrees. Native `set` can change the count, but that is outside this shared subset. Invalid values reject through Jolt. A later application background write remains application-owned; do not have two owners continuously write the same gradient property.

Native gradient bindings require values/mappings with a calculable playback track. For shared spring motion, use `animateValue(position, destination, { type: 'spring' })`; a live follower created by `springValue()` is rejected by the native backend.

## Loading decoration

`<m-skeleton effect="shimmer" :animated="loading" />` opts into the Jolt effect; the default remains `pulse`. `MButton` accepts `loadingIndicator="dots|bars|ring"` alongside `loading`, `loadingText` and its accessible label. The indicator is decorative, cannot receive input, and does not represent numeric progress. `MProgress` retains that separate meaning.

For an application surface, use `motion.shimmer()` or `motion.loader({ style: 'ring', size: 32, color: '#214b80' })`. The returned resource has `supported` and `dispose()`. `motion.supports('loader')` reports the backend. Android keeps the Skeleton geometry and Button loading text; it does not emulate an iOS effect. Reduced motion, hidden documents, app suspension and presentation removal remain Jolt lifecycle responsibilities.

## Text and numbers

Pass an explicit string through `<m-text :text="label" :motionSurface="heading" />`. Call `heading.animateText({ by: 'word', y: 12, stagger: 45 })` after availability, or `counter.rollTo(value, { format: n => n.toLocaleString('en-US') })`. Keep the final value in application state too; the effect does not replace your model.

Only a plain-text leaf is supported. Slots containing rich text, controls, formatted spans and multiline rolling layouts are outside this subset. Web preserves the original Text node across Vue updates and uses inert visual copies; native uses a Label. Text entrance is bounded to 256 graphemes; Web rolling presentation is bounded to 2048 visible fragments. Long content should remain ordinary text. Retargeting, cancellation and reduced motion preserve the final readable value. Do not announce every animation frame through a live region.

## Circular visibility

```ts
const remove = panel.use((motion) => {
  const circle = motion.circular()
  if (!circle.supported) return
  // Run from a control outside the panel after moving any inner focus out.
  circle.conceal({ origin: { x: 28, y: 28 }, duration: 750 })
  // circle.reveal() reverses from the current presentation.
})
```

The resource retains layout while concealed, removes the subtree from interaction/accessibility, and restores its owned state on disposal. Move keyboard focus outside before conceal; an inner focused control rejects. Origins use local CSS pixels on Web and DIPs on native. Keep geometry stable during a transition; Jolt cancels when it can no longer use the measured bounds. Android reports unsupported and keeps the content available. This is an opt-in presentation effect; `MReveal` keeps its existing controlled show, focus and intrinsic-size contract.

## A single retained scroll source

Declare `motionRegion` and `motionScroll` on one scrolling `MScreen`. Put the list in its default slot and three retained `MBox` surfaces in `#overlay`: header, pinned section and compact toolbar. Artwork/title belong inside the header; the compact title belongs inside the toolbar. Align overlays to the top. The adapter positions the section below the expanded header; do not add a second margin or scroll container.

Once the region, source and surfaces are available, call `region.scrollHeader(scroll, { header, artwork, title, toolbar, toolbarTitle, section, items, onRefresh })`. `items()` returns ordered `{ key: string, target }` rows with stable keys. The controller measures the header, adds its reserved space, collapses it and pins the section. `remeasure()` follows a changed title/size; `scrollToItem(key)` targets a declared row. `preserveAnchor(async () => { rows.value = next; await nextTick() })` preserves the current visible key when data changes.

Inside `onRefresh(context)`, await application loading, check `context.cancelled`, then `await context.commit(async () => { rows.value = incoming; await nextTick() })`. `refresh()` returns a completion boolean, shares the pending request, and handles error/retry through `onRefreshError`. `cancelRefresh()`, pause, unload and disposal invalidate late commits. Cancellation cannot undo app writes or abort arbitrary I/O. Current uses a delayed local result, not a network service.

## Reordering the same rows

Call `region.reorder({ container, scroll, items, onCommit })` for the layout containing mounted rows. Include a declared `handle` surface in each item. `MButton reorderHandle` is the native Jolt handle and an ordinary Web button; use plain text without navigation, icon or adornment slots. `onCommit({ key, beforeKey })` updates the keyed application array; `beforeKey: null` means the end. Await Vue reconciliation before `refresh()`.

The controller exposes `move`, `moveUp`, `moveDown`, `cancel`, `pause`, `play` and `dispose`. Pause it and disable its handles together when movement is unavailable. Web supports pointer pickup, touch long press and Space/Enter, arrows, Escape. Native uses Jolt touch recognition and its ReorderHandle keyboard/accessibility actions; the shared example also supplies explicit Up/Down buttons. Retained rows can differ in height. Native reorder allows at most 100 mounted rows and 16 million snapshot pixels; retained native headers allow at most 1000 rows. Neither API virtualizes a list.

Use the normal [presentation lifetime](./motion-regions#interaction-ownership): ref replacement, KeepAlive deactivation, unload and navigation dispose controllers. Reactivation creates fresh presentation resources from retained app data. No SSR measurement or animation runs; server HTML remains readable before hydration.
