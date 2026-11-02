---
title: Steps
description: Navegação controlada entre etapas, com uma receita de cadastro que preserva os editores visitados.
---

# Steps

Navegação controlada entre etapas, com uma receita de cadastro que preserva os editores visitados.

::: info Ainda não publicado
Disponível no código-fonte; não faz parte da alpha.4.
:::

<ComponentPreview component="steps" :height="900" />

| Prop | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `steps` | `readonly StepOption[]` | obrigatório | Lista ordenada e não vazia. |
| `modelValue` | `ChoiceValue \| null` | `null` | Etapa atual, sem seleção automática. |
| `label` | `string` | obrigatório | Nome da navegação. |
| `loading / disabled` | `boolean` | `false` | Impede pedidos de mudança. |
| `currentLabel / completeLabel / errorLabel` | `string` | `Current / Complete / Needs attention` | Rótulos de estado traduzidos pela aplicação. |

`StepOption` é `{ value, label, disabled?, status?: 'pending' | 'complete' | 'error' }`. IDs numéricos e textuais permanecem distintos. `update:modelValue(value)` pede uma etapa diferente e habilitada. Foco sozinho não altera a etapa; Tab e a ativação normal dos botões seguem a plataforma. Na Web, a ação atual recebe `aria-current="step"`.

A aplicação controla painéis, rotas, retorno e permissão para avançar. A receita usa `KeepAlive` com chaves estáveis: datas parcialmente digitadas e arquivos selecionados permanecem ao retornar a um painel visitado. Ela valida antes de avançar, permite voltar, registra campos no pai e revela a etapa antes de focar o erro. Nada é enviado a um servidor; a conclusão é uma demonstração local cancelável.

Para SSR, forneça a mesma etapa e rascunho iniciais no servidor e cliente. Não serialize handles, controladores, transportes ou instâncias. Mudanças de rota e persistência após recarregar continuam na aplicação. O componente não impõe um wizard linear nem importa um roteador.

<<< @/../examples/catalog/shared/demos/StepsDemo.vue
