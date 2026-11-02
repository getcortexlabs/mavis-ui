---
title: Movimento
description: Movimento compartilhado com Jolt, ciclo de vida e uma animação experimental do app no NativeScript e na Web.
---

# Movimento

Button, Card/ListItem interativos e Reveal executam as mesmas definições com **Jolt 0.1.0-rc.5** no NativeScript e na Web. As telas compartilhadas mantêm suas propriedades e eventos. A integração está no repositório para a próxima alpha da Mavis; **não faz parte da 0.1.0-alpha.3**. As entradas Web do Jolt e a referência de superfície abaixo continuam experimentais.

O pacote Web agora exige Jolt como peer dependency. Um consumidor de navegador instala Vue e Jolt, sem NativeScript nem SDKs nativos. A Mavis importa apenas `@rafaelaugusto/jolt/web` e `/web/vue`. Apps nativos precisam de um novo build após atualizar o Jolt.

## Movimento dos componentes

| Fase | Definição compartilhada |
| --- | --- |
| Pressionar | Mola, 200 ms, bounce 0, multiplicador do tema |
| Soltar/cancelar | Mola, 450 ms, bounce 0.35, multiplicador 1 |
| Entrada do Reveal | Opacidade 0 → 1, y 8 → 0, 180 ms |
| Saída do Reveal | Opacidade → 0, 120 ms |

`theme.motion.pressScale` tem padrão `0.97`, aceita um número finito maior que 0 e até 1 e atualiza o feedback montado, inclusive durante uma pressão. Os tempos continuam definidos pela Mavis. O Jolt executa as molas; a Mavis cuida dos eventos e do ciclo de vida. Na Web, o adaptador trata ponteiro principal, Enter/Espaço, cancelamento, perda de foco, rolagem e documento oculto sem sintetizar cliques. O nativo usa os eventos de toque do NativeScript. O rótulo do Switch nativo também usa essa definição. Outros componentes, incluindo Chip Web e indicadores de seleção, mantêm suas implementações atuais.

O press tem uma camada multiplicativa: base do app **1.1 × press 0.96 = 1.056**; mudar a base para **1.2 durante a pressão resulta em 1.152** e soltar retorna a **1.2**. Desabilitar, carregar, descarregar ou desmontar remove o feedback sem restaurar uma escala antiga. A troca de tema atualiza a pressão sem substituir a animação do app.

O Reveal mantém o conteúdo montado durante a saída e o retira da ordem de foco/acessibilidade. A Web devolve o foco ao elemento que abriu o conteúdo quando necessário. O nativo restaura um acionador Mavis lembrado, se ainda estiver carregado, e notifica a acessibilidade após a entrada. Controles nativos externos não são registrados como acionadores Mavis; sem um acionador lembrado, a biblioteca não inventa um destino de foco. Uma saída cancelada não conclui uma entrada posterior. A desmontagem cancela trabalho e remove observadores. A altura do layout não é interpolada; os deslocamentos usam DIPs no nativo e pixels CSS na Web.

## Movimento reduzido

O nativo segue a configuração do Jolt (`user` por padrão); a Web segue `prefers-reduced-motion`. A Mavis não muda a configuração global nativa. Ambos levam o movimento espacial ao destino, inclusive se a preferência mudar durante a animação; a opacidade pode continuar sua transição. Uma pressão mantém seu multiplicador final imediatamente. Isso substitui o comportamento CSS anterior da Web, que removia o multiplicador. Voltar ao movimento normal não repete animações encerradas; a próxima interação usa seu tempo normal.

## Uma animação do app

`createMotionSurface()`, de `@getcortexlabs/mavis-core/experimental`, declara uma superfície. Passe a referência ao `MButton` pela propriedade `motionSurface`. O botão conecta explicitamente sua raiz visual após montar/carregar. O app não acessa `$el`, filhos, DOM nem views nativas.

```vue
<script setup lang="ts">
import { markRaw } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { animateStudioSurface } from './studio-motion'

const surface = markRaw(createMotionSurface())
const run = () => animateStudioSurface(surface)
</script>

<template>
  <m-button :motionSurface="surface" @click="run">Animar</m-button>
</template>
```

