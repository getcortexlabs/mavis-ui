---
title: Column
description: "Column no Mavis UI. Organize conteúdo verticalmente e preserve sua altura natural."
---

# Column

`m-column` · Organize conteúdo verticalmente e preserve sua altura natural.

<ComponentPreview component="column" :height="310" />

## Uso

```vue
<m-column gap="md" padding="lg">
  <m-text variant="title">Bem-vindo.</m-text>
  <m-button>Começar</m-button>
</m-column>
```

## API

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `gap` | token / number | `none` | Espaço entre os filhos. |
| `align` | start / center / end / stretch | `stretch` | Alinhamento horizontal. |
| `justify` | start / center / end / between / around | `start` | Distribuição vertical. |
| `wrap` | boolean | `false` | Quebra em colunas, com altura delimitada. |

Filhos Mavis preservam sua altura natural por padrão. A combinação de Column, Row e tokens de espaçamento cobre a composição cotidiana sem exigir a escolha de classes de layout nativas.

### Propriedades de composição

`padding`, `paddingX`, `paddingY`, `radius`, `grow`, `shrink`, `width`, `height` e `backgroundColor` também são aceitos. `paddingX` e `paddingY` sobrescrevem os lados correspondentes. Row, Column e Box começam sem padding; Card começa em `lg`. `grow` começa em 0; `shrink` segue o contexto do pai.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver o código</summary>

<<< @/../examples/catalog/shared/demos/ColumnDemo.vue

</details>

## Em contexto

[Veja os componentes em uma tela completa de controles de veículo](../showcase/vehicle).

Veja [Layout e texto](../guide/layout) para dimensões flexíveis, fontes ampliadas e direção RTL.
