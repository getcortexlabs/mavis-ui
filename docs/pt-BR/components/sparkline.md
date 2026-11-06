---
title: Sparkline
---

# Sparkline

::: info Incluído na RC.12
Disponível no Mavis 0.1.0-rc.12 para Vue + Vite, Nuxt e NativeScript. Mantenha os pacotes Mavis na mesma versão.
:::

<ComponentPreview component="sparkline" :height="1000" />

```vue
<MSparkline :points="points" label="Conversations" :height="64" />
```

| Prop | Type | Default | Contract |
| --- | --- | --- | --- |
| `points` | readonly SparklinePoint[] | required | ID único, rótulo e valor finito ou null; até 100. |
| `domain` | readonly [number, number] | automatic | Domínio compartilhado dos gráficos, incluindo zero por padrão; limites explícitos devem conter todos os valores. |
| `height / color` | number / string | 64 / theme | 24–240px/DIP e cor da linha. |
| `animated / showData` | boolean | true / false | Apresentação da linha por Jolt e dados sempre expandidos. |
| `formatValue / dataLabel / emptyLabel` | function / string / string | default / View data / No data | Números personalizados e rótulos traduzíveis. |

A apresentação compacta reutiliza o domínio e as convenções de null dos gráficos. Null cria uma lacuna; não vira zero. Caminhos compatíveis interpolam; mudanças na quantidade de pontos/lacunas aplicam o novo caminho. Resumo e lista expansível de dados permanecem canônicos e acessíveis, sem depender de hover. Dados vazios ou todos null mostram o resumo vazio. Um único ponto permanece visível. Sem eixos ou controles pesados.

<<< @/../examples/catalog/shared/demos/SparklineDemo.vue
