---
title: Sheet
description: "Sheet no Mavis UI. Apresente conteúdo e ações em uma camada acima da tela, com gestos nativos no NativeScript e um diálogo modal na Web."
---

# Sheet

`m-sheet` · Conteúdo e ações em uma camada acima da tela.

<ComponentPreview component="sheet" :height="440" />

## Uso

```vue
<m-button @click="open = true">Filtros</m-button>
<m-sheet v-model:open="open" title="Filtros" closeLabel="Fechar" @close="ultimo = $event">
  <m-text>Escolha o que mostrar.</m-text>
  <m-button @click="open = false">Aplicar</m-button>
</m-sheet>
```

Os valores e as funções do trecho pertencem ao seu componente. O exemplo completo abaixo mostra sua inicialização.

## API

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `open` | boolean | `false` | Apresenta ou recolhe a sheet. Use `v-model:open`. |
| `title` | string | — | Cabeçalho e nome acessível. Sem ele, `accessibilityLabel` é obrigatório. |
| `accessibilityLabel` | string | — | Obrigatório quando o título está ausente ou em branco; não adiciona cabeçalho visível. |
| `dismissible` | boolean | `true` | Permite fechar pelo fundo, Escape, gesto de voltar, arrasto para baixo e botão de fechar. |
| `fullscreen` | boolean | `false` | Ocupa a altura útil em vez da altura do conteúdo. |
| `closeLabel` | string | `Close` | Nome acessível do botão de fechar. |
| `padding` | token \| number | `lg` | Espaço interno do painel. |
| `gap`, `align` | propriedades de Column | `none`, `stretch` | Aplicam-se à coluna de conteúdo. |

| Evento | Payload | Quando |
| --- | --- | --- |
| `update:open` | boolean | A sheet pede para abrir ou fechar. |
| `close` | `button` \| `backdrop` \| `escape` \| `back` \| `swipe` \| `program` | Cada pedido de fechamento, com o motivo. `program` significa que o app definiu `open` como false. |

A sheet é controlada: uma dispensa emite `update:open` com `false` e `close` com o motivo, e o painel sai quando `open` muda. O conteúdo é montado ao abrir e removido depois que a sheet termina de recolher. Uma sheet sem `title` ou `accessibilityLabel` lança RangeError. `dismissible` e `fullscreen` são lidos quando a sheet abre.

## Nome do Sheet

Um Sheet sempre exige nome, mesmo com `open=false`. O `title` sem espaços nas extremidades tem precedência e aparece como cabeçalho. Quando o título está ausente ou contém apenas espaços, o `accessibilityLabel` sem espaços nas extremidades fornece o nome sem cabeçalho. Se nenhum contém texto, o render lança `RangeError`.

Imports diretos e componentes registrados globalmente exigem `title` ou `accessibilityLabel` nos tipos públicos. Tipos não determinam se uma string dinâmica está em branco, então a validação continua no setup/render e nas atualizações. Para um título carregado de forma assíncrona, forneça um `accessibilityLabel` estável durante a carga ou monte o Sheet com `v-if` quando o nome estiver disponível; apenas definir `open=false` não adia a validação.

## NativeScript

O painel fica dentro da página, acima do conteúdo da Screen, movido pelo [bottom sheet do Jolt](https://jolt.rafaelaugusto.dev/guide/bottom-sheet): alça arrastável com ações de acessibilidade Expand, Collapse e Dismiss, mola que acompanha o dedo, rolagem interna que continua o gesto, fundo escurecido, acompanhamento do teclado e voltar do Android. O conteúdo encaixa na própria altura, ou na altura útil com `fullscreen`. `MSheet` exige uma `MScreen` como ancestral. Enquanto a sheet está aberta, a Screen esconde o conteúdo coberto das tecnologias assistivas e o VoiceOver trata o painel como modal; o foco volta ao elemento anterior depois que a sheet recolhe.

No iOS, o fundo escurecido cobre toda a janela e a superfície do painel chega à borda inferior. O conteúdo fica acima do indicador de início e fora do recorte da câmera em paisagem; os espaçamentos acompanham a rotação com a sheet aberta. Isso também vale dentro de uma Screen com rolagem.

A navegação por Frame do Core respeita o evento de voltar cancelado. Um router que controla o voltar do Android, como o vue-router-ns, consulta um reivindicante primeiro:

```ts
app.use(
  createMavis({
    theme: mavis,
    darkTheme: midnight,
    claimSystemBack: (claimant) => router.claimSystemBack(claimant),
  }),
)
```

Modais com rota e pilha própria continuam sendo um recurso do vue-router-ns; `MSheet` é um componente dentro de uma página.

## Web

O renderizador Web mantém um `<dialog>` modal para conter o foco, tratar Escape/fundo e restaurar o acionador que estava focado. O Jolt controla o deslocamento do painel interno, incluindo entrada, interrupção e saída. O fundo tem sua própria transição CSS de cor; sua opacidade não acompanha a distância do drag.

Arraste somente a alça. A posição e a velocidade da soltura levam a mola para aberto ou fechado; uma dispensa completa emite `swipe`. Pegar um snap em andamento continua da posição visível. O botão de fechar oferece o mesmo resultado sem gesto. Se o app rejeitar a solicitação controlada de fechar, o painel volta a abrir. `dismissible=false` desativa a alça e os controles usuais de dispensa. A página para de rolar enquanto o modal está aberto; a rolagem do corpo continua independente da alça.

A origem da transformação fica fixa no canto superior esquerdo. Mudanças de altura do conteúdo, janela ou viewport visual do teclado cancelam o contato, medem novamente os dois destinos e retomam a intenção atual de abrir/fechar. Zoom por pinça mantém a geometria atual. Essa política limitada evita recalcular a âncora; não oferece transferência de rolagem aninhada nem suporte a ancestrais transformados/com zoom. Uma conclusão antiga não fecha uma apresentação reaberta. O nativo mantém sua própria implementação de geometria e gestos.

O movimento espacial segue a preferência de movimento reduzido em tempo real; a transição CSS do fundo também é removida nessa preferência. O navegador ainda pode forçar o fechamento de um diálogo não dispensável após Escape repetido; o estado vinculado acompanha.

## Limites

- Pontos de encaixe além da altura do conteúdo e da altura total ainda não são expostos.
- As ações de acessibilidade Expand e Collapse da alça nativa usam os rótulos em inglês do Jolt.
- Uma sheet nativa segurada no meio da dispensa volta a abrir e emite `update:open` com `true`.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver o código</summary>

<<< @/../examples/catalog/shared/demos/SheetDemo.vue

</details>

## Em contexto

[Nomes acessíveis, foco e verificações com leitores de tela](../guide/accessibility).

[Bottom sheet do Jolt](https://jolt.rafaelaugusto.dev/guide/bottom-sheet) · [Jolt Web · #236](https://github.com/rafaelaugustos/jolt/issues/236)

[Veja as gravações compartilhadas do Kinetic, incluindo Sheet](../showcase/kinetic).

O Mavis alpha.5 com Jolt RC.7 permite overlays dentro de cards animados. Veja os [limites de composição e o fallback estático](../guide/motion-regions#sheets-dentro-de-conteudo-animado).


As integrações experimentais de imagem, ícone, Sheet e Dialog estão descritas em [Imagens e física](../guide/platform-motion). Exigem o candidato Jolt do source; ainda não estão publicadas.
