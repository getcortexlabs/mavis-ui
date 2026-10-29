---
title: Screen
description: "Screen no Mavis UI. A superfície de uma tela, com tema e rolagem opcional."
---

# Screen

`m-screen` · A superfície de uma tela, com tema e rolagem opcional.

<ComponentPreview component="screen" :height="380" />

## Uso

```vue
<m-screen scroll>
  <m-column padding="lg" gap="md">
    <m-text as="h1" variant="title">Sua tela</m-text>
    <m-card><m-text>Seu conteúdo.</m-text></m-card>
  </m-column>
</m-screen>
```

## API

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `scroll` | boolean | `false` | Habilita rolagem vertical. |

No NativeScript, Screen representa uma Page e precisa de um host de navegação, como RouterView. Use uma Screen por tela; não coloque uma Page dentro de outra. Na Web, ela representa o elemento main, ocupa pelo menos a altura da janela e, com `scroll`, mantém a rolagem dentro dessa área. A prévia acima usa um documento separado.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver o código</summary>

<<< @/../examples/catalog/shared/demos/ScreenDemo.vue

</details>

## Em contexto

[Veja os componentes em uma tela completa de controles de veículo](../showcase/vehicle).
