---
title: Accessibility
description: 'Accessible names, keyboard interaction, screen readers and focus in the experimental Mavis components.'
---

# Accessibility

Mavis uses native accessibility on Android and iOS, and semantic HTML on the Web. The initial components have dedicated reader and keyboard checks. This does not certify every interface built with them: names, content order, custom colors and navigation still need review in the consuming application.

## Names and grouping

Use concise visible text for Button. Supply `accessibilityLabel` when the action needs more context, and keep the visible wording in that name. Choose a useful `loadingText`, such as “Saving changes…”. Loading prevents another activation. On the Web it keeps the focused button in the keyboard order with `aria-disabled` and `aria-busy`; `disabled` uses the native HTML disabled state.

Slider requires `label`. Its accessible bounds and value use the application's numbers, including fractional steps. Increment and decrement move one allowed value, including a shorter final interval. For `0…1` with `step=0.3`, decrementing from `1` reaches `0.9`.

An interactive Card is one action. Give it an `accessibilityLabel` and keep buttons, links and fields outside it. Its Mavis descendants are decoration for that named action. A passive Card leaves each child's semantics intact. Raw platform views remain the application's responsibility.

Use Text's `as="h1"` through `as="h6"` for meaningful headings. `variant` changes typography independently. Row, Column and Box arrange content; they do not replace headings or actionable controls. `accessibilityHidden` is for decoration. On the Web it also makes the subtree inert; never use it to conceal an action people still need.

## Focus and navigation

Web Buttons and interactive Cards support keyboard activation and visible focus. Sliders support arrow keys, Home and End. A scrolling Screen can receive keyboard focus even when it contains only text, so Page Down can reach its remaining content.

Reveal does not move focus on opening. When focus is inside its content on closing, it returns to the element that had focus when the content opened, if that element remains available. The leaving content is excluded from accessibility during the animation. Opening Reveal without a focused trigger does not establish a restoration target.

Screen provides a page boundary; your router owns route changes, retained pages and their state. Check the initial focus and return behavior of each destination. A restored page and a newly opened page need not start on the same element. Do not add a second Screen inside a page to force focus behavior.

Native restoration tracks Mavis elements. Raw platform controls supplied through escape hatches need their own focus integration.

## Text, color and targets

Text and Button follow native text scaling; Button labels can wrap. Keep important content free of fixed heights that clip at larger sizes. Check your composition with the largest supported font settings and a narrow viewport.

Default Buttons and Sliders reserve at least 48 DIPs on Android and 44 points on iOS; Web controls reserve 44 CSS pixels. An interactive Card's target follows its content and padding. Consumer styles can override these dimensions, so inspect the final target.

The built-in Mavis and Midnight themes check normal text pairs at 4.5:1 and control/focus colors against their standard surfaces at 3:1. The Slider track uses `muted` so it remains distinguishable on these surfaces. Custom themes, backgrounds and disabled styling need their own review.

## Reproduce the checks

The shared fixture is `/playground/#/checks/accessibility`. It combines the nine initial components, navigation, loading, decorative content and disabled actions. The browser suite audits every component demo in both themes with axe, then checks keyboard focus and scrolling in Chromium and WebKit.

Native reader checks, supported test environments and commands live in [the repository's accessibility test guide](https://github.com/getcortexlabs/mavis-ui/blob/main/test/native-accessibility.md). Simulator results do not replace the [physical-device matrix](https://github.com/getcortexlabs/mavis-ui/issues/23). Motion and reduced-motion behavior are also tracked in [the movement lifecycle review](https://github.com/getcortexlabs/mavis-ui/issues/33).

The iOS reader regression includes repeated loading on the same page, alongside independent checks for each theme. [#53](https://github.com/getcortexlabs/mavis-ui/issues/53) records the removed-text lifetime fix and its device matrix. A separate case remains under [#54](https://github.com/getcortexlabs/mavis-ui/issues/54): VoiceOver can skip a newly inserted offscreen status on the first cycle while still reaching the controls below it. That case is a known alpha limitation; the passing repeated-cycle check does not cover it.
