---
title: Criar um projeto
description: 'Criar um projeto Mavis para Web, iOS, Android, Mac e Windows com um comando.'
---

# Criar um projeto

A CLI cria projetos Vue para Web (Vite/Nuxt), iOS/Android e desktop nativo com NativeScript: AppKit no Mac e XAML no Windows. React, Angular, Svelte, Solid e JS/TS têm starters diretos para iOS/Android. Consulte o [guia desktop](./native-desktop) para o conjunto experimental de componentes e os requisitos.

::: info CLI RC.15
Mac/Windows com NativeScript e os starters mobile diretos estão disponíveis na RC.15. Desktop oferece doze componentes; os starters React, Angular, Svelte, Solid e JS/TS oferecem seis componentes de fundação. `--capabilities --json` informa os presets e sua cobertura.
:::

Inicie o assistente interativo com um dos comandos:

```sh
npm create @getcortexlabs/mavis@latest
# Ou:
npx @getcortexlabs/create-mavis@latest
```

::: info CLI RC.12
O assistente por teclado, seleção npm/pnpm/Yarn, exemplos básico e diretório e comandos de portabilidade estão incluídos na RC.12.
:::

O novo assistente usa setas e Enter, descrições das opções, validação do nome e um resumo antes de criar. Pergunta onde o app roda (Web, Nativo para iOS e Android, Mac e Windows, em qualquer combinação suportada), host Web, renderização, exemplo, tema, **npm/pnpm/Yarn** e instalação. O gerenciador usado para iniciar a CLI vem selecionado, mas você pode trocar. As instruções, scripts e o README acompanham sua escolha. Antes do resumo final, o assistente verifica o gerenciador escolhido. Se ele não estiver disponível ou não conseguir executar, você pode trocar, verificar novamente ou criar sem instalar, mantendo as respostas. Depois de alterar o PATH do shell, reinicie a CLI nesse terminal.

Flags explícitas são respeitadas. **Back** volta; **Change choices** revisa o resumo; Escape ou Ctrl-C cancela. `--dry-run` lista arquivos sem gravar; `--yes` aceita os padrões sem instalar, a menos que você passe `--install`. Diretórios existentes nunca são sobrescritos.

| Opção                           | Valores                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `--targets`                     | web, native, macos, windows; desktop usa Vue                                 |
| `--target`                      | Nomes anteriores: web, mobile (native), both (web,native), macos (web,macos) |
| `--web`                         | vite, nuxt                                                                   |
| `--rendering`                   | client (Vite), ssr ou ssg (Nuxt)                                             |
| `--example`                     | welcome (básico), directory (busca, detalhes e edição)  |
| `--theme`                       | mavis, midnight                                                              |
| `--package-manager`             | npm, pnpm, yarn                                                              |
| `--install` / `--no-install`    | Instalar com o gerenciador escolhido ou deixar para depois                   |
| `--doctor`                      | Verificar os pré-requisitos dentro do projeto gerado                         |
| `--capabilities`                | Mostra o que dá para criar e o que está planejado; `--json` para ferramentas |
| `--familiar`                    | vue, react, angular, svelte, solid, other: só orientação, veja abaixo        |
| `--macos-runtime`               | appkit                                                     |
| `--framework`                   | vue; plain, react, angular, svelte, solid (somente native)                   |
| `--add-macos` / `--add-windows` | Preview da adoção desktop; `--write` aplica                                  |

## O que dá para criar

`--capabilities` mostra o catálogo da CLI: cada combinação de destinos, seus hosts Web e modos de renderização, seus exemplos, as versões fixadas e as ferramentas que o projeto precisa. Cada combinação diz até onde foi levada: **publicada e validada**, **publicada, experimental** ou **no repositório** até a próxima release. O assistente, as flags, o `--doctor` e o CI leem esse mesmo catálogo, e os frameworks e hosts que ainda não existem vêm de `targetCapabilities` no core do Mavis, cada um com a issue que o acompanha.

