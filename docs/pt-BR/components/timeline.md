---
title: Timeline
---

# Timeline

::: info Adicionado na alpha.11
Incluído no Mavis 0.1.0-alpha.11 para Vue + Vite, Nuxt e NativeScript iOS/Android. Mantenha core e renderizadores na mesma versão.
:::

<ComponentPreview component="timeline" :height="1000" />

```vue
<MTimeline :items="activity" label="Project activity"><template #default="{ item }"><MText :text="item.description" /></template></MTimeline>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `readonly TimelineItem[]` | required | Key estável, title, description, horário formatado, icon e status opcionais. |
| `statusLabels` | `Record<TimelineStatus, string>` | English labels | complete, current, upcoming e error; o estado pode ser lido sem depender da cor. |
| `label / emptyLabel` | `string` | required / No activity yet | Nome acessível da lista e mensagem vazia. |
| `default` | `slot` | — | Recebe { item, index }; conteúdo permanece montado durante mudanças de estado. |

Lista cronológica na ordem do aplicativo, com conectores, ícones de estado e entrada/indicadores Jolt. Não infere progresso nem temporizadores. Horários chegam formatados pelo app; use formatDateTime para locale e fuso. Mantenha chaves estáveis ao substituir ou reordenar dados. Movimento reduzido segue o contexto Mavis.

<<< @/../examples/catalog/shared/demos/TimelineDemo.vue
