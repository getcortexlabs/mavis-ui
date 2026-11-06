---
title: SpeedDial
---

# SpeedDial

::: info Em desenvolvimento
Disponível nesta branch para Vue + Vite, Nuxt e NativeScript. Ainda não incluído na versão npm publicada.
:::

<ComponentPreview component="speed-dial" :height="1000" />

```vue
<MSpeedDial
  v-model:open="open"
  label="Create something"
  :actions="actions"
  @select="handleAction"
/>
```

| Prop                           | Type                        | Default                      | Contract                                           |
| ------------------------------ | --------------------------- | ---------------------------- | -------------------------------------------------- |
| `label / actions`              | string / SpeedDialAction[]  | required                     | Acionador visível e ações nomeadas.                |
| `open`                         | boolean                     | false                        | Controlado por v-model:open.                       |
| `direction`                    | up or down                  | up                           | Direção preferencial.                              |
| `disabled / icon / closeLabel` | boolean / IconName / string | false / plus / Close actions | Disponibilidade, ícone e ação explícita de fechar. |

Ações rápidas controladas usando o ciclo de vida de Popover. Cada ação tem value único, label, icon e disabled opcionais. A seleção emite select(value, action) e solicita fechamento. A operação pertence à aplicação. Jolt anima o painel e a entrada sequencial; teclado e foco continuam sob responsabilidade de Popover. Escape, clique externo e Voltar nativo seguem as regras da camada existente. direction escolhe abertura preferencial para cima/baixo; na Web, ajusta ao viewport. No nativo, usa a camada de popover existente.

<<< @/../examples/catalog/shared/demos/SpeedDialDemo.vue
