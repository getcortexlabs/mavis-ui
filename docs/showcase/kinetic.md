---
title: Kinetic
description: A shared card with continuous springs, drag, snap and independent press feedback.
---

# Kinetic

A field-notes card that responds to touch, follows a changing scale and lands in three places. Drag and catch it during release, or use Left/Center/Right. Retarget while held changes the application scale without replacing the press contribution. Remove the card while it moves and mount it again with a fresh motion lifetime.

<a href="/playground/#/showcase/kinetic" target="_blank" rel="noopener">Open Kinetic ↗</a>

Open notes presents the same Sheet content on both platforms. Web uses Jolt on a dedicated handle; native keeps its bottom-sheet implementation. These are local demonstrations, with no persistence or network calls.

The repository requires **Jolt 0.1.0-rc.6** for this integration. [Read the experimental contract](../guide/motion).

## Shared recipe

<<< @/../examples/catalog/shared/kinetic-motion.ts

## Recordings

Actual OS/browser input at original speed, with English controls. The recordings were reviewed; simulator/emulator footage is not a physical-device benchmark. Web and native have different gesture recognizers and release physics.

**NativeScript-Vue · iPhone 17 Pro · iOS 26.2 simulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · iPhone 17 Pro · iOS 26.2 simulator" src="/media/kinetic-ios.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**NativeScript-Vue · Pixel 7 · Android 16 / API 36 emulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · Pixel 7 · Android 16 / API 36 emulator" src="/media/kinetic-android.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**Vue Web · Chromium · 390 × 844 CSS pixels**

<video controls playsinline preload="none" aria-label="Vue Web · Chromium · 390 by 844 CSS pixels" src="/media/kinetic-web.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>
