---
title: Imagens, física e movimento de plataforma
description: Superfícies experimentais do Jolt para imagens, partículas, formas, teclado, sheets e navegação.
---

# Imagens, física e movimento de plataforma

**Experimental no Mavis 0.1.0-rc.12.** Os adapters da Mavis RC.13 exigem o [Jolt 0.1.0-rc.13](https://github.com/rafaelaugustos/jolt/releases/tag/v0.1.0-rc.13). Mantenha todos os pacotes Mavis na mesma versão e recompile os apps nativos após atualizar. A CLI fixa Mavis RC.13 e Jolt RC.13. O plugin opcional `@rafaelaugusto/jolt-native` não é necessário para estas integrações.

<a href="/playground/#/showcase/prism?lang=pt">Prism</a> e <a href="/playground/#/showcase/orbit?lang=pt">Orbit</a> compartilham o source Vue entre Web e NativeScript. <a href="/playground/#/showcase/passage?lang=pt">Passage</a> demonstra integração com o roteador Web.

| API                            | Web                                       | iOS                                | Android                              |
| ------------------------------ | ----------------------------------------- | ---------------------------------- | ------------------------------------ |
| `particles`, `confetti`        | Canvas do Jolt                            | Emissor nativo                     | Emissor nativo                       |
| `blur`                         | Filtro CSS                                | Material nativo                    | Blur de conteúdo; depende do backend |
| `shape`                        | SVG                                       | Paths nativos                      | Paths nativos                        |
| `liquid` em MImage             | Efeito de imagem                          | Efeito nativo                      | Sem suporte                          |
| `imageEffect`                  | Imagem carregada; depende de backend/CORS | Efeito nativo ou fallback estático | Efeito nativo ou fallback estático   |
| `symbolEffect` em MIcon        | Arte do glifo                             | SF Symbol via `systemName`         | Sem suporte; glifo normal preservado |
| `physicsWorld` da região       | Física limitada a círculos                | Física limitada a círculos         | Física limitada a círculos           |
| `followKeyboard`, `onKeyboard` | VirtualKeyboard ou estimativa do viewport | Teclado nativo                     | Teclado nativo                       |
| MSheet                         | Bottom sheet dedicado do Jolt             | Bottom sheet nativo existente      | Bottom sheet nativo existente        |
| MDialog `interactive`          | Modal interativo opcional                 | Modal existente na página          | Modal existente na página            |
| Navegação Passage              | Rota assíncrona controlada pelo app       | Sem novo adapter Frame             | Sem novo adapter Frame               |

## Recursos da superfície

Use `markRaw(createMotionSurface())` e a prop `motionSurface`. `surface.use(motion => { ... })` controla os recursos criados no setup e nas ações posteriores que usam esse `motion`. Remover, substituir ou desativar a apresentação descarta esses recursos. O Jolt continua responsável pela animação e pelo agendamento de frames.

```ts
const stop = surface.use((motion) => {
  motion.particles({ source: 'top', rate: 24, colors: ['#4262c4', '#b83670'] })
  const paint = motion.blur({ amount: 0, radius: 18 })
  paint.animate(0.7, { type: 'spring', duration: 700 })
})
stop()
```

Decorações expõem `supported` e `dispose()` idempotente. Blur informa seu backend em `snapshot()`; shape permite morph de paths compatíveis e intervalos de traço. A aparência varia por plataforma. Preserve texto e controles essenciais fora das superfícies decorativas.

## Imagens e estado do app

Declare `motionSurface` em **MImage** e aguarde a disponibilidade. A referência aponta para a imagem decodificada, depois do carregamento, não para o contêiner de proporção. `imageEffect()` retorna uma promise porque o destino do dissolve precisa carregar primeiro.

```vue
<MImage v-model:src="source" :motionSurface="photo" alt="Estudo da costa" :aspectRatio="4 / 3" />
```

```ts
const operation = await motion.imageEffect('dissolve', { to: nextSource, paused: true })
operation.progress = 0.5
operation.resume()
const committed = await operation.finished
```

A conclusão no sentido normal emite `update:src`; o app precisa aceitar a atualização. Se recusar, a imagem anterior é restaurada e `finished` resolve `false`. Cancelamento, substituição, carregamento antigo e conclusão reversa não confirmam o destino. Efeitos finitos oferecem pausa, retomada, seek, reverse e finish; distortion guiado pelo ponteiro tem capacidades diferentes. Reduced motion ou backend sem suporte pode concluir imediatamente. Destinos Web precisam permitir CORS/CSP. Não há promessa de abortar a decodificação.

`liquid()` também exige MImage carregada; Android informa ausência de suporte. MIcon preserva `name` como glifo portátil; `systemName="heart.fill"` seleciona uma imagem de sistema no iOS. `supports('symbol')` consulta a arte disponível naquele momento.

## Teclado e física

`region.onKeyboard(callback)` informa visibilidade, altura, backend e precisão. O visual viewport Web fornece uma estimativa. No nativo, a precisão inicial é `unavailable` até chegar um evento. Use `motion.followKeyboard({ offset: 12 })` em uma superfície dedicada ao compositor, sem outra translação; o escopo remove a assinatura.

`await region.physicsWorld(bodies, options)` aguarda o layout nativo e rejeita apresentações antigas. Use de 1 a 16 filhos diretos quadrados, com tamanho igual ao diâmetro, cada um com sua superfície, raio e centro. Host e ancestrais devem estar sem transformação; não combine gestos ou animações de transform concorrentes. O controle oferece impulso, reset, pausa/retomada, vínculos, molas, snaps e snapshot. Jolt controla colisões, input, tempo e reduced motion. Substituir um corpo descarta seu mundo.

## Sheet, Dialog e navegação

MSheet Web delega snaps de conteúdo, arraste, scroll interno e posicionamento com teclado ao Jolt. O handle aceita teclado. Mavis mantém foco, rótulos e estado controlado. O fechamento programático de um sheet Web não dispensável é imediato porque o Jolt ignora `dismiss()` com dismissal desabilitado.

A prop opcional `interactive` de MDialog usa a apresentação Web do Jolt e um gesto para baixo no título. Fechamento respeita `dismissible`, loading e a decisão do app, com o novo motivo `swipe`. NativeScript mantém o modal acessível existente na página; essa prop não cria um modal UIKit/Core.

Passage usa o runtime da região por `useMavisWebMotion`. `scope.sharedNavigation()` aguarda a troca de rota do app e a montagem do destino. Cancelar o movimento não desfaz a navegação. A região precisa sobreviver às duas apresentações. Transições Frame nativas precisam de um proprietário mais duradouro e não são expostas por esse adapter de página.

## Gravidade, sensores e galeria Web

O Jolt [#379](https://github.com/rafaelaugustos/jolt/pull/379) adiciona as APIs Web usadas por <a href="/playground/#/showcase/field?lang=pt">Field</a> e <a href="/playground/#/showcase/gallery?lang=pt">Gallery</a>. Também são experimentais na alpha.8.

`motion.animate({ y: 160 }, { type: 'gravity', acceleration: 1800, restitution: 0.55 })` usa o compilador finito do Jolt na Web e no nativo. Gravidade aceita x/y ou valores numéricos com um ponto de chegada. A física determina a duração; duration/ease/bounce e opacity/scale são rejeitados. `velocity` com sinal permite relançar; sua ausência herda a velocidade atual. Pause/resume/progress/stop e descarte da apresentação continuam válidos. Shared layout permanece spring/tween.

`haptic: 'light'` na animação (ou `{ style: 'medium', times: [0.5, 1] }`) é opcional e acompanha o playback do Jolt. O padrão permanece silencioso. Na Web, `requestMavisWebHaptic(region, 'light')` pode ser chamado por uma ação explícita. O resultado distingue requested, unavailable, blocked e disabled; uma solicitação aceita não prova vibração física. Duração no navegador não equivale à intensidade de impacto nativa. Reduced motion e as preferências do usuário/sistema continuam respeitadas.

```ts
const rotation = motion.sensor('rotation')
const gravity = motion.sensor('gravity', { coordinates: 'interface' })
motion.bind({
  rotate: rotation.z.to([-Math.PI, Math.PI], [-180, 180]),
  x: gravity.x.to([-10, 10], [-48, 48]),
})
// Dentro de clique/toque do usuário, antes de qualquer await:
void rotation.requestPermission()
void gravity.requestPermission()
```

Rotação usa radianos relativos e quaternion Hamilton opcional (`xyzw`); gravidade usa m/s² para baixo. A permissão nativa retorna `not-required`, sem afirmar disponibilidade física. A Web exige contexto seguro e só pode pedir permissão na ação explícita. Status e snapshots informam indisponibilidade/ausência de dados. Timestamps nativos vêm do backend; os da Web são de eventos do navegador. O sensor possui e libera eixos e bindings derivados no descarte, substituição e KeepAlive. Aquisição e ajuste de coordenadas ficam no Jolt, sem polling do Mavis.

Gallery usa `scope.glass()` via `useMavisWebMotion`, com fallback sólido em forced colors, transparência reduzida ou falta de suporte. Controles filhos continuam interativos. É filtro CSS do fundo, não Liquid Glass nativo. `sharedNavigationEntry()` e `resolveListTarget()` reencontram a miniatura pela chave após paginação/reordenação; exclusão devolve foco ao título da coleção. Zoom/dispensa usam `zoomable()` do Jolt. Callbacks verificam abort antes de navegar; o app possui o histórico. Passage também usa `interactiveNavigation()` para retorno pela borda ou botão. As receitas Web não adicionam adapter nativo de Frame nem componente de vidro.
