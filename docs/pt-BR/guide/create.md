---
title: Criar um projeto
description: 'Criar um projeto Mavis para Web, iOS, Android e Mac com um comando.'
---

# Criar um projeto

O criador monta um projeto para Web (Vue + Vite ou Nuxt SSR/SSG), Nativo (iOS e Android com NativeScript-Vue) e Mac, em qualquer combinação. Web e Nativo compartilham telas Vue; uma combinação com o Mac escreve as telas uma vez em `shared/` e gera cada destino, o que é [experimental](./macos-experimental). A CLI RC.13 gera templates com Mavis **RC.13** e Jolt **RC.13**, incluindo os imports compartilhados, navegação e exemplos descritos abaixo.

Inicie o assistente interativo com um dos comandos:

```sh
npm create @getcortexlabs/mavis@latest
# Ou:
npx @getcortexlabs/create-mavis@latest
```

::: info CLI RC.13
Qualquer combinação de Web, Nativo e Mac com `--targets`, o [exemplo Tasks](./tasks-example), `--capabilities` e `--familiar` fazem parte da RC.13. O `--target` das versões anteriores continua funcionando.
:::

::: info CLI RC.12
O assistente por teclado, seleção npm/pnpm/Yarn, exemplos básico e diretório e comandos de portabilidade estão incluídos na RC.12.
:::

O novo assistente usa setas e Enter, descrições das opções, validação do nome e um resumo antes de criar. Pergunta onde o app roda (Web, Nativo para iOS e Android, Mac, em qualquer combinação), host Web, renderização, exemplo, tema, **npm/pnpm/Yarn** e instalação. O gerenciador usado para iniciar a CLI vem selecionado, mas você pode trocar. As instruções, scripts e o README acompanham sua escolha. Antes do resumo final, o assistente verifica o gerenciador escolhido. Se ele não estiver disponível ou não conseguir executar, você pode trocar, verificar novamente ou criar sem instalar, mantendo as respostas. Depois de alterar o PATH do shell, reinicie a CLI nesse terminal.

Flags explícitas são respeitadas. **Back** volta; **Change choices** revisa o resumo; Escape ou Ctrl-C cancela. `--dry-run` lista arquivos sem gravar; `--yes` aceita os padrões sem instalar, a menos que você passe `--install`. Diretórios existentes nunca são sobrescritos.

| Opção                        | Valores                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `--targets`                  | Qualquer combinação de web, native e macos, por exemplo `web,native,macos`   |
| `--target`                   | Nomes anteriores: web, mobile (native), both (web,native), macos (web,macos) |
| `--web`                      | vite, nuxt                                                                   |
| `--rendering`                | client (Vite), ssr ou ssg (Nuxt)                                             |
| `--example`                  | welcome (básico), directory (busca, detalhes e edição), tasks (com Mac)      |
| `--theme`                    | mavis, midnight                                                              |
| `--package-manager`          | npm, pnpm, yarn                                                              |
| `--install` / `--no-install` | Instalar com o gerenciador escolhido ou deixar para depois                   |
| `--doctor`                   | Verificar os pré-requisitos dentro do projeto gerado                         |
| `--capabilities`             | Mostra o que dá para criar e o que está planejado; `--json` para ferramentas |
| `--familiar`                 | vue, react, angular, svelte, solid, other: só orientação, veja abaixo        |

## O que dá para criar

`--capabilities` mostra o catálogo da CLI: cada combinação de destinos, seus hosts Web e modos de renderização, seus exemplos, as versões fixadas e as ferramentas que o projeto precisa. Cada combinação diz até onde foi levada: **publicada e validada**, **publicada, experimental** ou **no repositório** até a próxima release. O assistente, as flags, o `--doctor` e o CI leem esse mesmo catálogo, e os frameworks e hosts que ainda não existem vêm de `targetCapabilities` no core do Mavis, cada um com a issue que o acompanha.

```sh
npx @getcortexlabs/create-mavis --capabilities
npx @getcortexlabs/create-mavis --capabilities --json
```

Uma escolha que não pode ser criada é recusada antes de qualquer arquivo ser escrito, com o motivo, a issue quando é algo planejado e o que está disponível no lugar. A CLI nunca troca um framework, um destino ou um modo de renderização para fazer a combinação caber:

```text
$ create-mavis shop --targets web,macos --web nuxt
With Mac, the Web app uses Vue + Vite. The shared-source compiler does not support Nuxt rendering yet.
Tracked in https://github.com/getcortexlabs/mavis-ui/issues/157.
Available: --web vite, --targets web --web nuxt.
```

`--familiar react` (ou angular, svelte, solid) diz à CLI o que você já conhece. Ela mostra uma orientação para quem vem dali e registra isso no `mavis.config.json`; quem roda os apps Web e Nativo continua sendo o Vue. O `mavis.config.json` mantém as escolhas separadas: `targets` e `apps` (toolkit, framework, host e renderização de cada app), `authoring` (templates Vue ou TSX compartilhado), `mode` (`direct` ou `portable`) e `execution` (os próprios componentes, ou código gerado a partir das fontes), além do tema, do exemplo e das versões. Configurações de versões anteriores da CLI são migradas na leitura, então o doctor e o auditor continuam funcionando nelas.

