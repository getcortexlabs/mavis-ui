---
title: Regiões de movimento
description: Interações com descarte próprio, entradas por rolagem e identidades compartilhadas em superfícies declaradas do Mavis.
---

# Regiões de movimento

Estas adições experimentais exigem **Jolt 0.1.0-rc.7 ou posterior**. Fazem parte do Mavis **0.1.0-alpha.5**.

`MBox :motionRegion` declara uma região estável. As superfícies de `MCard` e `MButton` dentro dela usam o mesmo contexto do Jolt na Web. O press continua pertencendo ao componente; cada interação da aplicação tem seu próprio descarte. A receita compartilhada não recebe elementos DOM, views nativas, seletores ou callbacks por frame.

```vue
<script setup lang="ts">
import { markRaw, onBeforeUnmount } from 'vue'
import {
  createMotionRegion,
  createMotionSurface,
  whenMotionAvailable,
} from '@getcortexlabs/mavis-core/experimental'

const region = markRaw(createMotionRegion())
const card = markRaw(createMotionSurface())
const remove = whenMotionAvailable([region, card], () =>
  card.use((motion) => {
    const pointer = motion.pointerFollow(region, {
      range: { x: [-12, 12], y: [-8, 8] },
    })
    motion.bind({
      x: pointer.x,
      y: pointer.y,
      rotate: pointer.presence.to([0, 1], [0, -1.2]),
    })
  }),
)
onBeforeUnmount(remove)
</script>

<template>
  <m-box :motionRegion="region" padding="lg">
    <m-card :motionSurface="card" interactive accessibilityLabel="Abrir edição">
      <m-text>Um novo ponto de vista.</m-text>
    </m-card>
  </m-box>
</template>
```

Declare a região ao montar o Box. Separe a área de entrada da superfície animada e deixe espaço para o movimento. Regiões declaradas aninhadas criam contextos diferentes: grupos de entradas e identidades compartilhadas pertencem a uma única região.

## Dono de cada interação

`surface.use(setup)` fornece uma superfície filha. Use essa referência tanto no setup quanto em ações posteriores. Remover a assinatura descarta seus valores, mapeamentos, bindings e controladores, preservando as outras interações e o press. Um valor do pai recebido pelo binding da filha é emprestado: remover a filha não destrói esse valor. O setup é síncrono e desfaz recursos parciais se falhar.

Mount/load cria uma apresentação. Substituição da referência, desativação pelo KeepAlive e unload nativo destroem essa apresentação; ativação/load cria outra. Handles antigos não podem escrever na nova superfície. Mantenha o estado durável da aplicação fora do setup e reaplique-o quando houver disponibilidade. Os scopes nativos do Jolt também recriam suas assinaturas após suspensão do aplicativo. `onAvailable` continua disponível; `use` define o dono de interações que criam trabalho depois do setup.

## Ponteiro com limites

`pointerFollow` devolve `x`, `y` e `presence`, além de `available`, `active` e `execution`. Os dois renderizadores delegam hover, geometria, limites, springs, suspensão e a preferência de movimento reduzido ao Jolt: o runtime Web no navegador e a entrada de ponteiro nativa no NativeScript. Toque e contato da caneta não são hover, então rolagem, toques e foco continuam com o app.

- **`x` e `y`** acompanham o ponteiro dentro do seu `range`. Com `coordinates: 'pixels'`, são medidos a partir do centro da região: pixels CSS da viewport na Web, DIPs locais da região no NativeScript.
- **`presence`** vale 1 enquanto um ponteiro em hover está dentro da região e 0 nos outros casos: fora dela, desativado, suspenso e onde não existe hover. Mapeie como qualquer outro valor, por exemplo `pointer.presence.to([0, 1], [0, -1.2])`.
- **`available`** diz se a região montada tem uma API de hover: verdadeiro nos navegadores, no Android e no iPad, falso no iPhone. No NativeScript também fica falso enquanto a entrada está bloqueada (desativada, oculta, em segundo plano ou com movimento reduzido), porque o Jolt remove o listener nesses casos. Não detecta se há um mouse conectado: sem ele, os valores só ficam em repouso.
- **`execution`** é `hover` enquanto a entrada pode chegar e `static` nos outros casos.

A receita não precisa de ramificação por plataforma: sem hover, ela mantém os valores de repouso. `update({ disabled: true })` devolve o controle ao repouso. A entrada é liberada quando seu escopo ou sua região são substituídos, na desativação por KeepAlive, quando a view nativa é descarregada e quando o app vai para segundo plano, e é ligada de novo uma única vez na volta.

