---
title: Input
description: Campos de texto Mavis com temas, modelo string, rótulos, mensagens de validação, ações do teclado e edição multilinha no NativeScript e Vue Web.
---

# Input

`m-input` · Um campo com rótulo, ajuda e estado de validação. Usa editores nativos no iOS/Android e inputs semânticos na Web.

<ComponentPreview component="input" :height="850" />

## Uso

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { InputHandle } from '@getcortexlabs/mavis-core'

const name = ref('')
const bio = ref('')
const bioInput = ref<InputHandle>()
</script>

<template>
  <m-column gap="lg">
    <m-input v-model="name" label="Nome" returnKey="next" @submit="bioInput?.focus()" />
    <m-input ref="bioInput" v-model="bio" label="Bio" multiline :maxLength="160" />
  </m-column>
</template>
```

Registre os componentes pelo [guia de instalação da alpha](../guide/foundation). A API continua experimental.

## API

| Prop | Tipo | Padrão | Função |
| --- | --- | --- | --- |
| `modelValue / v-model` | string | `''` | Texto completo, sem trim nem conversão numérica. |
| `label` | string | obrigatório | Rótulo visível e nome do editor. |
| `placeholder` | string | `''` | Dica dentro do editor vazio. |
| `helperText` | string | `''` | Ajuda abaixo do editor. |
| `error` | string | `''` | Uma mensagem não vazia substitui a ajuda e marca o campo como inválido. |
| `type` | text \| email \| password \| tel \| url \| search | `text` | Finalidade da edição e sugestão de teclado. Na Web, email/URL também participam da validação do navegador. |
| `name / autocomplete / form` | string | não definido | Somente Web: nome no envio, sugestão de preenchimento e ID do formulário associado. |
| `required` | boolean | `false` | Somente Web: participa da validação de campo obrigatório do navegador. |
| `inputmode` | none \| text \| decimal \| numeric \| tel \| search \| email \| url | não definido | Somente Web: sugestão de teclado virtual, sem mudar o tipo do valor. |
| `disabled` | boolean | `false` | Impede edição, foco e interação. |
| `readonly` | boolean | `false` | Impede edição e preserva o valor exibido. |
| `multiline` | boolean | `false` | Permite novas linhas; exige `type="text"`. |
| `rows` | number | `3` | Inteiro positivo; altura mínima aproximada do campo multilinha. |
| `maxLength` | number | sem limite | Inteiro de 0 a 2147483647; limita edições em unidades UTF-16. |
| `autocapitalize` | none \| sentences \| words \| characters | `sentences` em text/search; `none` nos demais | Sugestão de capitalização ao teclado. |
| `autocorrect` | boolean | `true` em text/search; `false` nos demais | Sugestão de correção e de verificação ortográfica na Web. |
| `returnKey` | done \| next \| go \| search \| send | `done` | Sugestão da ação do teclado de uma linha. |
| `icon / trailingIcon` | `IconName` | `—` | Ícones Lucide decorativos dentro da caixa do editor, em tom muted ou `danger` com `error`; o padding do editor abre espaço para eles. |
| `width / grow / shrink` | dimension / number | auto / 0 / contexto | Dimensionam o campo completo, incluindo rótulo e mensagem. |
| `id` | string | gerado na Web | Identifica o editor. |
| `accessibilityHidden` | boolean | não definido | Esconde o campo completo; não esconda controles utilizáveis. |

`class`, `style` e os demais atributos não declarados se aplicam ao contêiner externo. Na Web, atributos `aria-*` e listeners de edição (`input`, `beforeinput`, `change`, `invalid`, teclado e composição) vão para o editor. Os listeners do consumidor rodam antes dos internos; `@keydown.prevent` pode cancelar a ação de Enter. `@focus` e `@blur` continuam eventos do componente, sem evento DOM no payload. Use `v-model` para o valor e as props declaradas para configurar o editor.

IDs adicionais de `aria-describedby` são combinados com o ID da ajuda/erro, sem duplicações. Um `error` sempre define `aria-invalid="true"`; sem erro, o valor ARIA fornecido é preservado. Rótulo visível e ID gerado continuam associados. Não há slot padrão. Limites numéricos inválidos e `multiline` com um tipo diferente de text lançam `RangeError` nos dois renderizadores.

## Eventos e foco

| Evento | Payload | Quando |
| --- | --- | --- |
| `update:modelValue` | string | Edições do usuário, incluindo texto intermediário de composição do IME. |
| `focus / blur` | nenhum | Mudança do foco de edição. |
| `submit` | string | Ação do teclado de uma linha, fora de uma composição ativa. |

Uma ref do componente expõe `focus()` e `blur()`. Use o `InputHandle` portável, `ref<InstanceType<typeof MInput>>()` com o import do renderizador, ou `useTemplateRef('field')` com inferência do Vue para a ref correspondente no template. As três formas expõem os mesmos dois métodos no NativeScript e na Web, sem casts ou acesso ao editor interno. `submit` mantém o foco: o consumidor decide se move para outro campo, remove o foco ou salva. No modo multilinha, Enter insere uma nova linha e nunca envia. Os rótulos do teclado são sugestões; teclado e sistema decidem aparência e disponibilidade, especialmente em teclados de telefone.

Campos readonly continuam focáveis e selecionáveis na Web. No nativo, não abrem o teclado de edição; seleção e cópia dependem do editor nativo. Campos disabled não recebem foco pelo método público.

## Formulários HTML (Web)

Com um formulário HTML associado e sem listener `@submit` no Input, Enter segue as regras de envio implícito do navegador, incluindo validação e botão padrão de envio. Um listener `@submit` no Input assume essa ação do teclado e impede o envio HTML, preservando handlers existentes de próximo campo ou salvamento. Isso também vale para `@submit.once` depois da primeira chamada. Ao adotar formulários HTML, concentre o salvamento no `@submit.prevent` do formulário e retire o handler de salvar do Input. Confirmação do IME e Enter multilinha não disparam o evento do componente.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MInput } from '@getcortexlabs/mavis-web'

const email = ref('')
const submittedEmail = ref('')
</script>

<template>
  <form @submit.prevent="submittedEmail = email" @reset.prevent="email = ''">
    <MInput v-model="email" label="E-mail" name="email" type="email" autocomplete="email" required />
    <MButton type="submit">Salvar localmente</MButton>
    <MButton type="reset">Limpar</MButton>
  </form>
  <p>{{ submittedEmail }}</p>
</template>
```

