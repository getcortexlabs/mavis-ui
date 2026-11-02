---
title: Afterglow
description: An evening of art with shared identities, independent press and viewport entrances on Web and NativeScript.
---

# Afterglow

An evening of art, conversation and changing perspectives. Follow the edition with a mouse, open its details, meet the artist and scroll through the evening. The same Vue source runs on Web and NativeScript; touch platforms keep the hover illustration at rest.

<a href="/playground/#/showcase/afterglow" target="_blank" rel="noopener">Open Afterglow ↗</a>

This example uses [experimental motion regions](../guide/motion-regions) and Jolt RC.7. It is included in Mavis alpha.5. The artist image is a remote asset; failed or pending decoding keeps Avatar's ordinary fallback and may make a shared capture unavailable.

<<< @/../examples/catalog/shared/afterglow-motion.ts

Actual device/browser input at original speed. The native recordings are from a simulator/emulator, not physical hardware. Shared copies animate presentation; focus, selection, editing and the actual content remain with the app. Developer controls are isolated at `/checks/lifecycles`.

**NativeScript-Vue · iPhone 17 simulator · iOS 26.2**

<video controls playsinline preload="none" aria-label="Afterglow on NativeScript-Vue, iPhone 17 simulator, iOS 26.2" src="/media/afterglow-ios.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**NativeScript-Vue · Pixel 7 emulator · Android 15 / API 35**

<video controls playsinline preload="none" aria-label="Afterglow on NativeScript-Vue, Pixel 7 emulator, Android 15" src="/media/afterglow-android.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**Vue Web · Chromium · 390 × 844**

<video controls playsinline preload="none" aria-label="Afterglow on Vue Web, Chromium, mobile viewport" src="/media/afterglow-web.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>
