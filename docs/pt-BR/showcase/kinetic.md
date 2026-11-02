---
title: Kinetic
description: Um cartão compartilhado com molas contínuas, drag, snap e press independente.
---

# Kinetic

Um cartão de notas que responde ao toque, segue mudanças de escala e pousa em três posições. Arraste e pegue durante a soltura, ou use Left/Center/Right. Retarget while held muda a escala do app sem substituir o press. Remova o cartão enquanto anima e monte novamente com um novo ciclo de movimento.

<a href="/playground/#/showcase/kinetic" target="_blank" rel="noopener">Abrir Kinetic ↗</a>

Open notes apresenta o mesmo conteúdo de Sheet nos dois ambientes. A Web usa Jolt com uma alça dedicada; o nativo mantém sua implementação de bottom sheet. São demonstrações locais, sem persistência ou chamadas de rede.

O repositório exige **Jolt 0.1.0-rc.6** para essa integração. [Veja o contrato experimental](../guide/motion).

## Receita compartilhada

<<< @/../examples/catalog/shared/kinetic-motion.ts

## Gravações

Entrada real do sistema/navegador na velocidade original, com controles em inglês. As gravações foram revisadas; imagens de simulador/emulador não são benchmark de aparelho físico. Web e nativo usam reconhecedores de gesto e física de soltura diferentes.

**NativeScript-Vue · iPhone 17 Pro · iOS 26.2 simulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · iPhone 17 Pro · iOS 26.2 simulator" src="/media/kinetic-ios.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**NativeScript-Vue · Pixel 7 · Android 16 / API 36 emulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · Pixel 7 · Android 16 / API 36 emulator" src="/media/kinetic-android.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**Vue Web · Chromium · 390 × 844 CSS pixels**

<video controls playsinline preload="none" aria-label="Vue Web · Chromium · 390 by 844 CSS pixels" src="/media/kinetic-web.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>
