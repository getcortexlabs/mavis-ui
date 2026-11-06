---
title: Movimento
description: Movimento compartilhado com Jolt, ciclo de vida e uma animação experimental do app no NativeScript e na Web.
---

# Movimento

Button, Card/ListItem interativos e Reveal executam as mesmas definições com **Jolt 0.1.0-rc.11** no NativeScript e na Web. As telas compartilhadas mantêm suas propriedades e eventos. Este guia descreve a **Mavis 0.1.0-rc.11.1**. As entradas Web do Jolt e a referência de superfície abaixo continuam experimentais.

O pacote Web agora exige Jolt como peer dependency. Um consumidor de navegador instala Vue e Jolt, sem NativeScript nem SDKs nativos. A Mavis importa apenas `@rafaelaugusto/jolt/web` e `/web/vue`. Apps nativos precisam de um novo build após atualizar o Jolt.

## Preview de desenvolvimento: movimento nos componentes

O Atlas local apresenta a próxima rodada de movimento. Essas mudanças **ainda não estão nos pacotes RC.11.1 publicados**. Elas usam Jolt RC.11 e os tempos de `theme.motion`, preservando valores controlados e eventos.

| Família                                           | Apresentação nesta cópia de trabalho                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Carousel                                          | Arraste horizontal contínuo, soltura considerando velocidade e retorno ao slide aceito                   |
| Tabs, SegmentedControl, TabBar, NavigationRail    | Indicadores móveis e animação de largura do rail                                                         |
| Calendar e seletores de data                      | Troca de mês direcional e fundo animado da seleção e do intervalo                                        |
| DataTable, Breadcrumb, Timeline, TreeView         | Layout por identidade, setas dos ramos, conectores de estado e inserção de filhos                        |
| CommandPalette, Combobox, MultiSelect, FilePicker | Movimento de resultados, chips e arquivos sem atrasar a digitação                                        |
| Chart                                             | Barras, linhas e pontos interpolados por série/categoria, com dados acessíveis atualizados imediatamente |
| Popover, Menu, Tooltip, Dialog, Toast             | Entrada/saída Jolt com cancelamento e atualização imediata de foco e acessibilidade                      |
| RangeSlider, Rating, Progress                     | Destaque do ponto ativo, feedback nas estrelas e progresso determinado contínuo                          |
| Input, NumberInput e formulários                  | Feedback nas mensagens e na lista de erros, preservando editor e cursor                                  |
| Image, Avatar, Badge, Alert, EmptyState           | Revelação da imagem e feedback discreto no conteúdo ou na ilustração                                     |
| Grid e Stack                                      | Movimento de layout responsivo e `motionRegion` explícita                                                |

VirtualList limita o trabalho às linhas materializadas. Na Web, a reordenação dos dados anima a janela atual; rolar não dispara entradas. O NativeScript continua responsável por reciclar células: itens lógicos carregados recebem feedback curto ao mudar os dados, e um item reciclado começa em repouso. Isso não implementa um diff completo da lista nativa nem anima linhas fora da tela.

Button/Card/ListItem, controles de escolha, Sheet e Reveal mantêm suas integrações Jolt existentes. Link, Separator, Span, ThemeProvider e Platform não ganham animação contínua. O pulso do Skeleton e o Progress indeterminado da Web continuam em CSS, com as regras de redução de movimento e documento oculto. Nenhum segundo scheduler de animação foi criado.

[Explorar a composição Atlas](../showcase/atlas).

## Movimento dos componentes

| Fase              | Definição compartilhada                       |
| ----------------- | --------------------------------------------- |
| Pressionar        | Mola, 200 ms, bounce 0, multiplicador do tema |
| Soltar/cancelar   | Mola, 450 ms, bounce 0.35, multiplicador 1    |
| Entrada do Reveal | Opacidade 0 → 1, y 8 → 0, 180 ms              |
| Saída do Reveal   | Opacidade → 0, 120 ms                         |