A definição e a função que inicia a animação são as mesmas nas duas plataformas:

<<< @/../examples/catalog/shared/studio-motion.ts

`available` é false antes de montar/carregar e após descarregar/desmontar. Chamar `animate` ou `set` nesses momentos lança um erro de configuração. Cada conexão tem uma geração: substituir a superfície cancela o playback anterior com `finished: false`; handles antigos não alteram a nova superfície. Chamadas posteriores usam a nova conexão. Uma animação completa resolve `true`; interrupção, substituição ou remoção resolve `false`, uma vez, sem rejeição por cancelamento comum. Mantenha a referência fora de conversão reativa profunda (`markRaw` no exemplo). Declare uma referência por componente.

O recorte experimental suporta transformações 2D e opacidade numéricas, keyframes numéricos, tempos finitos de tween/mola, `set`, `stop` e `finished`. Não expõe objetos de plataforma, CSS arbitrário, layouts, portais, drag/snap nem uma API estável de animação. Use a referência para movimento concorrente do app. Escrever diretamente transform/opacity ou aplicar animações CSS à superfície Web controlada pelo Jolt viola seu contrato de composição. Um transform 2D estático anterior é uma base; propriedades CSS independentes `scale`/`translate`/`rotate`, transições CSS ativas e propriedades de movimento com `!important` não são suportadas. Reserve espaço visual para a escala além do layout.

<a href="/playground/#/checks/motion">Abra a tela compartilhada</a>. “Animate and hold” define a base 1.1, espera um segundo e inicia a mesma função do app; mantenha o botão principal pressionado durante a animação. A tela também demonstra temas, desabilitação, Reveal repetido e remoção durante o movimento.

O ponto de transformação da superfície experimental Web é resolvido ao conectar o componente e permanece fixo nessa conexão. Use uma superfície com geometria estável; remonte-a para escolher uma nova âncora após um redesenho de layout. Botões comuns liberam sua superfície ao terminar o release, recalculando a âncora na interação seguinte.

A atualização da âncora após mudanças de geometria está na [#137](https://github.com/getcortexlabs/mavis-ui/issues/137).

## Validação e gravações

Os testes de navegador cobrem composição, continuidade ao alterar/soltar, teclado/ponteiro, cancelamento, movimento reduzido em tempo real, foco, Reveal repetido e remoção. Os checks nativos leem modelo e apresentação real no Android/iOS e usam a mesma função do app. Incluem referências antigas, substituição/unload, movimento reduzido em tempo real e continuidade nos pontos de interrupção. Esses checks não comprovam desempenho em aparelhos físicos nem equivalência de velocidade quadro a quadro.

As gravações usam interações reais, velocidade original e controles em inglês; os rótulos distinguem simulador/emulador de uma viewport de navegador.

**NativeScript-Vue · iPhone 17 · iOS 26.2 simulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · iPhone 17 · iOS 26.2 simulator" src="/media/jolt-shared-ios.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**NativeScript-Vue · Pixel 7 · Android 16 / API 36 emulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · Pixel 7 · Android 16 / API 36 emulator" src="/media/jolt-shared-android.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**Vue Web · Chromium 156 · 390 × 844 CSS pixels**

<video controls playsinline preload="none" aria-label="Vue Web · Chromium 156 · 390 × 844 CSS pixels" src="/media/jolt-shared-web.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

## Gravações anteriores

Registro da etapa anterior, com fallback CSS na Web.

**NativeScript-Vue · iPhone 17 · simulador iOS 26.2**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · iPhone 17 · simulador iOS 26.2" src="/media/motion-ios.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**NativeScript-Vue · Pixel 7 · emulador Android API 36**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · Pixel 7 · emulador Android API 36" src="/media/motion-android.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**Vue Web · Chromium 156 · 390 × 844 pixels CSS**

<video controls playsinline preload="none" aria-label="Vue Web · Chromium 156 · 390 × 844 pixels CSS" src="/media/motion-web.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>
