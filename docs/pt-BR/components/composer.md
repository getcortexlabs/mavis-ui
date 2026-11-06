---
title: Composer
---

# Composer

::: info Em desenvolvimento
Disponível nesta branch para Vue + Vite, Nuxt e NativeScript. Ainda não incluído na versão npm publicada.
:::

<ComponentPreview component="composer" :height="1000" />

```vue
<MComposer
  v-model="draft"
  v-model:attachments="attachments"
  label="Your message"
  @attach="chooseFiles"
  @submit="send"
/>
```

| Prop                                                                | Type                          | Default               | Contract                                              |
| ------------------------------------------------------------------- | ----------------------------- | --------------------- | ----------------------------------------------------- |
| `modelValue / attachments`                                          | string / ComposerAttachment[] | empty / []            | Rascunho e anexos controlados com ids únicos e nomes. |
| `label / placeholder / error`                                       | string                        | —                     | Nome, placeholder e mensagem de validação.            |
| `rows / maxLength`                                                  | number                        | 2 / unlimited         | Linhas iniciais e limite opcional.                    |
| `loading / disabled / readonly`                                     | boolean                       | false                 | Estados de edição e envio.                            |
| `followKeyboard / keyboardOffset / shortcut`                        | boolean / number / boolean    | false / 0 / true      | Acompanhamento de teclado e Ctrl/Cmd+Enter Web.       |
| `attachable / attachLabel / removeLabel / sendLabel / sendingLabel` | boolean / string              | true / English labels | Ação de anexo e controles traduzíveis.                |

Editor multilinha controlado com nomes de anexos removíveis. A aplicação seleciona arquivos, envia mensagens e limpa o rascunho após sucesso; o componente não envia nem limpa automaticamente. submit recebe { text, attachments }. Ctrl/Cmd+Enter envia na Web; Enter mantém a quebra de linha e a composição IME é preservada. loading bloqueia edição e ações. followKeyboard é opcional para uma camada própria; deixe desativado dentro de Screen ou Sheet que já redimensiona para evitar ajustes duplicados. A geometria Web é estimada; no nativo, Jolt fornece o acompanhamento. Slot default para conteúdo complementar. focus()/blur() atuam no editor.

<<< @/../examples/catalog/shared/demos/ComposerDemo.vue