`theme.motion.pressScale` tem padrão `0.97`, aceita um número finito maior que 0 e até 1 e atualiza o feedback montado, inclusive durante uma pressão. Os tempos continuam definidos pela Mavis. O Jolt executa as molas; a Mavis cuida dos eventos e do ciclo de vida. Na Web, o adaptador trata ponteiro principal, Enter/Espaço, cancelamento, perda de foco, rolagem e documento oculto sem sintetizar cliques. O nativo usa os eventos de toque do NativeScript. O rótulo do Switch nativo também usa essa definição. Outros componentes, incluindo Chip Web e indicadores de seleção, mantêm suas implementações atuais.

O press tem uma camada multiplicativa: base do app **1.1 × press 0.96 = 1.056**; mudar a base para **1.2 durante a pressão resulta em 1.152** e soltar retorna a **1.2**. Desabilitar, carregar, descarregar ou desmontar remove o feedback sem restaurar uma escala antiga. A troca de tema atualiza a pressão sem substituir a animação do app.

O Reveal mantém o conteúdo montado durante a saída e o retira da ordem de foco/acessibilidade. A Web devolve o foco ao elemento que abriu o conteúdo quando necessário. O nativo restaura um acionador Mavis lembrado, se ainda estiver carregado, e notifica a acessibilidade após a entrada. Controles nativos externos não são registrados como acionadores Mavis; sem um acionador lembrado, a biblioteca não inventa um destino de foco. Uma saída cancelada não conclui uma entrada posterior. A desmontagem cancela trabalho e remove observadores. A altura do layout não é interpolada; os deslocamentos usam DIPs no nativo e pixels CSS na Web.

## Movimento reduzido

O nativo segue a configuração do Jolt (`user` por padrão); a Web segue `prefers-reduced-motion`. A Mavis não muda a configuração global nativa. Ambos levam o movimento espacial ao destino, inclusive se a preferência mudar durante a animação; a opacidade pode continuar sua transição. Uma pressão mantém seu multiplicador final imediatamente. Isso substitui o comportamento CSS anterior da Web, que removia o multiplicador. Voltar ao movimento normal não repete animações encerradas; a próxima interação usa seu tempo normal.

## Uma animação do app

`createMotionSurface()`, de `@getcortexlabs/mavis-core/experimental`, declara uma superfície. Passe a referência ao `MButton` ou `MCard` pela propriedade `motionSurface`. O botão conecta explicitamente sua raiz visual após montar/carregar. O app não acessa `$el`, filhos, DOM nem views nativas.

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

O recorte experimental suporta transformações 2D e opacidade numéricas, keyframes numéricos, tempos finitos de tween/mola, `set`, `stop` e `finished`. Não expõe objetos de plataforma, CSS arbitrário, layouts, portais nem uma API estável de animação. Use a referência para movimento concorrente do app. Escrever diretamente transform/opacity ou aplicar animações CSS à superfície Web controlada pelo Jolt viola seu contrato de composição. Um transform 2D estático anterior é uma base; propriedades CSS independentes `scale`/`translate`/`rotate`, transições CSS ativas e propriedades de movimento com `!important` não são suportadas. Reserve espaço visual para a escala além do layout.

<a href="/playground/#/checks/motion">Abra a tela compartilhada</a>. “Animate and hold” define a base 1.1, espera um segundo e inicia a mesma função do app; mantenha o botão principal pressionado durante a animação. A tela também demonstra temas, desabilitação, Reveal repetido e remoção durante o movimento.

As superfícies declaradas de Button/Card observam a geometria pelo Jolt. Mudanças de tamanho, texto/loading e métricas de fontes mantêm a âncora centralizada sem remontar, apagar canais do app ou reiniciar seus relógios. `surface.refresh()` aceita explicitamente uma mudança de geometria suportada; as views nativas mantêm sua âncora proporcional durante o layout. O observer é removido com a apresentação. Alterações externas de classe ou da propriedade transform continuam exigindo liberar a superfície.