**Vue Web · Chromium · 760 × 620 pixels CSS**

<video controls playsinline preload="none" aria-label="Vue Web · Chromium · 760 por 620 pixels CSS" src="/media/pointer-presence-web.mp4" style="width:100%;max-width:760px;border-radius:16px"></video>

O cartão do Afterglow acompanha o ponteiro dentro da região e se inclina enquanto `presence` vale 1. O ponto marca o mouse: a gravação não tem cursor do sistema, e o mouse é movido por um script.

## Entradas por visibilidade

Chame `region.viewportEnter(surfaces, options)` quando todas as superfícies e a origem opcional de scroll do `MScreen` estiverem disponíveis. O grupo tem 1–64 identidades distintas, em ordem. As opções são `frames`, `transition`, `stagger` em milissegundos, `root`, `margin` em pixels CSS/DIPs, `threshold`, `once` e `disabled`. Margem positiva amplia a área observada. Para trocar o grupo, descarte o controlador e crie outro.

A Web usa a integração IntersectionObserver do Jolt. O NativeScript observa eventos de scroll/layout e pede ao Jolt a execução da mesma receita. O conteúdo nunca começa oculto no SSR ou enquanto aguarda observação. Sem observador, continua legível e estático. Sair da área cancela uma entrada pendente; `once: false` permite nova entrada. O descarte finaliza apenas os canais que ainda pertencem ao controlador. A receita é opcional e não altera `MReveal`, seu `show`, foco ou comportamento inert.

## Identidades compartilhadas

`region.sharedLayout()` cria um grupo de transição. `attach(surface, 'edition')` registra uma identidade explícita, acompanha a substituição da superfície e retorna uma função de remoção. `transition(() => { expanded.value = true })` captura antes da alteração síncrona do estado. O Jolt espera o layout do Vue/nativo; estado, navegação, foco e fechamento continuam na aplicação. O handle aceita cancelamento e fornece `finished`, com resultado `completed`, `cancelled` ou `unavailable` e um motivo quando houver.

O contrato cobre cards/textos estáticos e imagens decodificadas. As cópias de apresentação Web são inert e ocultas da acessibilidade. Formulários e mídia arbitrários, elementos customizados, Shadow DOM e transformações projetivas ficam fora desse contrato. Conteúdo ou geometria indisponível mantém o conteúdo final da aplicação. Capturas nativas têm limites próprios da plataforma. Esta integração não implementa um router, rasterizador genérico, FLIP de listas ou transições entre documentos.

O [Afterglow](../showcase/afterglow) preserva o controle interativo real ao mudar conteúdo e dimensões; o foco de teclado permanece nele. Uma aplicação que substitui o componente focado deve posicionar o foco na nova tela.

## Diagnóstico

`region.diagnostics({ development: true, identity: 'edition', maxEvents: 80 })` habilita um diagnóstico consultado sob demanda. `snapshot()` identifica a região/sessão e retorna IDs numéricos de alvos/donos do Jolt, canais, camadas, motivos e contagens de recursos. Esses IDs pertencem à sessão, não aos dados ou IDs DOM da aplicação. `kind: 'rest'` representa uma posição retida, sem significar animação ativa. O histórico tem limite de 1–2000 eventos. Não expõe valores de formulários, elementos ou views, nem instala consultas por frame ou uma sessão global do processo.

No nativo, `execution: 'lifecycle-only'` informa os recursos da região. Não promete telemetria dos canais Web nem instala o inspector nativo global do Jolt. Ao descartar o diagnóstico, a coleta para e permanece um snapshot final independente. Compare o host ativo antes/depois de remover uma interação. Um snapshot descartado registra o fim da observação, não garante que todo runtime da aplicação tenha parado.

O painel de diagnóstico do Afterglow só aparece em `/checks/lifecycles`. O showcase normal apresenta apenas controles do produto.

## Sheets dentro de conteúdo animado

O candidato correspondente do Jolt reconhece o limite da top layer modal. Assim, `MSelect` e `MSheet` podem ficar dentro de um card com escala da aplicação ou opacidade ligada ao scroll. Foco, digitação, Escape e rolagem continuam sob controle do Mavis. Se a preparação do movimento falhar, a Sheet libera os recursos parciais e mantém um diálogo estático utilizável. Transformações arbitrárias no painel ou espaço de entrada em si continuam fora do suporte.
