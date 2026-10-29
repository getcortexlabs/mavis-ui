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
| `tone` | chave da paleta | `text` | Cor semântica. |
| `as` | p / span / h1 … h6 | `p` | Semântica independente da aparência. |
| `align` | left / center / right | `left` | Alinhamento do texto. |
| `wrap` | boolean | `true` | Permite quebrar linhas. |
| `text` | string | `—` | Alternativa ao texto no slot. |
| `grow / shrink` | number | `0 / contexto` | Distribuição de espaço. |

`variant` controla o visual; `as` controla a semântica. `as="h1"` até `h6` produz títulos HTML na Web e o papel acessível de cabeçalho no NativeScript. O slot aceita texto simples ou interpolado, sem componentes filhos. Use os layouts para compor texto com outros elementos.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver o código</summary>

<<< @/../examples/catalog/shared/demos/TextDemo.vue

</details>

## Em contexto

[Veja os componentes em uma tela completa de controles de veículo](../showcase/vehicle).