## Valores contínuos e drag

A alpha.4 introduziu `motionValue`, `springValue`, `bind` e `drag` em um eixo à mesma superfície, em **Button e Card**. A Mavis RC.11.1 atual exige **Jolt 0.1.0-rc.11 ou posterior**. Reinstale dependências e recompile os apps nativos ao atualizar da alpha.3.

```ts
const surface = markRaw(createMotionSurface())
let target: MotionValue | undefined
const unsubscribe = surface.onAvailable(() => {
  target = surface.motionValue(1)
  const scale = surface.springValue(target, { stiffness: 160, damping: 18 })
  surface.bind({ scale })
  return () => {
    target = undefined
  }
})
// Um evento do app, sem atualização a cada quadro:
const enlarge = () => target?.set(1.08)
onBeforeUnmount(unsubscribe)
```

Importe `MotionValue` de `@getcortexlabs/mavis-core/experimental` e `markRaw`/`onBeforeUnmount` da integração Vue. Passe a referência com `<m-card :motionSurface="surface">`. A receita roda após montar/carregar e novamente quando uma página nativa retida carrega. Os recursos criados de forma síncrona são descartados ao encerrar a inscrição ou descarregar a apresentação. Recursos criados depois também pertencem à apresentação atual. Criá-los antes da disponibilidade lança erro.

| Referência       | Operações suportadas                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Valor de entrada | `to(...)`, `get()`, `set(number)`, `disposed`, `dispose()`                                   |
| Mola seguidora   | `get()`, `getVelocity()`, `moving`, `paused`, `pause()`, `resume()`, `disposed`, `dispose()` |
| Binding          | `disposed`, `dispose()`                                                                      |
| Drag             | `dragging`, `pause()`, `resume()`, `cancel()`, `disposed`, `dispose()`                       |

As opções da mola são `stiffness`, `damping`, `mass`, `initial`, `restDelta` e `restSpeed`. Deslocamentos usam pixels CSS ou DIPs nativos; rotação usa graus, escala é um multiplicador e opacidade não tem unidade. A velocidade usa unidades da fonte por segundo. Pausar preserva posição/velocidade da mola; retomar segue o destino mais recente. Descartar a entrada descarta suas molas e bindings. `dispose()` pode ser repetido; outras operações em um recurso descartado lançam erro, inclusive setters guardados. Uma geração antiga não altera a nova montagem.

Cada superfície tem seu contexto Jolt na Web. Valores, bindings e press usam **o mesmo contexto**, sem singleton de documento ou app. Valores não atravessam componentes ou gerações. A mola aceita uma entrada viva da própria superfície, não outra mola. Entradas, molas e valores derivados aceitam `.to(input, output, { clamp })` numérico: 2–1024 pares finitos, entradas estritamente crescentes ou decrescentes e clamp ativo por padrão. Os mapeamentos são somente leitura, podem ser encadeados em até 32 níveis de derivação/mola e são descartados com a origem. Cores/funções, molas seguindo derivações/outras molas, valores entre superfícies e assinaturas por quadro continuam fora desse contrato portátil. A Mavis não cria solver nem relógio de animação. O Jolt para de solicitar quadros em repouso e cuida de background e movimento reduzido.

`bind` controla os canais de base; press continua como multiplicador separado. Um `animate`, `set` ou binding posterior no mesmo canal assume esse canal. Drag controla o deslocamento durante o gesto. Prefira canais separados para efeitos simultâneos, como no Kinetic: drag em `x`, mola em `scale` com mapeamentos de `y`/`opacity` e entrada em `rotate`. `drag.cancel()` interrompe gesto/release na posição atual; `pause()` também desativa a entrada até `resume()`. Pausa/retomada e descarte terminal são o contrato comum das molas; `jump`/`stop`, exclusivos da Web, não são expostos. O playback finito mantém `stop()`.

