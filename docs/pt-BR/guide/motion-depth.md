---
title: Trajetórias, profundidade e sombras
description: Mova uma superfície declarada do Mavis por uma curva, gire em torno dos eixos X e Y com a perspectiva do pai e anime a sombra do tema onde uma sombra pode se mover.
---

# Trajetórias, profundidade e sombras

Estas adições experimentais exigem **Jolt 0.1.0-rc.13 ou posterior**. Estão no repositório para a próxima versão do Mavis e ainda não fazem parte de uma versão publicada.

`surface.animate()` aceita mais três tipos de movimento: uma trajetória que é dona de `x` e `y`, `rotateX` e `rotateY`, e os quatro canais de uma sombra. Todo pedido é conferido antes de o renderizador substituir o movimento em andamento; um pedido recusado deixa a superfície como estava.

<video controls playsinline preload="none" aria-label="Vue Web · Chromium · 390 por 844 pixels CSS" src="/media/motion-depth-web-pt.mp4" style="width:100%;max-width:390px;border-radius:16px"></video>

Vue Web no Chromium, 390 por 844 pixels CSS, gravado em velocidade real na tela de checagem compartilhada.

<div style="display:flex;gap:16px;flex-wrap:wrap">
<video controls playsinline preload="none" aria-label="NativeScript · simulador de iPhone · iOS 26.2" src="/media/motion-depth-ios.mp4" style="width:100%;max-width:300px;border-radius:16px"></video>
<video controls playsinline preload="none" aria-label="NativeScript · emulador Android · API 35" src="/media/motion-depth-android.mp4" style="width:100%;max-width:300px;border-radius:16px"></video>
</div>

A mesma tela num simulador de iPhone (iOS 26.2) e num emulador Android (API 35). Os botões são acionados pela checagem que lê as views nativas, não por um dedo, e o cartão no Android mantém a sombra estática.

## Por uma trajetória

`motionPath()` descreve uma trajetória contínua com retas, curvas quadráticas e curvas cúbicas. As coordenadas são deslocamentos a partir de onde a superfície repousa, em pixels CSS na Web e em pixels independentes de densidade no NativeScript.

```ts
import { motionPath } from '@getcortexlabs/mavis-core/experimental'

const route = motionPath(
  { x: 0, y: 0 },
  { to: { x: 88, y: -12 }, control: { x: 36, y: -76 } },
  {
    to: { x: 196, y: 0 },
    control: [
      { x: 128, y: 36 },
      { x: 172, y: -64 },
    ],
  },
)

route.bounds // { left: 0, top: -41.257, right: 196, bottom: 1.55 }
route.end // { x: 196, y: 0, rotate: 69.444 }

surface.animate(
  { path: route, orient: true, opacity: [0.6, 1] },
  { duration: 1400, ease: 'easeInOut' },
)
```

`bounds` é conhecido antes de qualquer movimento, que é o que o layout precisa para reservar espaço. `end` é onde a superfície repousa depois e a direção para onde aponta com `orient`.

- A trajetória é dona de `x` e `y`. Um pedido com trajetória e qualquer um dos dois é recusado.
- `orient: true` acompanha a tangente, para artes desenhadas apontando para a direita, e passa a ser dono de `rotate` também. Sem ele, `rotate` continua seu.
- Os outros canais do mesmo pedido mantêm seus quadros.
- Uma trajetória tem de 1 a 64 segmentos, cada um com algum comprimento, e coordenadas até 100000.
- Só descritores de `motionPath()` são aceitos. `surface.set()`, vínculos, rolagem e sequências de região continuam recebendo canais numéricos.
- Com movimento reduzido, a superfície vai direto para `end`.

## Em torno de um eixo

`rotateX` e `rotateY` se juntam a `rotate` em `animate()`, `set()` e `bind()`. A projeção pertence ao pai: `MBox :perspective` define a distância para os filhos diretos.

```vue
<m-box :perspective="640">
  <m-card :motionSurface="panel">…</m-card>
</m-box>
```

```ts
panel.animate({ rotateX: 14, rotateY: -22 }, { type: 'spring', duration: 700, bounce: 0.2 })
panel.animate({ rotateY: 22 }) // rotateX mantém o ângulo
```