No projeto compartilhado, `shared/Welcome.vue` ou `shared/Directory.vue` contém a tela, conforme o exemplo escolhido. `apps/web` e `apps/mobile` fornecem os renderizadores e serviços do app. As dependências nativas ficam separadas para carregar a versão correta do runtime Vue. O arquivo `mavis.config.json` registra as escolhas e versões (o schema 2 lista `targets`; projetos com `target` do schema 1 continuam funcionando com o doctor e o auditor); salve o lockfile depois de instalar.

Use **pnpm 10.26+**. Os arquivos `pnpm-workspace.yaml` configuram os limites dos projetos e os scripts necessários; o layout hoisted permite resolver dependências do Vite, imports compartilhados e NativeScript. Yarn Classic e Yarn moderno usam `node_modules`; os `yarn.lock` inicialmente vazios delimitam projetos separados. Em um projeto compartilhado, npm/pnpm usam `<gerenciador> run install:apps`. Com Yarn, execute primeiro `yarn install` e `yarn --cwd apps/mobile install`; depois disso, `yarn run install:apps` também funciona. Salve os dois lockfiles. O gerenciador escolhido precisa estar instalado; `--no-install` permite criar os arquivos e instalar depois.

Se o Yarn moderno informar que uma dependência recém-publicada está em quarentena, tente novamente após a idade mínima configurada no gerenciador. A CLI declara os scripts necessários para o starter, sem alterar essa política de idade.

Node 22.16+ é necessário. Mobile exige NativeScript CLI e SDKs; iOS usa macOS/Xcode, Android usa JDK/Android SDK. O doctor informa o que encontrou sem instalar ferramentas. Se a instalação falhar, os arquivos são preservados para tentar novamente.

A autoria atual é Vue. React/Next, outros frameworks, sintaxe portátil e SDUI continuam no roadmap; o criador recusa essas opções com uma indicação do planejamento. A CLI não converte código React em Vue.

## Web, Nativo e Mac juntos

Sem Mac, as telas são templates Vue, como acima. Com Mac, as telas compartilhadas são TSX (`shared/*.lite.tsx`) e um compilador experimental gera a partir delas Vue para a Web, Vue para o NativeScript e SwiftUI para o Mac; o assistente avisa antes de criar os arquivos. O mesmo compilador lê [arquivos `.vue` compartilhados](./macos-experimental#arquivos-vue-compartilhados) para o Mac, enquanto a Web e o NativeScript os executam como estão.

| Destinos           | Estrutura                                          |
| ------------------ | -------------------------------------------------- |
| Mac                | `shared/`, `apps/macos`                            |
| Web + Mac          | `shared/`, `apps/web`, `apps/macos`                |
| Nativo + Mac       | `shared/`, `apps/mobile`, `apps/macos`             |
| Web + Nativo + Mac | `shared/`, `apps/web`, `apps/mobile`, `apps/macos` |

Os scripts da raiz geram primeiro e depois abrem o host: `generate`, `dev:web`, `ios`, `android`, `macos` e `build`. Com Mac, a Web usa Vue + Vite: o Nuxt precisa de renderização no servidor no compilador antes. O exemplo directory usa rotas Vue, por isso só existe sem Mac; com Mac, `--example tasks` cria o [exemplo Tasks](./tasks-example), um gerenciador de tarefas feito de um só código-fonte. O `--doctor` verifica Xcode e Swift só quando o Mac foi escolhido; no Linux e no Windows a CLI ainda escreve os arquivos do Mac. [O que as telas compartilhadas podem usar](./macos-experimental). Não converte telas Vue existentes.

## Imports, navegação e verificação de compartilhamento

O novo assistente oferece **Basic project** (`--example welcome`, padrão) e **Search, details and editing** (`--example directory`) e mostra a escolha no resumo. Em um projeto combinado, as instruções finais apontam para `shared/Welcome.vue` ou `shared/Directory.vue`. Os dois exemplos funcionam com npm, pnpm e Yarn; instalação, comandos do README e próximos passos usam o gerenciador escolhido.

A CLI oferece `--check-portability`, `--path`, `--json` e o fluxo de prévia/aplicação `--fix-imports` / `--fix-imports --write`. O `--check-portability` também diz, para cada arquivo compartilhado, se o [destino Mac experimental](./macos-experimental#o-que-falha-e-como) consegue compilá-lo. O `--doctor` inclui a análise dos fontes e os pré-requisitos. Para desenvolver a partir do source, use tarballs locais correspondentes do Mavis; os projetos gerados fixam a release coordenada RC.12.2.

A alpha.9 introduziu o import comum `#mavis`, navegação por aplicação, a referência completa `--example directory` e diagnóstico de portabilidade. A referência cobre **Vue + Vite SPA, Nuxt SSR/SSG e NativeScript iOS/Android**. Veja [Compartilhar telas](./sharing) para configuração, migração e disponibilidade.

## Novas plataformas e diferenças compartilhadas

Veja [Adicionar uma plataforma](./adopt-platforms) para as APIs da RC.12: `--add-native`/`--add-web`, `MPlatform`, movimento de listas, rolagem por seção e transições de navegação.
