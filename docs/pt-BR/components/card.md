---
title: Card
description: "Card no Mavis UI. Uma superfície do tema para reunir conteúdo relacionado."
---

# Card

`m-card` · Uma superfície do tema para reunir conteúdo relacionado.

<ComponentPreview component="card" :height="320" />

## Uso

```vue
<m-card gap="md">
  <m-text variant="heading">Seu espaço</m-text>
  <m-text tone="muted">Conteúdo que pertence ao mesmo contexto.</m-text>
</m-card>
```

## API

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `gap` | token / number | `none` | Espaço entre os filhos. |
| `padding` | token / number | `lg` | Espaçamento interno. |
| `radius` | token / number | `lg` | Cantos da superfície. |
| `interactive` | boolean | `false` | Toda a superfície funciona como uma ação. |
| `disabled` | boolean | `false` | Bloqueia um cartão interativo. |
| `accessibilityLabel` | string | `—` | Nome acessível da ação. |

Os filhos são organizados verticalmente. A superfície e a borda vêm do tema. Ative `interactive` para uma única ação em toda a área, com feedback de pressão. Na Web, o cartão recebe foco e responde a Enter e Espaço. `@click` não envia payload e não é emitido quando `disabled` está ativo. Informe `accessibilityLabel` para descrever a ação. Não aninhe botões, links ou campos em um cartão interativo. Também aceita as propriedades de composição abaixo.

### Propriedades de composição

`padding`, `paddingX`, `paddingY`, `radius`, `grow`, `shrink`, `width`, `height` e `backgroundColor` também são aceitos. `paddingX` e `paddingY` sobrescrevem os lados correspondentes. Row, Column e Box começam sem padding; Card começa em `lg`. `grow` começa em 0; `shrink` segue o contexto do pai.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver o código</summary>

<<< @/../examples/catalog/shared/demos/CardDemo.vue

</details>

## Em contexto

[Veja os componentes em uma tela completa de controles de veículo](../showcase/vehicle).

[Nomes acessíveis, foco e verificações com leitores de tela](../guide/accessibility).
