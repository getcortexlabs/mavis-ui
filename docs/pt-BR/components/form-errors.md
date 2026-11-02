---
title: Form Errors
description: Um resumo de erros que abre a seção correspondente antes de focar o editor.
---

# Form Errors

Um resumo de erros que abre a seção correspondente antes de focar o editor.

::: info Disponível na alpha.5
Disponível no Mavis alpha.5.
:::

<ComponentPreview component="form-errors" :height="900" />

Crie um `useFormController()` por formulário. Registre campos com `useFormField(form, { name, label, target, enabled?, reveal? })`: `target` retorna um `InputHandle`. O controlador não busca IDs no DOM nem guarda os valores. `reveal` pode ativar uma etapa em cache e aguardar `nextTick()` antes de obter o editor montado.

| Prop | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `form` | `FormController` | obrigatório | Controlador pertencente ao formulário/requisição. |
| `title` | `string` | `Review these fields` | Título visível; traduza na aplicação. |
| `announce` | `boolean` | `false` | Usa papel alert na Web; normalmente é uma região nomeada. |

`form.setErrors([{ field, message }])` substitui o resumo sem mover o foco automaticamente. `await form.focusFirstError()` é uma ação explícita da aplicação, normalmente após um envio inválido. Campos não registrados ou desabilitados são ignorados no foco; suas mensagens continuam visíveis. Clicar em um erro disponível chama `focusError(field)` e emite `focus(field, focused)`. Uma abertura tardia de seção não pode roubar o foco de uma solicitação mais recente.

`await form.validate(async ({ current, onCancel }) => errors)` retorna `valid`, `invalid`, `cancelled` ou `busy`. Envios simultâneos retornam `busy`. Chame `form.invalidate()` quando o rascunho mudar: respostas e falhas antigas não substituem erros novos. Registre o cancelamento do transporte com `onCancel`. Erros de transporte atuais são relançados para a aplicação apresentar; não viram erros de campo. Não há transporte, biblioteca de schema ou regras de negócio embutidas.

Os composables liberam registros e controladores ao destruir o escopo. Campos em cache só expõem o handle enquanto ativos; use `reveal` para erros em outra etapa. Registre todos os campos no formulário pai se o resumo precisar alcançar etapas ainda não visitadas. Valores e retenção dos painéis ficam na aplicação. SSR renderiza os erros fornecidos, sem focar nem validar automaticamente.

<<< @/../examples/catalog/shared/demos/FormDemo.vue
