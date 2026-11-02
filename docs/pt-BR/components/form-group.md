---
title: Form Group
description: Agrupa editores sob um título visível e uma descrição opcional. Valores, validação e envio continuam na aplicação.
---

# Form Group

Agrupa editores sob um título visível e uma descrição opcional. Valores, validação e envio continuam na aplicação.

::: info Ainda não publicado
Disponível no código-fonte; não faz parte da alpha.4.
:::

<ComponentPreview component="form-group" :height="900" />

| Prop | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `label` | `string` | obrigatório | Título visível e não vazio. |
| `description` | `string` | `''` | Explicação opcional do grupo. |
| `id` | `string` | gerado | Identidade estável; a Web associa título e descrição. |

O slot padrão recebe seus campos. O componente não cria um `<form>` HTML, adiciona regras de obrigatoriedade ou intercepta Enter. Na Web, envolva a receita em um formulário nativo e use `type="submit"` no botão. No NativeScript, a ação chama a mesma função de envio. A apresentação nativa usa os mesmos títulos e controles; a semântica de agrupamento segue as primitivas nativas.

Use [Form Errors](./form-errors) para conectar o resumo aos métodos públicos `focus()` de Input, DatePicker, DateRangePicker ou Combobox.

<<< @/../examples/catalog/shared/demos/FormDemo.vue
