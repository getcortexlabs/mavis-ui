---
title: Box
description: "Box no Mavis UI. Sobreponha conteúdo em uma única área."
---

# Box

`m-box` · Sobreponha conteúdo em uma única área.

<ComponentPreview component="box" :height="240" />

## Uso

```vue
<m-box :height="160" radius="lg" backgroundColor="#202C25">
  <m-column padding="lg"><m-text>Camada de fundo</m-text></m-column>
  <m-column justify="end" align="end" padding="md">
    <m-button size="sm">Abrir</m-button>
  </m-column>
</m-box>
```

## API

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `radius` | token / number | `none` | Cantos da área. |
| `backgroundColor` | string | `—` | Cor de fundo opcional. |
| `width / height` | number / auto / % | `auto` | Dimensões da área. |

Todos os filhos compartilham a mesma área; o último filho é desenhado por cima. Use Row e Column dentro de cada camada para posicionar seu conteúdo. Box não fornece um sistema de linhas e colunas de tabela.

Sem `height`, Box assume a altura da camada mais alta, permitindo um fundo atrás de controles com a altura do conteúdo. Com `height` explícito, ou quando uma Row o estica, todas as camadas preenchem o Box. Um `GridLayout` do NativeScript sem `rows` preenche a altura disponível; defina `rows="auto"` ou use Box.

### Propriedades de composição

`padding`, `paddingX`, `paddingY`, `radius`, `grow`, `shrink`, `width`, `height` e `backgroundColor` também são aceitos. `paddingX` e `paddingY` sobrescrevem os lados correspondentes. Row, Column e Box começam sem padding; Card começa em `lg`. `grow` começa em 0; `shrink` segue o contexto do pai. Uma propriedade não informada deixa o estilo correspondente em paz, então um atributo simples como `paddingTop` ou `borderRadius`, ou CSS na Web, continua valendo a cada renderização; ao informar a propriedade, ela passa a controlar esse estilo.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver o código</summary>

<<< @/../examples/catalog/shared/demos/BoxDemo.vue

</details>

## Em contexto

[Veja os componentes em uma tela completa de controles de veículo](../showcase/vehicle).
