---
title: Current
description: A retained collection with a collapsing header, anchored updates and keyed reorder.
---

# Current

A place for ideas of different lengths. One MScreen scroll source drives the header, pinned controls, keyed insertion and refresh. Jolt reorders the retained rows; the app commits their stable keys. Error, retry, cancellation, resizing and explicit move buttons remain ordinary shared Vue state.

**Source development; not published in alpha.7.** See [requirements, limits and ownership](../guide/visual-motion). This is a small mounted collection, not a virtualized list or a remote data service.

<video controls playsinline preload="metadata" style="max-width: 390px; width: 100%; border-radius: 16px" src="/media/visuals-current-web-en.mp4"></video>

Recorded in Chromium 156 at 390 × 844 CSS pixels with Jolt candidate `cc8f467`. Automated interactions, original speed; this clip does not validate native gestures or frame performance.

<<< @/../examples/catalog/shared/pages/Current.vue
