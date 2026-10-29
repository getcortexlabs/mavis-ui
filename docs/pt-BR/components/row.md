---
title: Row
description: "Row no Mavis UI. Organize elementos lado a lado com espaçamento e alinhamento."
---

# Row

`m-row` · Organize elementos lado a lado com espaçamento e alinhamento.

<ComponentPreview component="row" :height="220" />

## Uso

```vue
<m-row gap="sm" align="center">
  <m-button :grow="1">Continuar</m-button>
  <m-button variant="ghost">Cancelar</m-button>
</m-row>
```

## API

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `gap` | token / number | `none` | Espaço entre os filhos. |
| `align` | start / center / end / stretch | `center` | Alinhamento no eixo transversal. |
| `justify` | start / center / end / between / around | `start` | Distribuição no eixo horizontal. |
| `wrap` | boolean | `false` | Permite novas linhas. |

`grow` pertence ao filho que deve ocupar o espaço disponível. Filhos Mavis em uma Row podem reduzir a largura para caber; use `shrink` para ajustar isso. Ative `wrap` quando os elementos precisarem passar para a linha seguinte.

### Propriedades de composição

`padding`, `paddingX`, `paddingY`, `radius`, `grow`, `shrink`, `width`, `height` e `backgroundColor` também são aceitos. `paddingX` e `paddingY` sobrescrevem os lados correspondentes. Row, Column e Box começam sem padding; Card começa em `lg`. `grow` começa em 0; `shrink` segue o contexto do pai.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver o código</summary>

<<< @/../examples/catalog/shared/demos/RowDemo.vue

</details>

## Em contexto

[Veja os componentes em uma tela completa de controles de veículo](../showcase/vehicle).
