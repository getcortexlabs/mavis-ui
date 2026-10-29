---
title: Reveal
description: "Reveal no Mavis UI. Mostre ou esconda conteúdo com uma transição curta."
---

# Reveal

`m-reveal` · Mostre ou esconda conteúdo com uma transição curta.

<ComponentPreview component="reveal" :height="300" />

## Uso

```vue
<m-button @click="visible = !visible">Detalhes</m-button>
<m-reveal :show="visible">
  <m-card><m-text>Um pouco mais de contexto.</m-text></m-card>
</m-reveal>
```

Os valores e as funções do trecho pertencem ao seu componente. O exemplo completo abaixo mostra sua inicialização.

## API

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `show` | boolean | `false` | Insere ou remove o conteúdo. |

A entrada usa opacidade e deslocamento vertical; a saída usa opacidade. O espaço no layout não é interpolado. O conteúdo permanece montado durante a saída e é removido ao fim. Jolt cuida da versão NativeScript; a versão Web usa Vue Transition e CSS enquanto o suporte Web do Jolt é acompanhado separadamente. Ambas respeitam movimento reduzido.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver o código</summary>

<<< @/../examples/catalog/shared/demos/RevealDemo.vue

</details>

## Em contexto

[Veja os componentes em uma tela completa de controles de veículo](../showcase/vehicle).

[Jolt Web · #236](https://github.com/rafaelaugustos/jolt/issues/236)
