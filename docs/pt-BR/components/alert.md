---
title: Alert
description: Avisos persistentes no fluxo da tela, com tons semânticos, ações e fechamento controlado no NativeScript e na Web.
---

# Alert

`MAlert` coloca uma mensagem no layout normal da tela. Use para informações que devem continuar disponíveis enquanto a pessoa decide o próximo passo.

::: info Próxima alpha
Disponível no repositório para a próxima alpha; não incluído na `0.1.0-alpha.3`.
:::

<ComponentPreview component="alert" :height="1000" />

## Uso

```vue
<m-alert
  v-if="visible"
  title="Não foi possível baixar"
  description="Confira a conexão e tente novamente."
  tone="error"
  dismissible
  closeLabel="Fechar aviso de download"
  @close="visible = false"
>
  <template #actions><m-button @click="retry">Tentar novamente</m-button></template>
</m-alert>
```

`visible` e `retry` pertencem ao app. Fechar emite uma solicitação; o aviso continua montado até o app removê-lo.

## Propriedades

| Propriedade | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `title` | `string` | obrigatório | Título não vazio da mensagem. |
| `description` | `string` | vazio | Texto complementar opcional. |
| `tone` | `info \| success \| warning \| error` | `info` | Ícone e cor semântica da borda. |
| `dismissible` | `boolean` | `false` | Mostra o botão de fechar. |
| `closeLabel` | `string` | `Dismiss message` | Nome acessível do botão; traduza no app. Não pode ser vazio quando dismissible. |
| `announce` | `boolean` | `false` | Habilita anúncios de mensagens dinâmicas, sem mover o foco. |
| `width / grow / shrink` | dimensão / número / número | `auto / 0 / contexto` | Participação no layout, como Column. |
| `id / accessibilityHidden` | string / boolean | — / false | Identificador opcional e exclusão da árvore acessível. |

Títulos ou rótulos de fechar obrigatórios vazios lançam `TypeError`. O texto quebra linha naturalmente; as ações ficam abaixo da mensagem em uma Row com wrap. Não há altura fixa.

## Ações e fechamento

O slot nomeado `actions` aceita controles do app. O botão de fechar emite `close` sem payload e fica separado dessas ações. Não há slot default, timeout, fila, overlay, animação de entrada ou captura de foco. [Toast](./toast) oferece feedback passageiro; [Dialog](./dialog) pede uma decisão modal.

Info usa o accent do tema; sucesso, atenção e erro usam suas cores semânticas. Os ícones são decorativos. Escreva um título que comunique o estado sem depender apenas da cor.

## Anúncios

Avisos estáticos começam com `announce=false`. Ative para resultados inseridos ou atualizados quando a leitura da mensagem ajudar. A Web usa uma região `status`, ou `alert` para o tom error, ao redor do título e da descrição; as ações ficam fora dela. O anúncio no carregamento inicial varia conforme o navegador e o leitor de tela.

No nativo, título e descrição formam um grupo acessível; os botões continuam acessíveis individualmente. Quando carregado, `announce=true` solicita um anúncio da plataforma para um novo texto; o mesmo texto em uma página retida não é anunciado novamente. Trabalho pendente é cancelado no unload/unmount. A fala e a interrupção dependem do leitor ativo; mudar apenas o tom não repete o anúncio nativo. Alert não move o foco nem gerencia a navegação do app.

A [Library](../showcase/library) usa avisos para downloads cancelados, com falha e concluídos, com ações de tentar novamente e ver os itens salvos.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/AlertDemo.vue

</details>
