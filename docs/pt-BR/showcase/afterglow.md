---
title: Afterglow
description: Uma noite de arte com identidades compartilhadas, press independente e entradas por rolagem na Web e no NativeScript.
---

# Afterglow

Uma noite de arte, conversas e novas perspectivas. Acompanhe a edição com o mouse, abra os detalhes, conheça a artista e percorra a programação. O mesmo código Vue executa na Web e no NativeScript; plataformas de toque mantêm a ilustração de hover em repouso.

<a href="/playground/#/showcase/afterglow" target="_blank" rel="noopener">Abrir Afterglow ↗</a>

O exemplo usa [regiões de movimento experimentais](../guide/motion-regions) e Jolt RC.7. Faz parte do Mavis alpha.5. A foto da artista é remota; enquanto a imagem aguarda decodificação, ou se falhar, o Avatar mantém seu fallback normal e a captura compartilhada pode ficar indisponível.

<<< @/../examples/catalog/shared/afterglow-motion.ts

Interação real com os sistemas e o navegador, em velocidade original e com controles em inglês. As gravações nativas são de simulador/emulador, não de aparelhos físicos. Cópias animam a apresentação; foco, seleção, edição e conteúdo real continuam na aplicação. Os controles de desenvolvimento ficam isolados em `/checks/lifecycles`.

**NativeScript-Vue · simulador iPhone 17 · iOS 26.2**

<video controls playsinline preload="none" aria-label="Afterglow no NativeScript-Vue, simulador iPhone 17, iOS 26.2" src="/media/afterglow-ios.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**NativeScript-Vue · emulador Pixel 7 · Android 15 / API 35**

<video controls playsinline preload="none" aria-label="Afterglow no NativeScript-Vue, emulador Pixel 7, Android 15" src="/media/afterglow-android.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**Vue Web · Chromium · 390 × 844**

<video controls playsinline preload="none" aria-label="Afterglow no Vue Web, Chromium, viewport mobile" src="/media/afterglow-web.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>
