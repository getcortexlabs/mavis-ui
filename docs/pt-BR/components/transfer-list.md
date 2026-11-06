---
title: TransferList
---

# TransferList

::: info Incluído na RC.12
Disponível no Mavis 0.1.0-rc.12 para Vue + Vite, Nuxt e NativeScript. Mantenha os pacotes Mavis na mesma versão.
:::

<ComponentPreview component="transfer-list" :height="1100" />

```vue
<MTransferList v-model="selectedIds" :options="options" label="Expedition kit" />
```

| Prop                                                                                 | Type                    | Default      | Contrato                                                  |
| ------------------------------------------------------------------------------------ | ----------------------- | ------------ | --------------------------------------------------------- |
| `options`                                                                            | readonly ChoiceOption[] | required     | Value único, label e disabled opcional.                   |
| `modelValue`                                                                         | readonly ChoiceValue[]  | []           | Identidades selecionadas; a aplicação aceita as mudanças. |
| `animated / disabled`                                                                | boolean                 | true / false | Layout de lista com Jolt e disponibilidade.               |
| `availableLabel / selectedLabel / searchLabel / addLabel / removeLabel / emptyLabel` | string                  | English      | Nomes dos painéis, filtros e ações de transferência.      |

Checkboxes usam Tab/Espaço; ações têm botões explícitos e não exigem arraste. Filtrar preserva marcações: a ação transfere todos os itens marcados e habilitados daquele lado, inclusive os ocultos pelo filtro. Itens desabilitados não se movem. Ids selecionados desconhecidos são preservados para catálogos assíncronos da aplicação. Abaixo de 620px/DIP, os painéis se empilham.

<<< @/../examples/catalog/shared/demos/TransferListDemo.vue
