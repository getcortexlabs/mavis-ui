---
title: Text
description: "Text no Mavis UI. Hierarquia tipográfica, cores semânticas e texto acessível."
---

# Text

`m-text` · Hierarquia tipográfica, cores semânticas e texto acessível.

<ComponentPreview component="text" :height="410" />

## Uso

```vue
<m-text as="h1" variant="title">O dia é seu.</m-text>
<m-text tone="muted">Tudo pronto para começar.</m-text>
```

## API

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `variant` | display / title / heading / body / caption / overline | `body` | Escala tipográfica do tema. |
| `weight` | normal / bold / 100 … 900 (strings) | tema | Peso independente do tamanho. |
| `tone` | chave da paleta | `text` | Cor semântica. |
| `as` | p / span / h1 … h6 | `p` | Semântica independente da aparência. |
| `align` | left / center / right | `left` | Alinhamento do texto. |
| `wrap` | boolean | `true` | Permite quebrar linhas. |
| `text` | string | `—` | Alternativa ao texto no slot. |
| `grow / shrink` | number | `0 / contexto` | Distribuição de espaço. |

`variant` controla o visual; `as` controla a semântica. `as="h1"` até `h6` produz títulos HTML na Web e o papel acessível de cabeçalho no NativeScript. O slot aceita texto simples, interpolado e trechos `MSpan`. Use os layouts para compor texto com outras views.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver o código</summary>

<<< @/../examples/catalog/shared/demos/TextDemo.vue

</details>

## Em contexto

[Veja os componentes em uma tela completa de controles de veículo](../showcase/vehicle).

Veja [Layout e texto](../guide/layout) para dimensões flexíveis, fontes ampliadas e direção RTL.

## MSpan

```vue
<m-text as="h1" variant="title">
  Cada xícara <m-span emphasis="em" tone="primary">conta uma história.</m-span>
</m-text>
<m-text variant="caption" weight="bold">Um pequeno destaque.</m-text>
```

`MSpan` compõe trechos dentro de MText (ou outro MSpan). Aceita `text` ou slot textual, `weight`, `tone` e `emphasis="strong" | "em"`. Strong acrescenta importância semântica e peso bold; em acrescenta ênfase e itálico. Um peso explícito prevalece sobre o peso da ênfase. Trechos aninhados herdam fonte, tamanho, cor e ênfase; podem substituir peso e tom.

A Web usa strong/em/span com texto escapado. O NativeScript usa um único Label com FormattedString/Span: a frase mantém uma leitura contínua e a escala de texto do sistema. Espaços entre trechos são preservados; o compilador Vue ainda aplica sua política de whitespace. Use espaços explícitos em interpolações quando necessário. Quebras e alinhamento pertencem ao MText pai.

Não são aceitos HTML arbitrário, layouts, eventos ou controles dentro de MSpan. Fora de MText, ele lança um erro explicativo. Links continuam no contrato separado de navegação; cor e ênfase não tornam um trecho interativo. A prop `text` do MText tem precedência sobre o slot inteiro.

Veja [Tipografia e personalização](../guide/typography) e o [Atelier](../showcase/studio).
