---
title: Compartilhar telas entre plataformas
description: Uma tela Vue para Vue + Vite SPA, Nuxt SSR/SSG e NativeScript iOS/Android.
---

# Compartilhar telas entre plataformas

Escreva as telas com componentes Mavis, props compartilhadas e estado Vue. Cada entrada escolhe o renderer e fornece navegação e serviços do aparelho. Os destinos incluem Vue + Vite SPA, Nuxt SSR/SSG e NativeScript-Vue iOS/Android. Vue é o framework da interface; Vite é a ferramenta de desenvolvimento e build.

::: warning APIs no source — próxima versão
Os aliases, exemplo de diretório, navegação global e comandos de portabilidade abaixo são novidades no source. Ainda não fazem parte da CLI alpha.8 publicada. Os testes do repositório instalam tarballs locais correspondentes; a próxima release coordenada deve atualizar as versões geradas antes de publicar. A CLI publicada continua gerando o starter anterior.
:::

## O mesmo import e a mesma tela

O criador gera o alias `#mavis` na configuração de build e TypeScript de cada entrada. O arquivo `mavis.ts` exporta o conjunto compartilhado de componentes/composables, contratos do core e helpers de data. APIs exclusivas do Web, como `useMavisTokens`, e views nativas não entram nesse conjunto. `#shared-ui` aponta para os mesmos arquivos da aplicação.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MColumn, MInput, MButton } from '#mavis'
const query = ref('')
</script>

<template>
  <MColumn gap="md" padding="lg">
    <MInput v-model="query" label="Busca" />
    <MButton href="/results" text="Ver resultados" />
  </MColumn>
</template>
```

Vue + Vite e Nuxt resolvem os componentes para Mavis Web; NativeScript resolve para Mavis nativo. Imports individuais fornecem tipagem ao template e funcionam com instalação apenas dos serviços. Os aliases de build e TypeScript nativos também direcionam `vue` ao renderer correto. Cada entrada tem suas dependências; o bundle Web não precisa do NativeScript.

O alias é configuração do projeto, não um novo pacote npm ou uma detecção de plataforma em runtime. Aplicações existentes podem copiar os aliases e o arquivo de exports do criador sem mover suas telas para uma pasta específica. Mantenha os aliases do bundler e TypeScript apontando para o mesmo arquivo.

## Configurar navegação uma vez

```ts
import { createMavisServices } from '@getcortexlabs/mavis-web/services'
import { createRouterNavigation } from '@getcortexlabs/mavis-core'

app.use(createMavisServices({ navigation: createRouterNavigation(router) }))
```

Use Vue Router na SPA, o roteador da requisição no plugin Nuxt ou `vue-router-ns` na entrada NativeScript (com `@getcortexlabs/mavis/vue/services`). `createMavis` aceita a mesma opção `navigation` para instalação com registro global.

`MLink`, `MButton` com href e `MCard` com href passam a usar o adaptador automaticamente. As âncoras Web recebem a URL resolvida pelo roteador, incluindo base e hash. Cliques comuns preservam guards e histórico do roteador; cliques com modificadores e `_blank` mantêm o comportamento do navegador. URLs externas seguem o comportamento da plataforma. Links nativos compartilhados exigem uma URL absoluta com esquema; URLs iniciadas por `//` continuam sendo um comportamento Web. A prop `navigate` explícita tem precedência e preserva o contrato anterior de destino/callback.

`useMavisNavigation()` oferece `push`, `replace` e `back` no setup compartilhado e exige um adaptador instalado. Estado de rota, parâmetros, gestos nativos de voltar e deep links continuam no roteador. Os pequenos wrappers Nuxt do exemplo passam parâmetros como props à tela compartilhada. O adaptador não simula navegação nativa com histórico Web.

## Uma referência completa

A opção nova `--example directory` gera busca → detalhes → edição → persistência com os mesmos arquivos `Directory.vue`, `Details.vue`, `Edit.vue` e serviço de diretório em todos os presets:

```sh
create-mavis places --target both --web vite --example directory
create-mavis places --target both --web nuxt --rendering ssr --example directory
create-mavis places --target web --web nuxt --rendering ssg --example directory
create-mavis places --target mobile --example directory
```

Cada comando cria um projeto separado; use nomes diferentes para manter vários. `--example welcome` permanece como starter padrão. Projetos combinados têm `shared/`, `apps/web` e `apps/mobile`; projetos de um destino mantêm as telas compartilháveis na própria árvore de fontes.

O exemplo inclui filtro/estado vazio, MGrid responsivo, links e parâmetros reais de rota, rascunho editável, loading e nova tentativa após falha ao salvar. `MReveal` fornece a animação compartilhada de confirmação, e os botões usam o feedback existente do Mavis/Jolt. Para efeitos mais avançados, use os [contratos compartilhados de movimento](./motion), mantendo DOM e views nativas fora da tela.

Web usa localStorage depois do mount/hidratação; nativo usa ApplicationSettings. Cada requisição Nuxt cria seu próprio estado com dados iniciais determinísticos. A persistência é uma demonstração local, sem backend ou sincronização entre aparelhos. Substitua o serviço na entrada da aplicação. Hospedagem SPA com histórico precisa de fallback para `index.html`; o generate do Nuxt percorre os links reais e gera as rotas de detalhes/edição.

## Verificar portabilidade e migrar imports

Na raiz do projeto:

```sh
create-mavis --check-portability
create-mavis --check-portability --path src/modules --json
create-mavis --fix-imports          # prévia
create-mavis --fix-imports --write  # aplicar as trocas seguras
```

O verificador informa arquivo, linha, coluna e sugestão para imports de renderer/roteador, globais do navegador, elementos de plataforma, diretivas DOM e CSS/class/style que precisam de revisão. Ele segue imports relativos dentro do projeto, ignora diretórios gerados/dependências e recusa links simbólicos. Imports externos desconhecidos exigem revisão; dependências auditadas podem entrar em `portability.allowImports` no `mavis.config.json`. `--doctor` inclui a análise junto aos pré-requisitos. Achados retornam status 1 para uso em CI.

A migração troca apenas imports nomeados compostos inteiramente de exports compartilhados para `#mavis`, preservando aliases locais. Ela exige a configuração gerada dos destinos. Não altera namespaces, imports misturados com APIs exclusivas do Web, HTML, CSS, roteadores, armazenamento ou APIs do aparelho. A prévia mostra as mudanças; erro de sintaxe impede a escrita. Revise o diff e confira os tipos nos dois destinos depois de aplicar.

É um diagnóstico conservador do código, não um compilador portátil ou certificado das dependências. Comportamento dinâmico e capacidades específicas continuam exigindo testes por destino. O contrato útil é uma tela única validada nos destinos desejados, com serviços explícitos nas fronteiras da plataforma.
