---
title: Capacidades do Jolt Web
description: Coreografia compartilhada, composição de SVG e HTML e a matriz verificada de recursos do Jolt.
---

# Capacidades do Jolt Web

Estas integrações estão disponíveis desde o **Mavis 0.1.0-rc.12**. O checkout atual usa **Jolt 0.1.0-rc.14** ([release](https://github.com/rafaelaugustos/jolt/releases/tag/v0.1.0-rc.14)). Continuam experimentais.

Veja também as [integrações de efeitos e coleções](./visual-motion) e [movimento de plataforma](./platform-motion). A CLI fixa Mavis RC.13 com Jolt RC.13.

## Coreografia compartilhada

`createMotionSurface()` e `createMotionRegion()` descrevem movimento da aplicação sem expor elementos HTML ou views nativas. Declare superfícies em Button/Card e a região em Box. Execute receitas depois da disponibilidade. Um filho criado por `surface.use()` possui seus recursos e é recriado com sua apresentação; remover ou substituir a superfície invalida os recursos anteriores.

| Capacidade                                                 | Integração Mavis                                         | Exemplo              |
| ---------------------------------------------------------- | -------------------------------------------------------- | -------------------- |
| Transformações, opacidade, springs, keyframes, interrupção | `surface.animate()`                                      | Atelier, Kinetic     |
| Camada interna de press                                    | Button/Card no mesmo contexto Jolt                       | Demos interativos    |
| Valores, seguidores, mapeamentos e bindings                | `motionValue`, `springValue`, `.to`, `bind`              | Kinetic, Field Guide |
| Playback escalar e camadas aditivas                        | `animateValue`, `stopValue({ layer })`                   | Tempo                |
| Progresso do playback existente                            | `playbackProgress(handle)`                               | Tempo                |
| Etapas ordenadas/sobrepostas e factories                   | `region.sequence()`                                      | Tempo                |
| Timeline imperativa com callbacks futuros                  | `region.timeline()`                                      | Tempo                |
| Estados nomeados e troca de referências                    | `region.states()`                                        | Tempo                |
| Soltura por velocidade/atrito e snap projetado             | `surface.decay()`, callback de soltura do drag           | Tempo                |
| Arrasto com limites e spring snap                          | `surface.drag()`, handle da Sheet                        | Kinetic, Sheet       |
| Geometria responsiva                                       | `surface.refresh()` e observação do renderer             | Field Guide          |
| Scroll vertical e movimento vinculado                      | Fonte de Screen e `scrollLinked`                         | Field Guide          |
| Altura/largura intrínsecas                                 | Reveal; `scope.animateSize()` na Web                     | Reveal, Afterglow    |
| Cor, layout/FLIP e cenas com seek                          | Escopo Web; adaptadores do catálogo                      | Afterglow            |
| Ponteiro e entrada no viewport                             | Regiões e contratos de entrada                           | Afterglow            |
| Identidade e layout compartilhado                          | `region.sharedLayout()`                                  | Afterglow            |
| Escopos, suspensão e diagnóstico                           | `surface.use`, regiões, escopo Web, `region.diagnostics` | Testes de lifecycle  |
| Desenho de traços SVG                                      | `scope.drawPath()` na Web                                | Connections          |

O Jolt cuida de interpolação, agendamento, velocidade e desenho. O Mavis conecta referências e ownership à apresentação dos componentes. Progresso de animação não representa progresso de upload ou de rede.

### Valores e playback

```ts
const stop = surface.use((motion) => {
  const value = motion.motionValue(0)
  motion.bind({ x: value.to([0, 1], [-30, 30], { clamp: false }) })
  const travel = motion.animateValue(value, [0, 1, 0.35], { duration: 2400 })
  const progress = motion.playbackProgress(travel)
  motion.bind({ opacity: progress.to([0, 1], [0.55, 1]) })
  travel.pause()
  travel.progress = 0.5
  travel.resume()
  motion.animateValue(value, 0.15, { layer: 'accent', duration: 200 })
  motion.stopValue(value, { layer: 'accent' })
})
```

Somente entradas mutáveis da mesma superfície/apresentação, incluindo seus escopos filhos, podem receber playback. Valores derivados, externos ou liberados são rejeitados antes de alterar ownership. Liberar o progresso não interrompe a animação emprestada. Não há render por frame do Vue nem um segundo relógio de progresso.

### Grupos e estados

```ts
const group = region.timeline([
  [card, { y: [20, 0] }, { duration: 800 }],
  [card, { rotate: [0, 3, 0] }, { duration: 900, at: '<' }],
  {
    at: 1000,
    run: () => {
      checkpoint()
      return card.animate({ scale: [1, 1.05, 1] }, { duration: 400 })
    },
  },
])
group.pause()
group.resume()
group.stop()
```

Uma sequência oferece conclusão e cancelamento. A timeline imperativa acrescenta pausa/retomada, inclusive dos callbacks futuros, preservando filhos que estavam pausados separadamente. Ela não oferece seek; para isso existe a timeline declarativa do Jolt. Factories retornam playback Mavis para preservar o handle, relógio e metadados do Jolt. Superfícies das tuplas precisam estar montadas no início; sua remoção interrompe o grupo.

`region.states({ card }, definitions, { transition })` acompanha substituições da superfície declarada e aceita alvos que montam depois. `current` identifica o estado solicitado; `settled`, o movimento concluído. Overrides usam `{ duration: 600, targets: { card: { duration: 900 } } }`. Uma substituição pausada participa da transição existente. A aplicação continua responsável pelos estados de trabalho, erro e sucesso.

Decay recebe velocidade explícita em pixels CSS/segundo na Web e DIPs/segundo no NativeScript. `drag({ axis: 'x', onRelease(event) { ... } })` fornece `velocityX`/`velocityY` medidos pelo Jolt. Use spring para um destino conhecido e decay para movimento guiado pela velocidade, com snap opcional no destino projetado. A Sheet mantém seu comportamento de spring.

## HTML e SVG na Web

A entrada experimental Web atende markup da aplicação dentro de uma Box com região declarada:

```ts
import { useMavisWebMotion } from '@getcortexlabs/mavis-web/experimental'

useMavisWebMotion(region, (scope, element) => {
  const path = element.querySelector<SVGPathElement>('#connection')!
  const drawing = scope.drawPath(path, { progress: 0 })
  drawing.animate(1, { duration: 1200 })
})
```

O callback recebe o `WebMotionScope` completo do Jolt: desenho, cor, layout, tamanho intrínseco, timeline com seek, valores, grupos, estados, gestos, scroll e ownership. Ele compartilha o runtime do press dos componentes da região. Use esse escopo filho para trabalhos posteriores; não crie outro runtime sobre as mesmas superfícies nem libere entradas emprestadas. Configurar um runtime Jolt independente continua sendo uma responsabilidade da aplicação/Jolt.

O setup não roda durante SSR; o HTML/SVG inicial continua sendo renderizado no servidor. A receita é recriada com a região e o lifecycle do documento. Unmount e desativação de KeepAlive liberam o trabalho pertencente ao escopo. O retorno opcional é uma função de limpeza ou recurso síncrono, nunca uma Promise.

`drawPath` anima progresso de traço em um contorno contínuo por alvo, respeitando `pathLength`. Oferece reversão, pausa/retomada, seek, atualização de geometria, movimento reduzido e cleanup. Não faz morph da geometria nem promete composição de SVG pela GPU. HTML/SVG são específicos da Web; a receita Tempo funciona nos dois renderizadores.

## Movimento reduzido por região

Os componentes que animam na Web leem a preferência efetiva do runtime do Jolt da sua região, não a configuração do sistema por conta própria. Por padrão é o `prefers-reduced-motion` do sistema. Uma região pode definir a própria política:

```ts
import { markRaw } from 'vue'
import { createMotionRegion } from '@getcortexlabs/mavis-core/experimental'
import { configureMavisWebMotion } from '@getcortexlabs/mavis-web/experimental'

const region = markRaw(createMotionRegion())
const release = configureMavisWebMotion(region, { reducedMotion: 'always' })
```

`always` reduz independentemente do sistema, `never` mantém o movimento e `user` segue o sistema. A política pertence à região declarada com `MBox :motionRegion`: outra região mantém a dela, e tudo dentro segue a mesma resposta, incluindo `MChart`, `MResizablePanels`, `MImageCompare`, `MMarquee` e os fundos do dashboard. Volta a `user` quando a região sai do documento ou `release()` é chamado.

<video controls playsinline preload="none" aria-label="Vue Web · Chromium · duas regiões com políticas diferentes de movimento reduzido" src="/media/reduced-motion-regions-web.mp4" style="width:100%;max-width:600px;border-radius:16px"></video>

Vue Web no Chromium, em velocidade real, com a tela de checagem em inglês. A primeira região sempre reduz: o gráfico e o divisor vão direto para os valores novos enquanto a segunda anima, até que ela também receba `always`.

Uma mudança na configuração do sistema, ou na política, assenta de imediato uma atualização em andamento. `never` passa por cima da configuração de sistema da pessoa: reserve para movimento que carrega significado e não tem outra forma.

Isto é só da Web. No NativeScript a preferência é a configuração do próprio Jolt para o aplicativo inteiro, e os componentes continuam seguindo essa configuração.

## Inserção no DOM em Vue e Nuxt

Superfícies de Button/Card, regiões de Box e referências de scroll da Screen ficam disponíveis depois da inserção no documento do runtime. O Mavis usa o adaptador Vue do Jolt para inserção tardia, cancelamento e KeepAlive, sem polling ou timeout fixo. Desmontar cancela o trabalho pendente. As APIs imperativas do Jolt continuam exigindo alvos montados.

Para animar a entrada de HTML próprio em Vue/Nuxt, use a factory de diretiva do Jolt no lugar de chamar `runtime.viewportEnter()` diretamente no hook `mounted` de uma diretiva:

```vue
<script setup lang="ts">
import { createViewportEnterDirective } from '@rafaelaugusto/jolt/web/vue'

const vEnter = createViewportEnterDirective({
  viewport: {
    keyframes: { y: [22, 0] },
    transition: { duration: 500 },
    once: true,
  },
})
</script>
<template><section v-enter>Conteúdo legível no servidor</section></template>
```

Crie a diretiva por componente ou aplicação, incluindo cada requisição SSR. Use-a no HTML da aplicação; componha movimento nas superfícies Mavis pelo runtime emprestado da região. O SSR entrega conteúdo legível sem criar um dono de animação.

## Histórias por identidade e scroll horizontal

<a href="/playground/#/showcase/horizons?lang=pt">Horizons</a> demonstra as novas APIs Web por `useMavisWebMotion`. Três apresentações de Card são reutilizadas para seis identidades. `scope.animateItems([{ key, target }], frames, { once: true })` acompanha as chaves lógicas; chame `update()` depois de alterar os itens renderizados. Outra chave no mesmo elemento permite uma nova entrada; voltar à chave já vista aplica o estado final sem repetir. `forget(key)` limpa seu histórico. As chaves precisam ser únicas; essa entrada individual não aceita `stagger`.

Se o conteúdo mudar as dimensões do Card, declare seu canal de movimento e use `scope.observeGeometry(target)`. O exemplo observa a geometria sem substituir o elemento, perder press ou recriar o controlador da lista.

`scope.scrollValue(rail, { axis: 'x' })` lê pixels CSS desde o início da linha: esquerda em LTR, direita em RTL. `scrollLinked(..., { axis: 'x', range: [0, end] })` usa o mesmo eixo normalizado. Os valores são deslocamentos, não porcentagens. O exemplo mapeia a distância disponível para progresso e atualiza o mapeamento ao redimensionar o contêiner. O Jolt resolve os offsets RTL do navegador e a execução; o Mavis não normaliza `scrollLeft` por conta própria.

Essa composição Web não altera o contrato portátil da Screen, que continua vertical. Flex invertido e escrita vertical ficam fora do fluxo horizontal suportado. NativeScript não recebe APIs DOM/SVG pela integração Web.

O consumidor Nuxt cobre navegação assíncrona com transição out-in, SSR/SSG, visitas repetidas, KeepAlive e RTL. A limitação de placeholder em páginas assíncronas interrompidas no Nuxt 4.6.3, registrada separadamente pelo Jolt, continua fora desta entrega; não prometemos corrigir todas as corridas de navegação do framework.

A troca pausada de alvo nativo da Jolt #338 foi repetida com o candidato que deu origem à RC.8 no Android API36 e iOS26.2: os dois completaram o estado solicitado e as 14 verificações de orquestração. A falha nativa anterior foi corrigida; a correção entrou na RC.8 e continua incluída na RC.9 do registry usada pela alpha.7. Acompanhamento: Mavis #218–#221 e #224.

## Gravações reais

Tempo usa a mesma receita nos dois renderizadores. As gravações Web usam o candidato `3b8649f`; as nativas usam `9043166`, com a correção da troca pausada. Os vídeos nativos mostram o probe disparando ações do componente e medindo a apresentação real, em simulador/emulador; não são testes de toque em aparelhos físicos.

<p>Tempo · Chromium</p>
<video controls playsinline preload="none" aria-label="Tempo · Chromium" src="/media/orchestration-tempo-web.mp4" style="width: 100%; max-height: 600px"></video>

<p>Tempo · iOS 26.2</p>
<video controls playsinline preload="none" aria-label="Tempo · iOS 26.2" src="/media/orchestration-tempo-ios.mp4" style="width: 100%; max-height: 600px"></video>

<p>Tempo · Android API36</p>
<video controls playsinline preload="none" aria-label="Tempo · Android API36" src="/media/orchestration-tempo-android.mp4" style="width: 100%; max-height: 600px"></video>

<p>Connections · Chromium</p>
<video controls playsinline preload="none" aria-label="Connections · Chromium" src="/media/orchestration-connections-web.mp4" style="width: 100%; max-height: 600px"></video>
