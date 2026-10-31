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

A versão Web usa um `<dialog>` modal: o foco fica contido, Escape e um clique no fundo fecham uma sheet dispensável, e o foco volta ao elemento que a abriu. O painel entra de baixo com CSS e respeita movimento reduzido. O navegador ainda pode fechar um diálogo não dispensável depois de vários Escape; o `open` vinculado acompanha. A rolagem da página pausa enquanto a sheet está aberta.

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
