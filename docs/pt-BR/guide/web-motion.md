---
title: Capacidades do Jolt Web
description: Coreografia compartilhada, composição de SVG e HTML e a matriz verificada de recursos do Jolt.
---

# Capacidades do Jolt Web

Esta página descreve a branch em desenvolvimento. As novas operações de orquestração exigem Jolt **posterior à RC.7**, validado no commit `3b8649fd11d2273c360250f2316ad04e62ab4aad` ([PR #335](https://github.com/rafaelaugustos/jolt/pull/335)). Elas **não estão no Mavis alpha.5 nem no Jolt RC.7 publicados**. Antes de lançar o Mavis, substitua o candidato pela versão publicada que o contenha e repita os testes de consumidores.

Para desenvolver a partir do código, execute `node scripts/prepare-jolt-candidate.mjs`; use `--native` depois de instalar as dependências do catálogo nativo. O comando compila um tarball real do Jolt no commit registrado, sem alterar o lockfile nem publicar uma versão. A CLI de criação continua usando apenas capacidades publicadas da alpha.5/RC.7.

## Coreografia compartilhada

`createMotionSurface()` e `createMotionRegion()` descrevem movimento da aplicação sem expor elementos HTML ou views nativas. Declare superfícies em Button/Card e a região em Box. Execute receitas depois da disponibilidade. Um filho criado por `surface.use()` possui seus recursos e é recriado com sua apresentação; remover ou substituir a superfície invalida os recursos anteriores.

| Capacidade | Integração Mavis | Exemplo |
| --- | --- | --- |
| Transformações, opacidade, springs, keyframes, interrupção | `surface.animate()` | Atelier, Kinetic |
| Camada interna de press | Button/Card no mesmo contexto Jolt | Demos interativos |
| Valores, seguidores, mapeamentos e bindings | `motionValue`, `springValue`, `.to`, `bind` | Kinetic, Field Guide |
| Playback escalar e camadas aditivas | `animateValue`, `stopValue({ layer })` | Tempo |
| Progresso do playback existente | `playbackProgress(handle)` | Tempo |
| Etapas ordenadas/sobrepostas e factories | `region.sequence()` | Tempo |
| Timeline imperativa com callbacks futuros | `region.timeline()` | Tempo |
| Estados nomeados e troca de referências | `region.states()` | Tempo |
| Soltura por velocidade/atrito e snap projetado | `surface.decay()`, callback de soltura do drag | Tempo |
| Arrasto com limites e spring snap | `surface.drag()`, handle da Sheet | Kinetic, Sheet |
| Geometria responsiva | `surface.refresh()` e observação do renderer | Field Guide |
| Scroll vertical e movimento vinculado | Fonte de Screen e `scrollLinked` | Field Guide |
| Altura/largura intrínsecas | Reveal; `scope.animateSize()` na Web | Reveal, Afterglow |
| Cor, layout/FLIP e cenas com seek | Escopo Web; adaptadores do catálogo | Afterglow |
| Ponteiro e entrada no viewport | Regiões e contratos de entrada | Afterglow |
| Identidade e layout compartilhado | `region.sharedLayout()` | Afterglow |
| Escopos, suspensão e diagnóstico | `surface.use`, regiões, escopo Web, `region.diagnostics` | Testes de lifecycle |
| Desenho de traços SVG | `scope.drawPath()` na Web | Connections |

O Jolt cuida de interpolação, agendamento, velocidade e desenho. O Mavis conecta referências e ownership à apresentação dos componentes. Progresso de animação não representa progresso de upload ou de rede.

### Valores e playback

```ts
const stop = surface.use(motion => {
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
  { at: 1000, run: () => {
    checkpoint()
    return card.animate({ scale: [1, 1.05, 1] }, { duration: 400 })
  } },
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

## Próximas entregas do upstream

Estes recursos continuam em desenvolvimento no Jolt e não são apresentados como disponíveis nesta branch:

- [Jolt #334](https://github.com/rafaelaugustos/jolt/issues/334): montagem tardia do DOM nas transições Nuxt. Alvos imperativos continuam exigindo montagem; a integração deve adotar a correção de lifecycle sem enfraquecer essa validação.
- [Jolt #336](https://github.com/rafaelaugustos/jolt/issues/336): entrada de listas por identidade para linhas alteradas ou recicladas.
- [Jolt #337](https://github.com/rafaelaugustos/jolt/issues/337): scroll horizontal e normalização de RTL.

Acompanhamento: Mavis #218–#221 e #224. Esta integração não leva APIs DOM/SVG do navegador para o NativeScript.

A troca de alvo nativo durante pausa está bloqueada por [Jolt #338](https://github.com/rafaelaugustos/jolt/issues/338), reproduzida nos simuladores Android API36 e iOS26.0. O fluxo equivalente passou na Web. Playback escalar, progresso, timeline, press e decay passaram nos dois probes nativos; a paridade de substituição depende de corrigir e validar o upstream antes do release.
