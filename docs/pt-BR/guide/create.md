---
title: Criar um projeto
description: "Criar um projeto com Mavis, Vue, Nuxt e NativeScript."
---

# Criar um projeto

O criador monta projetos Vue + Vite, Nuxt SSR/SSG, NativeScript-Vue ou mobile + Web com uma tela compartilhada. Os templates usam Mavis **alpha.8** e Jolt **RC.10**, já publicados, com uma configuração pronta para iniciar o app.

Inicie o assistente interativo com um dos comandos:

```sh
npm create @getcortexlabs/mavis@latest
# Ou:
npx @getcortexlabs/create-mavis@latest
```

::: info Próxima versão da CLI
O novo assistente e a escolha de gerenciador estão no código-fonte e serão publicados na próxima versão. A CLI alpha.8 publicada ainda usa o assistente anterior, apenas com npm.
:::

O novo assistente usa setas e Enter, descrições das opções, validação do nome e um resumo antes de criar. Pergunta destino, host Web, renderização, tema, **npm/pnpm/Yarn** e instalação. O gerenciador usado para iniciar a CLI vem selecionado, mas você pode trocar. As instruções, scripts e o README acompanham sua escolha. Antes do resumo final, o assistente verifica o gerenciador escolhido. Se ele não estiver disponível ou não conseguir executar, você pode trocar, verificar novamente ou criar sem instalar, mantendo as respostas. Depois de alterar o PATH do shell, reinicie a CLI nesse terminal.

Flags explícitas são respeitadas. **Back** volta; **Change choices** revisa o resumo; Escape ou Ctrl-C cancela. `--dry-run` lista arquivos sem gravar; `--yes` aceita os padrões sem instalar, a menos que você passe `--install`. Diretórios existentes nunca são sobrescritos.

| Opção | Valores |
| --- | --- |
| `--target` | web, mobile, both |
| `--web` | vite, nuxt |
| `--rendering` | client (Vite), ssr ou ssg (Nuxt) |
| `--theme` | mavis, midnight |
| `--package-manager` | npm, pnpm, yarn |
| `--install` / `--no-install` | Instalar com o gerenciador escolhido ou deixar para depois |
| `--doctor` | Verificar os pré-requisitos dentro do projeto gerado |

No projeto compartilhado, `shared/Welcome.vue` contém a tela. `apps/web` e `apps/mobile` fornecem os renderizadores e serviços do app. As dependências nativas ficam separadas para carregar a versão correta do runtime Vue. O arquivo `mavis.config.json` registra as escolhas e versões; salve o lockfile depois de instalar.

Use **pnpm 10.26+**. Os arquivos `pnpm-workspace.yaml` configuram os limites dos projetos e os scripts necessários; o layout hoisted permite resolver dependências do Vite, imports compartilhados e NativeScript. Yarn Classic e Yarn moderno usam `node_modules`; os `yarn.lock` inicialmente vazios delimitam projetos separados. Em um projeto compartilhado, npm/pnpm usam `<gerenciador> run install:apps`. Com Yarn, execute primeiro `yarn install` e `yarn --cwd apps/mobile install`; depois disso, `yarn run install:apps` também funciona. Salve os dois lockfiles. O gerenciador escolhido precisa estar instalado; `--no-install` permite criar os arquivos e instalar depois.

Se o Yarn moderno informar que uma dependência recém-publicada está em quarentena, tente novamente após a idade mínima configurada no gerenciador. A CLI declara os scripts necessários para o starter, sem alterar essa política de idade.

Node 22.16+ é necessário. Mobile exige NativeScript CLI e SDKs; iOS usa macOS/Xcode, Android usa JDK/Android SDK. O doctor informa o que encontrou sem instalar ferramentas. Se a instalação falhar, os arquivos são preservados para tentar novamente.

A autoria atual é Vue. React/Next, outros frameworks, sintaxe portátil e SDUI continuam no roadmap; o criador recusa essas opções com uma indicação do planejamento. A CLI não converte código React em Vue.

## Imports, navegação e verificação de compartilhamento

O novo assistente oferece **Basic project** (`--example welcome`, padrão) e **Search, details and editing** (`--example directory`) e mostra a escolha no resumo. Em um projeto combinado, as instruções finais apontam para `shared/Welcome.vue` ou `shared/Directory.vue`. Os dois exemplos funcionam com npm, pnpm e Yarn; instalação, comandos do README e próximos passos usam o gerenciador escolhido.

A CLI no source preserva `--check-portability`, `--path`, `--json` e o fluxo de prévia/aplicação `--fix-imports` / `--fix-imports --write`. O `--doctor` inclui a análise dos fontes e os pré-requisitos. Essas adições exigem tarballs locais correspondentes do Mavis até a próxima publicação coordenada atualizar as versões geradas.

A próxima versão no source adiciona o import comum `#mavis`, navegação por aplicação, a referência completa `--example directory` e diagnóstico de portabilidade. A referência cobre **Vue + Vite SPA, Nuxt SSR/SSG e NativeScript iOS/Android**. Veja [Compartilhar telas](./sharing) para configuração, migração e disponibilidade.
