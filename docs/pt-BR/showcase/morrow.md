---
title: Morrow
description: Login e cadastro compartilhados, com Button composto, abas que preservam rascunhos e avisos entre rotas.
---

# Morrow

Um espaço para começar. Login, cadastro, recuperação e uma home de boas-vindas usando o mesmo código Vue no NativeScript e na Web.

<a href="/playground/#/showcase/morrow" target="_blank" rel="noopener">Abrir Morrow ↗</a>

Os formulários guardam seus próprios rascunhos com `MTabs keepAlive`. Button demonstra uma marca feita com primitivas Mavis e um badge lateral. A fila `useToast({ scope: 'app' })` leva a confirmação até a próxima Screen. A recuperação demonstra a política de adiar avisos enquanto uma Sheet cobre a página.

É uma demonstração local, sem autenticação, envio de email ou persistência de senha. A API está no repositório para a próxima alpha; não está na alpha.3 publicada.

## Fontes compartilhadas

<details>
<summary>Auth.vue</summary>

<<< @/../examples/catalog/shared/pages/Auth.vue

</details>

<details>
<summary>AuthForm.vue</summary>

<<< @/../examples/catalog/shared/auth/AuthForm.vue

</details>
