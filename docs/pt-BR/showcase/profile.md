---
title: Perfil
description: Um editor de perfil Mavis compartilhado com prévia ao vivo, campos com rótulos, validação, navegação pelo teclado e salvamento local.
---

# Perfil

Edite nome, e-mail e bio enquanto o cartão de perfil muda acima do formulário. A mesma tela Vue funciona em NativeScript e Web, com os temas Mavis e Midnight.

<a href="/playground/#/showcase/profile" target="_blank" rel="noopener">Abrir exemplo interativo ↗</a>

A tela controla validação e valores salvos. Enviar Nome foca E-mail; enviar E-mail foca a bio multilinha. Salvar foca o primeiro campo inválido ou encerra a edição e confirma o salvamento local. Descartar retorna aos últimos valores salvos. Sair da tela reinicia a demonstração; ela não altera uma conta nem envia dados.

`MInput` fornece editor, rótulo, ajuda e aparência do erro. `MScreen` cuida da rolagem com o teclado. A prévia do perfil, o cartão do formulário e a confirmação usam componentes Mavis existentes.

`MSwitch` adiciona preferências de notificações e resumo semanal. Salvar e Descartar incluem esses valores junto com os campos de texto. [Referência do Switch](../components/switch).

## Código

<<< @/../examples/catalog/shared/pages/Profile.vue

Veja a [referência de Input](../components/input) para edição, composição, métodos de foco e diferenças de plataforma.

`MSelect` adiciona o interesse do perfil. Salvar e Descartar incluem essa escolha, sem alterar os outros campos ao cancelar a lista. [Referência do Select](../components/select).

`MToast` confirma o salvamento sem mover o foco ou rolar o formulário. A validação continua junto aos campos. [Referência de Toast](../components/toast).
