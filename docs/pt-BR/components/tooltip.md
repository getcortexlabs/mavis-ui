---
title: Tooltip
---

# Tooltip

::: info Ainda não publicado
Disponível no código de desenvolvimento para Vue + Vite, Nuxt e NativeScript iOS/Android. Ainda não publicado no npm.
:::

<ComponentPreview component="tooltip" :height="1000" />

```vue
<MTooltip triggerLabel="About this metric" text="Active members in the last seven days." />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text / triggerLabel` | `string` | required | Texto simples de ajuda e nome acessível explícito do botão de informação. |
| `icon / variant` | `IconName / ButtonVariant` | info / ghost | Aparência do acionador próprio do componente. |
| `placement` | `PopoverPlacement` | top-start | top-start, top-end, bottom-start ou bottom-end; ajusta à área disponível. |
| `delay / disabled` | `number / boolean` | 350 / false | Atraso de hover Web em milissegundos. Foco e toque não aguardam. |

Na Web, abre por foco, hover ou clique, permite mover o cursor sobre a ajuda e fecha com Escape sem mover foco. O conteúdo não é interativo. No nativo, um acionador rotulado abre MPopover com retorno do sistema, sem exigir toque longo. O componente possui seu próprio acionador. Instruções essenciais devem continuar visíveis no formulário.

<<< @/../examples/catalog/shared/demos/TooltipDemo.vue