```sh
npx @getcortexlabs/create-mavis --capabilities
npx @getcortexlabs/create-mavis --capabilities --json
```

Uma escolha que não pode ser criada é recusada antes de qualquer arquivo ser escrito, com o motivo, a issue quando é algo planejado e o que está disponível no lugar. A CLI nunca troca um framework, um destino ou um modo de renderização para fazer a combinação caber:

```text
$ create-mavis shop --targets web,macos --web vite --rendering ssr
Choose client rendering for Vite or ssr/ssg for Nuxt.
Available: --rendering client.
```

O arquivo `mavis.config.json` registra os hosts, framework, renderização, tema e versões.

No projeto compartilhado, `shared/Welcome.vue` ou `shared/Directory.vue` contém a tela, conforme o exemplo escolhido. `apps/web` e `apps/mobile` fornecem os renderizadores e serviços do app. As dependências nativas ficam separadas para carregar a versão correta do runtime Vue. O arquivo `mavis.config.json` registra as escolhas e versões (o schema 2 lista `targets`; projetos com `target` do schema 1 continuam funcionando com o doctor e o auditor); salve o lockfile depois de instalar.

Use **pnpm 10.26+**. Os arquivos `pnpm-workspace.yaml` configuram os limites dos projetos e os scripts necessários; o layout hoisted permite resolver dependências do Vite, imports compartilhados e NativeScript. Yarn Classic e Yarn moderno usam `node_modules`; os `yarn.lock` inicialmente vazios delimitam projetos separados. Em um projeto compartilhado, npm/pnpm usam `<gerenciador> run install:apps`. Com Yarn, execute primeiro `yarn install` e `yarn --cwd apps/mobile install`; depois disso, `yarn run install:apps` também funciona. Salve os dois lockfiles. O gerenciador escolhido precisa estar instalado; `--no-install` permite criar os arquivos e instalar depois.

Se o Yarn moderno informar que uma dependência recém-publicada está em quarentena, tente novamente após a idade mínima configurada no gerenciador. A CLI declara os scripts necessários para o starter, sem alterar essa política de idade.

Node 22.16+ é necessário. Mobile exige NativeScript CLI e SDKs; iOS usa macOS/Xcode, Android usa JDK/Android SDK. O doctor informa o que encontrou sem instalar ferramentas. Se a instalação falhar, os arquivos são preservados para tentar novamente.

Web e desktop usam Vue. Os starters React/Angular/Svelte/Solid/JS/TS oferecem os seis componentes nativos diretos no iOS/Android. React Web, Next e SDUI continuam no roadmap. A CLI não converte código React em Vue.

## Imports, navegação e verificação de compartilhamento

O novo assistente oferece **Basic project** (`--example welcome`, padrão) e **Search, details and editing** (`--example directory`) e mostra a escolha no resumo. Em um projeto combinado, as instruções finais apontam para `shared/Welcome.vue` ou `shared/Directory.vue`. Os dois exemplos funcionam com npm, pnpm e Yarn; instalação, comandos do README e próximos passos usam o gerenciador escolhido.

A CLI oferece `--check-portability`, `--path`, `--json` e o fluxo de prévia/aplicação `--fix-imports` / `--fix-imports --write`. O `--doctor` inclui a análise dos fontes e os pré-requisitos. Para desenvolver a partir do source, use tarballs locais correspondentes do Mavis; os projetos gerados fixam as versões anunciadas por `--capabilities`.

A alpha.9 introduziu o import comum `#mavis`, navegação por aplicação, a referência completa `--example directory` e diagnóstico de portabilidade. A referência cobre **Vue + Vite SPA, Nuxt SSR/SSG e NativeScript iOS/Android**. Veja [Compartilhar telas](./sharing) para configuração, migração e disponibilidade.

## Novas plataformas e diferenças compartilhadas

Veja [Adicionar uma plataforma](./adopt-platforms) para `--add-macos` experimental e as APIs publicadas: `--add-native`/`--add-web`, `MPlatform`, movimento de listas, rolagem por seção e transições de navegação.