`name` inclui o editor no `FormData`; `form` permite associá-lo a um formulário fora de seus ancestrais. Input e textarea recebem os atributos HTML declarados. Substitua diretivas que alteravam esses atributos no DOM pelas props do `MInput`. As sugestões de preenchimento chegam ao elemento correto; cada gerenciador de senhas decide como usá-las.

O modelo controla o reset. Trate `@reset.prevent` no formulário e atribua os valores desejados aos modelos, como acima. Um reset HTML sem handler mantém o valor atual de cada Input Mavis e não emite atualização; ele não restaura a prop inicial. `error` é apresentação, não `setCustomValidity()`: a validação da aplicação continua no handler de envio. NativeScript ignora essas props exclusivas de HTML e mantém seu evento `submit` do teclado.

## Edição e layout

O modelo continua string, incluindo espaços, valores incompletos e zeros à esquerda. Mavis não define regras de validação nem persistência. Passe um `error` calculado pela aplicação quando necessário. Evite formatar o modelo a cada tecla: reescrever uma edição ativa pode interromper a composição do IME ou mover o cursor. Prefira formatar no blur ou submit. Os modificadores `.trim`, `.number` e `.lazy` do v-model não fazem parte do contrato desse componente.

`maxLength` limita edições do usuário sem cortar um valor fornecido externamente. A contagem usa unidades UTF-16; um emoji pode ocupar mais de uma unidade. Tipos HTML de uma linha podem remover quebras ou espaços conforme as regras do navegador; normalização entre plataformas pertence à aplicação.

Campos multilinha crescem com o conteúdo acima do mínimo aproximado de `rows`. Foram pensados para mensagens curtas e bios, não para um editor de documentos virtualizado. Use formulários dentro de [Screen com `scroll`](./screen) para manter o editor focado acima do teclado. No Android, o editor permanece no app em paisagem em vez de solicitar o editor IME em tela cheia; o host ainda precisa de `adjustResize`. Teclados flutuantes e campos maiores que o viewport exigem verificações separadas em aparelhos.

## Exemplo completo

O mesmo código funciona no catálogo NativeScript e na prévia Web, com os dois temas.

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/InputDemo.vue

</details>

## Em contexto

[Edite um perfil com prévia ao vivo, validação e salvamento local](../showcase/profile).