### Kinetic: uma receita compartilhada

<a href="/playground/#/showcase/kinetic">Abra o Kinetic</a>. Arraste, solte, pegue a animação em movimento, altere a escala durante a pressão e remova o cartão enquanto anima. Left/Center/Right chegam aos mesmos destinos sem arrastar. Toques reais e teclado continuam ativando; o drag suprime o clique que viria do gesto.

<<< @/../examples/catalog/shared/kinetic-motion.ts

A tela compartilhada importa essa função sem objetos ou condicionais de plataforma. O estado Vue muda em eventos do app, nunca a cada quadro. O Jolt controla a entrada e a física em cada ambiente; destinos iguais não significam trajetórias idênticas. O driver Web suporta um ponteiro principal e transform estático identidade, sem ancestrais transformados/com zoom, pinch ou transferência de rolagem aninhada. Tamanho e texto podem mudar sem descartar esses canais. Os limites de drag continuam definidos pelo app e fixos para cada handle.

## Gravações de movimento contínuo

As gravações do Kinetic usam entrada real na mesma tela compartilhada. Separadamente, probes nativos validam 32 amostras de apresentação/ciclo de vida por plataforma; a entrada dos probes é sintética.

**NativeScript-Vue · iPhone 17 Pro · iOS 26.2 simulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · iPhone 17 Pro · iOS 26.2 simulator" src="/media/kinetic-ios.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**NativeScript-Vue · Pixel 7 · Android 16 / API 36 emulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · Pixel 7 · Android 16 / API 36 emulator" src="/media/kinetic-android.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**Vue Web · Chromium · 390 × 844 CSS pixels**

<video controls playsinline preload="none" aria-label="Vue Web · Chromium · 390 by 844 CSS pixels" src="/media/kinetic-web.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

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

## Movimento ligado ao Screen

`createMotionScrollSource()` declara uma origem vertical. Passe-a para `<m-screen scroll :motionScroll="source">` e conecte o destino quando ambas as referências estiverem disponíveis. `scrollLinked` cria os valores dentro do contexto Jolt do destino, preservando o press sem compartilhar valores entre runtimes.

```ts
const source = markRaw(createMotionScrollSource())
const surface = markRaw(createMotionSurface())
const release = source.onAvailable(() =>
  surface.onAvailable(() => {
    const link = surface.scrollLinked(
      source,
      {
        y: [0, 80],
        scale: [1, 0.9],
        opacity: [1, 0.35],
      },
      { range: [0, 240], execution: 'auto' },
    )
    return () => link.dispose()
  }),
)
onBeforeUnmount(release)
```

Os offsets são pixels CSS na Web e DIPs no nativo, limitados à extensão vertical rolável, sem overscroll elástico. O intervalo cresce a partir de um início não negativo; frames numéricos interpolam linearmente em pontos igualmente espaçados. O vínculo pertence às gerações atuais **da origem e do destino**. Remover ou substituir qualquer um descarta o vínculo; `scroll=false` deixa a origem indisponível. Páginas nativas retidas reconectam no load; a desativação por KeepAlive na Web libera origens e superfícies. Nenhum objeto DOM/nativo aparece no código compartilhado.

`link.refresh()` relê a conexão; `source.refresh()` atualiza todas as conexões ativas. Viewport, layout do conteúdo imediato, texto e fontes provocam refresh automático. Chame refresh para alterações profundas de overflow que não redimensionem o conteúdo observado, como descendentes com posição absoluta. Uma nova animação/set/binding do app assume somente seus canais. Com movimento reduzido, os canais espaciais ativos ficam no frame final; a opacidade continua acompanhando o scroll.

