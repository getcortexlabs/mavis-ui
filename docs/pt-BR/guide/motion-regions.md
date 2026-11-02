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
  createMotionRegion, createMotionSurface, whenMotionAvailable,
} from '@getcortexlabs/mavis-core/experimental'

const region = markRaw(createMotionRegion())
const card = markRaw(createMotionSurface())
const remove = whenMotionAvailable([region, card], () => card.use((motion) => {
  const pointer = motion.pointerFollow(region, {
    range: { x: [-12, 12], y: [-8, 8] },
  })
  motion.bind({ x: pointer.x, y: pointer.y })
}))
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

Na Web, o adaptador delega hover, geometria, limites, springs, documento oculto e preferência de movimento reduzido ao `pointerFollow` do Jolt. Toque e contato da caneta não simulam hover. `update({ disabled: true })` retorna ao repouso. `execution` informa `hover` na Web e `static` no NativeScript. O fallback nativo fornece os valores de repouso declarados sem instalar listeners de toque nem disputar rolagem e ativação.

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
