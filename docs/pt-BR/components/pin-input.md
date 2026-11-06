---
title: PinInput
---

# PinInput

::: info Em desenvolvimento
Disponível nesta branch para Vue + Vite, Nuxt e NativeScript. Ainda não incluído na versão npm publicada.
:::

<ComponentPreview component="pin-input" :height="1000" />

```vue
<MPinInput
  v-model="code"
  label="Verification code"
  :length="6"
  autocomplete="one-time-code"
  @complete="checkCode"
/>
```

| Prop                             | Type    | Default          | Contract                                       |
| -------------------------------- | ------- | ---------------- | ---------------------------------------------- |
| `modelValue / label`             | string  | empty / required | Código numérico e nome acessível.              |
| `length`                         | number  | 6                | Inteiro entre 2 e 12.                          |
| `disabled / readonly / required` | boolean | false            | Disponibilidade e validação de formulário Web. |
| `id / name / form`               | string  | —                | Id do editor e associação ao formulário Web.   |
| `error / helperText`             | string  | —                | Mensagem de validação/ajuda associada.         |

Um editor real sob células decorativas preserva seleção, colagem e preenchimento automático. Strings numéricas mantêm zeros à esquerda; dígitos de largura completa e separadores colados são normalizados. complete(value) ocorre quando uma edição do usuário completa o código, não após uma atualização programática. O componente não verifica códigos nem autentica. O preenchimento nativo depende do sistema e da configuração do aplicativo. Na Web, usa one-time-code, um campo de formulário nomeado e validação pattern; focus()/blur() atuam no editor.

<<< @/../examples/catalog/shared/demos/PinInputDemo.vue