- Na Web a caixa recebe `perspective` do CSS, que alcança os filhos diretos. Sem uma caixa que a declare, a rotação é desenhada sem profundidade.
- No NativeScript cada view projeta em torno do próprio centro; uma superfície longe do meio da caixa não se inclina para um ponto de fuga comum como na Web. Uma superfície sem caixa acima usa a distância padrão da plataforma.
- A distância de câmera do Android não é a distância do CSS. O Mavis converte, e o mesmo número desenha a mesma projeção do iOS e da Web. O Android também recorta o filho nos limites do pai: deixe espaço em volta de uma superfície que se inclina para fora.
- Deixe a caixa com perspectiva dentro de uma região de ponteiro, não em volta dela. O Jolt lê as coordenadas do ponteiro num espaço alinhado aos eixos e recusa uma região projetada.
- Na Web uma superfície girada não tem inverso de layout em 2D. O layout compartilhado e o layout por chave do Jolt recusam uma superfície enquanto ela está girada em X ou Y, e eles e o arrasto recusam descendentes de uma caixa com perspectiva.
- `perspective` aceita de 1 a 100000.

## Com sombra

`shadowOpacity`, `shadowRadius`, `shadowOffsetX` e `shadowOffsetY` animam a única sombra que a superfície já tem. Pergunte antes:

```ts
import { elevationMotion } from '@getcortexlabs/mavis-core/experimental'

function lift(surface: MotionSurface, theme: MavisTheme, raised: boolean) {
  const shadow = surface.supports('shadow')
    ? elevationMotion(theme.elevation[raised ? 'lg' : 'sm'])
    : {}
  return surface.animate({ y: raised ? -8 : 0, ...shadow }, { type: 'spring', duration: 500 })
}
```

`elevationMotion()` lê uma elevação do tema como esses quatro canais; a receita se move entre sombras que o tema define. O componente continua dono da sombra: nada é acrescentado e a área de toque não muda.

| Plataforma | `supports('shadow')`                                    | O que se move                            |
| ---------- | ------------------------------------------------------- | ---------------------------------------- |
| Web        | sem sombra, ou um `box-shadow` externo sem espalhamento | deslocamento, desfoque e o alfa da cor   |
| iOS        | um `boxShadow` externo na view                          | deslocamento, raio e opacidade           |
| Android    | `false`                                                 | nada: a sombra fica como o tema desenhou |

O Android desenha sombras CSS a partir de uma forma em cache, e `elevation` e `translationZ` são outro modelo, com uma fonte de luz que pertence ao sistema. Não são tratados como a mesma coisa. Onde `supports('shadow')` é falso, um pedido com canal de sombra lança erro antes de substituir o movimento em andamento; a receita confere antes, como acima, ou falha onde está o engano.

`shadowColor` existe só na Web no Jolt e não faz parte deste contrato.

## O que continua igual

Trajetórias, rotação nos eixos e sombras se compõem com a camada de pressão do componente e com o restante do movimento da superfície. Um pedido novo substitui só os canais que nomeia. A reprodução pausa, avança por `progress` e para como antes, e tudo é liberado quando o componente desmonta ou a página descarrega.

## Presets do Jolt

O `createPreset()` do Jolt monta as mesmas receitas de dois pontos para os três adaptadores do Jolt. Com a curva padrão, `createPreset('fadeInUp', { distance, duration })` e `motionRecipe(theme, 'enter')` são iguais, e um teste mantém isso. O Mavis mantém a própria receita porque o preset fixa a curva, enquanto o tema escolhe `ease`, e porque o pacote core não depende do Jolt.

## Conferido

A tela compartilhada em `/checks/depth` roda as mesmas três receitas nos dois renderizadores. Chromium, WebKit e Firefox conferem a trajetória contra os limites e a pose final, a matriz de rotação sob a perspectiva do pai, a sombra entre os valores do tema, uma trajetória parada na metade, a troca de um eixo, a pressão sobre um cartão elevado, movimento reduzido e a desmontagem no meio do caminho. Um consumidor Nuxt confere a renderização no servidor, a hidratação e `KeepAlive`. Num simulador de iPhone e num emulador Android, uma sonda lê os mesmos resultados nas views nativas; `test/native-depth.md` traz os passos e os limites.
