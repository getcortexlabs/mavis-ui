---
title: Efeitos visuais e coleções
description: Gradientes, loading, texto, visibilidade circular e coleções retidas nas superfícies compartilhadas do Mavis.
---

# Efeitos visuais e coleções

**Em desenvolvimento no source; fora do Mavis alpha.7 e do Jolt RC.9.** Os adapters experimentais usam o commit Jolt `cc8f46799db40b42735b2c98a7f303fb0f9db1e0`, do [PR #358](https://github.com/rafaelaugustos/jolt/pull/358). `jolt-candidate.json` fixa o source; `node scripts/prepare-jolt-candidate.mjs` compila e instala seu tarball para desenvolvimento e CI. Publicar o Mavis com estes recursos exige uma versão publicada do Jolt que os contenha e rebuild nativo. O criador de projetos continua usando o par publicado alpha.7/RC.9.

| Capacidade                                  | Web          | iOS          | Android                                            |
| ------------------------------------------- | ------------ | ------------ | -------------------------------------------------- |
| Gradientes linear, radial e cônico          | Experimental | Experimental | Experimental                                       |
| Shimmer e loaders dots/bars/ring            | Experimental | Experimental | Sem suporte; placeholder estático/texto de loading |
| Entrada de texto simples e contador rolante | Experimental | Experimental | Experimental                                       |
| Reveal/conceal circular                     | Experimental | Experimental | Sem suporte; conteúdo continua visível             |
| Header retido, âncoras e refresh            | Experimental | Experimental | Experimental                                       |
| Reordenação retida por chave                | Experimental | Experimental | Experimental                                       |

Declare superfícies em `MBox`, `MCard`, `MButton` ou `MText`. As mesmas referências e callbacks funcionam na tela Vue compartilhada. O Jolt controla animação, input nativo e agendamento de frames. O app controla dados, loading, erros e decisões de foco. [Lustre](../showcase/lustre) demonstra os efeitos; [Current](../showcase/current) combina as coleções retidas.

## Gradientes

```ts
const remove = card.use((motion) => {
  const position = motion.motionValue(0.25)
  const follower = motion.springValue(position, { stiffness: 100, damping: 19 })
  const paint = motion.gradient({
    type: 'radial',
    colors: ['#214b80', '#d78eae'],
    center: { x: 0.25, y: 0.4 },
    radius: 0.8,
  })
  paint.bind({ center: { x: follower } })
  // Os handlers criados neste setup podem depois chamar position.set(0.8).
  paint.animate({ colors: ['#231b63', '#c975a1'] }, { duration: 650 })
})
```

O recurso oferece `set`, `animate`, `bind`, `stop`, `suspend`, `resume` e `dispose`. Bindings de cor e geometria tomam valores emprestados da mesma apresentação, incluindo scopes filhos. Descartar o binding preserva suas fontes; descartar uma fonte remove seus bindings dependentes. Press do componente e transformações do app mantêm seus próprios donos.

Use de duas a oito cores. A animação mantém a quantidade; substitua o recurso para mudar o tipo ou a quantidade de cores. Stops e centros usam coordenadas unitárias; raio é um múltiplo do menor lado, ângulos são graus. O `set` nativo pode mudar a quantidade, mas isso fica fora deste subconjunto compartilhado. O Jolt rejeita valores inválidos. Uma escrita posterior de background pelo app continua pertencendo ao app; evite dois donos escrevendo continuamente a mesma propriedade do gradiente.

## Loading decorativo

`<m-skeleton effect="shimmer" :animated="loading" />` seleciona o efeito Jolt; o padrão continua `pulse`. `MButton` aceita `loadingIndicator="dots|bars|ring"` junto de `loading`, `loadingText` e seu nome acessível. O indicador é decorativo, não recebe input e não representa progresso numérico. `MProgress` mantém esse significado separado.

Numa superfície do app, use `motion.shimmer()` ou `motion.loader({ style: 'ring', size: 32, color: '#214b80' })`. O recurso retornado tem `supported` e `dispose()`. `motion.supports('loader')` informa o backend. Android mantém a geometria do Skeleton e o texto de loading do Button; não simula o efeito iOS. Reduced motion, documento oculto, suspensão do app e remoção da apresentação continuam sob o lifecycle do Jolt.

## Texto e números

Passe uma string explícita em `<m-text :text="label" :motionSurface="heading" />`. Após disponibilidade, chame `heading.animateText({ by: 'word', y: 12, stagger: 45 })` ou `counter.rollTo(value, { format: n => n.toLocaleString('pt-BR') })`. Mantenha o valor final no estado do app também; o efeito não substitui o modelo.

Somente uma folha de texto simples é suportada. Slots com rich text, controles, spans formatados e contadores em múltiplas linhas ficam fora deste subconjunto. Web preserva o Text node original durante updates Vue e usa cópias visuais inertes; o nativo usa Label. A entrada é limitada a 256 grafemas; a apresentação rolante Web, a 2048 fragmentos visíveis. Conteúdo longo deve continuar como texto comum. Retarget, cancelamento e reduced motion preservam o valor final legível. Não anuncie cada frame numa live region.

## Visibilidade circular

```ts
const remove = panel.use((motion) => {
  const circle = motion.circular()
  if (!circle.supported) return
  // Acione por um controle externo, depois de mover para fora qualquer foco interno.
  circle.conceal({ origin: { x: 28, y: 28 }, duration: 750 })
  // circle.reveal() reverte a partir da apresentação atual.
})
```

O recurso mantém o layout quando oculto, remove a subárvore da interação/acessibilidade e restaura o estado que controla ao ser descartado. Mova o foco de teclado para fora antes de ocultar; um controle interno focado causa rejeição. A origem usa pixels CSS locais na Web e DIPs no nativo. Mantenha a geometria estável durante a transição; o Jolt cancela quando não pode mais usar as medidas. Android informa ausência de suporte e mantém o conteúdo disponível. É um efeito opt-in; `MReveal` mantém seu contrato existente de show controlado, foco e tamanho intrínseco.

## Uma única fonte de scroll retida

Declare `motionRegion` e `motionScroll` no mesmo `MScreen scroll`. Coloque a lista no slot padrão e três superfícies `MBox` retidas em `#overlay`: header, seção fixa e toolbar compacta. Artwork/título ficam dentro do header; o título compacto fica dentro da toolbar. Alinhe os overlays ao topo. O adapter posiciona a seção abaixo do header expandido; não adicione outra margem ou outro scroll.

Quando região, fonte e superfícies estiverem disponíveis, chame `region.scrollHeader(scroll, { header, artwork, title, toolbar, toolbarTitle, section, items, onRefresh })`. `items()` retorna linhas ordenadas `{ key: string, target }`, com chaves estáveis. O controller mede o header, reserva espaço, recolhe e fixa a seção. `remeasure()` acompanha mudanças de título/tamanho; `scrollToItem(key)` vai até uma linha declarada. `preserveAnchor(async () => { rows.value = next; await nextTick() })` preserva a chave visível durante mudanças dos dados.

Em `onRefresh(context)`, aguarde o carregamento do app, confira `context.cancelled` e então use `await context.commit(async () => { rows.value = incoming; await nextTick() })`. `refresh()` retorna um boolean de conclusão, compartilha o pedido pendente e trata erro/retry por `onRefreshError`. `cancelRefresh()`, pause, unload e descarte invalidam commits tardios. Cancelar não desfaz escritas do app nem aborta I/O arbitrário. Current usa um resultado local com atraso, sem serviço de rede.

## Reordenar as mesmas linhas

Use `region.reorder({ container, scroll, items, onCommit })` para o layout com as linhas montadas. Inclua uma superfície `handle` declarada em cada item. `MButton reorderHandle` usa a alça nativa do Jolt e um botão comum na Web; use texto simples, sem navegação, ícone ou slots de adornos. `onCommit({ key, beforeKey })` atualiza o array do app; `beforeKey: null` significa o final. Aguarde a reconciliação Vue antes de `refresh()`.

O controller oferece `move`, `moveUp`, `moveDown`, `cancel`, `pause`, `play` e `dispose`. Pause o controller e desabilite as alças juntos quando mover não estiver disponível. Web suporta pointer, long press por toque e Space/Enter, setas e Escape. O nativo usa os gestos Jolt e as ações de teclado/acessibilidade do ReorderHandle; o exemplo compartilhado também tem botões Acima/Abaixo. Linhas retidas podem ter alturas diferentes. A reordenação nativa permite até 100 linhas montadas e 16 milhões de pixels de snapshot; headers nativos retidos, até 1000 linhas. Nenhuma API virtualiza a lista.

Use o [lifetime da apresentação](./motion-regions#interaction-ownership): troca de ref, desativação KeepAlive, unload e navegação descartam os controllers. A reativação cria recursos novos a partir dos dados retidos do app. SSR não mede nem anima; o HTML permanece legível antes da hidratação.
