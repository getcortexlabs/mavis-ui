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

A altura anima entre zero e `auto`, junto da opacidade, usando `animateSize` do Jolt RC.7. O conteúdo permanece montado durante o fechamento e reversões rápidas reutilizam a mesma árvore e a trajetória atual. Ao terminar a abertura, a altura volta a `auto` e acompanha alterações no conteúdo. Antes de bloquear o conteúdo em fechamento, o Mavis devolve o foco ao controle que abriu o Reveal, quando o foco ainda está dentro dele. A Web usa `inert`; o nativo bloqueia interação e foco descendente. Movimento reduzido é respeitado e desmontar/desativar cancela o trabalho. Uma região inicialmente aberta no SSR não reproduz uma entrada na hidratação.

Também aceita as propriedades de Column: `gap`, `align`, `justify`, `wrap` e as [propriedades comuns de layout](../guide/component-contract#valores-de-layout). Elas se aplicam à coluna condicional.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver o código</summary>

<<< @/../examples/catalog/shared/demos/RevealDemo.vue

</details>

## Em contexto

[Veja os componentes em uma tela completa de controles de veículo](../showcase/vehicle).

[Jolt Web · #236](https://github.com/rafaelaugustos/jolt/issues/236)

[Nomes acessíveis, foco e verificações com leitores de tela](../guide/accessibility).
