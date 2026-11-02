---
title: Stack
description: "Composição responsiva sem recriar os filhos."
---

# Stack

`MStack` muda direção, espaço e alinhamento conforme a largura do contêiner. Os filhos continuam montados, preservando edição e foco.

<ComponentPreview component="stack" lang="pt" :height="330" />

```vue
<m-stack gap="sm" :responsive="[
  { at: 640, direction: 'row', gap: 'lg' },
  { at: 1000, gap: 'xl', align: 'center' },
]">
  <m-input v-model="name" label="Nome" :grow="1" />
  <m-button>Continuar</m-button>
</m-stack>
```

| Prop | Tipo | Padrão | Finalidade |
| --- | --- | --- | --- |
| `direction` | row / column | `column` | Direção inicial. |
| `responsive` | StackBreakpoint / readonly StackBreakpoint[] | — | Sobrescritas por largura mínima do conteúdo. |
| `gap` | token / number | `none` | Espaço inicial. |
| `align` | start / center / end / stretch | `stretch` | Alinhamento transversal. |
| `justify` | start / center / end / between / around | `start` | Distribuição no eixo principal. |
| `wrap` | boolean | `false` | Quebra dos filhos. |

Cada breakpoint declara `at` positivo e único e, opcionalmente, `direction`, `gap`, `align`, `justify` e `wrap`. As sobrescritas acumulam em ordem crescente. A largura é a área de conteúdo do Stack depois do padding: pixels CSS na Web e DIP no NativeScript, não a largura do dispositivo. As props comuns de layout também são aceitas.

SSR e a primeira renderização de hidratação usam o layout inicial. A medição aplica os breakpoints sem recriar os filhos. Escolha uma base utilizável, normalmente uma coluna. O NativeScript mede novamente quando o layout ou a orientação muda. Esta API compõe layouts flex responsivos; não é um motor de CSS grid. Use Stacks aninhados para grupos de conteúdo.

<<< @/../examples/catalog/shared/demos/StackDemo.vue
