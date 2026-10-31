---
title: Button
description: "Button no Mavis UI. Ações com variantes, tamanhos e estados de interação."
---

# Button

`m-button` · Ações com variantes, tamanhos e estados de interação.

<ComponentPreview component="button" :height="420" />

## Uso

```vue
<m-button variant="primary" @click="salvar">Salvar</m-button>
```

Os valores e as funções do trecho pertencem ao seu componente. O exemplo completo abaixo mostra sua inicialização.

## API

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `variant` | primary / secondary / ghost | `primary` | Aparência do botão. |
| `size` | sm / md / lg | `md` | Altura mínima, fonte e espaçamento. |
| `disabled` | boolean | `false` | Bloqueia a ação. |
| `loading` | boolean | `false` | Bloqueia a ação e mostra loadingText. |
| `loadingText` | string | `Loading…` | Texto durante o carregamento. |
| `icon / trailingIcon` | `IconName` | `—` | Ícone Lucide antes ou depois do texto, no tamanho do botão. Um botão só com ícone exige `accessibilityLabel`; sem ele a renderização lança `RangeError`. |
| `text` | string | `—` | Alternativa ao texto no slot. |
| `grow / shrink` | number | `0 / contexto` | Distribuição de espaço na linha ou coluna. |

Ícones usam a fonte Lucide embutida em 16, 20 ou 24 pontos para `sm`, `md` e `lg`, herdam a cor do texto e nunca entram no nome acessível. O evento `click` não tem payload e não é emitido enquanto `disabled` ou `loading` estiver ativo. O slot aceita texto simples ou interpolado. Para um nome acessível diferente do texto visível, passe `accessibilityLabel`. No NativeScript, o Jolt cuida do feedback de toque; na Web, o controle é um `button` com suporte a teclado e foco visível.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver o código</summary>

<<< @/../examples/catalog/shared/demos/ButtonDemo.vue

</details>

## Em contexto

[Veja os componentes em uma tela completa de controles de veículo](../showcase/vehicle).

Veja [Layout e texto](../guide/layout) para dimensões flexíveis, fontes ampliadas e direção RTL.

[Nomes acessíveis, foco e verificações com leitores de tela](../guide/accessibility).