Na Web, `execution: 'auto'` usa ScrollTimeline quando o Jolt e o navegador conseguem compor o efeito ali. Press ativo ou outro canal em execução pode exigir temporariamente o scheduler compartilhado; `execution: 'scheduler'` força esse fallback. `link.execution` informa `scroll-timeline`, `scheduler`, `native` ou `released`. Consultá-lo sob demanda não cria assinaturas de valores nem muda a execução. O nativo usa valores e bindings Jolt ligados aos eventos nativos de scroll. A Mavis não acrescenta relógio por quadro. Não há promessa de compositor em todo navegador ou combinação de efeitos.

[Field Guide](../showcase/field-guide) usa a mesma receita na Web, iOS e Android. Inclui geometria responsiva, alteração atrasada de texto/tipo, interrupção parcial, remoção de origem/destino e conteúdo curto. Rolagem horizontal/invertida/RTL, ViewTimeline, pinning, transferência entre scrolls aninhados e APIs gerais de scroll ficam fora desse experimento.

<<< @/../examples/catalog/shared/field-motion.ts

[Regiões de movimento](./motion-regions) descreve scopes, ponteiro, entradas e identidades compartilhadas do Mavis alpha.5, usando Jolt RC.7.

## Movimento faz parte do tema

`theme.motion` define `pressScale` (0.97), `pressDuration` (200 ms), `releaseDuration` (450 ms), `releaseBounce` (0.35), `enterDuration` (180 ms), `exitDuration` (120 ms), `enterOffset` (8 unidades de layout) e `ease` (`easeOut`). Durações e deslocamento são finitos e não negativos; bounce fica entre 0 e 1; easing aceita `linear`, `easeIn`, `easeOut`, `easeInOut`.

```ts
import { defineTheme, motionRecipe, pressMotion } from '@getcortexlabs/mavis-core'
const calm = defineTheme({ name: 'calm', motion: { enterDuration: 260, enterOffset: 12 } })
const enter = motionRecipe(calm, 'enter') // keyframes + transition
const press = pressMotion(calm.motion)
```

Passe a receita de entrada à animação da sua superfície. Press de Button/Card e altura de Reveal usam as configurações do tema nos dois renderizadores. A política de movimento reduzido continua no Jolt. O tema descreve tempos e movimento; não cria outro motor de animação.

## Cor e decoração

Na alpha.7, Checkbox/Radio usam uma superfície de pintura Jolt; Switch Web anima track/thumb. O Switch nativo preserva seu controle e tintas de estado do sistema, enquanto o Jolt acompanha o fundo do tema. `Switch.color` é uma tinta do polegar, não o canal de texto do Jolt. A receita respeita as durações do tema, o movimento reduzido e o cleanup. Na Web, cores forçadas continuam controladas pelo sistema.

O contrato experimental permite `value.to([0, 1], ["#EFB8CF", "#ADC1FF"])` em `backgroundColor`, `borderColor` e `color` (somente superfícies de texto compatíveis). As cores portáveis usam hex de seis ou oito dígitos; cores CSS nomeadas/variáveis não fazem parte deste contrato. `borderRadius` e `borderWidth` aceitam mapeamentos numéricos. A invalidação do valor também libera seus bindings. Veja a receita [Forma](../showcase/forma).

O Jolt RC.9 amplia a pintura nativa por springs contínuas para cor e largura de borda e cor de texto em superfícies de texto simples compatíveis, além de fundo e raio. As restrições de alvo e propriedade dos canais continuam valendo; veja o [suporte de pintura nativa do Jolt](https://jolt.rafaelaugusto.dev/guide/live-springs#extended-live-paint). Recompile os apps nativos após atualizar. A Mavis delega esses canais ao Jolt sem um loop de spring em JavaScript.

## Novas plataformas e diferenças compartilhadas

Veja [Adicionar uma plataforma](./adopt-platforms) para as APIs da RC.11.1: `--add-native`/`--add-web`, `MPlatform`, movimento de listas, rolagem por seção e transições de navegação.
