---
title: Menu
---

# Menu

::: info Alpha.10
Disponível no Mavis alpha.10 para Vue Web e NativeScript. Mantenha core e renderizadores na mesma versão.
:::

<ComponentPreview component="menu" :height="800" />

```vue
<MMenu
  v-model:open="open"
  label="Actions"
  triggerLabel="Actions"
  :items="actions"
  @select="onAction"
/>
```

| Propriedade            | Tipo            | Padrão               | Descrição                                                                            |
| ---------------------- | --------------- | -------------------- | ------------------------------------------------------------------------------------ |
| `items`                | `MenuItem[]`    | `required`           | Ações com value, label, icon, disabled e destructive; grupo/separador com key única. |
| `open / v-model:open`  | `boolean`       | `false`              | Visibilidade controlada.                                                             |
| `label / triggerLabel` | `string`        | `required`           | Nome do menu e texto do acionador.                                                   |
| `placement / width`    | `Popover props` | `bottom-start / 280` | Apresentação ancorada compartilhada.                                                 |

Menu de ações de um nível, composto sobre Popover. `select(value, item)` emite apenas para ação habilitada e solicita fechamento com motivo `select`. Números e strings mantêm identidades distintas. Na Web suporta Enter/Espaço, setas, Home/End, busca pela primeira letra e Escape com retorno de foco. Setas pulam ações desabilitadas. Grupos são títulos visuais; separadores não são ações. No nativo usa botões Mavis acessíveis em camada ancorada. Submenus, seleção checkbox/radio e execução assíncrona não fazem parte deste contrato; tarefas e confirmações pertencem à aplicação.

<<< @/../examples/catalog/shared/demos/MenuDemo.vue
