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

O assistente pergunta destino, host Web, renderização, tema e instalação. Flags explícitas são respeitadas. `back` volta; `cancel` ou Ctrl-C cancela. `--dry-run` lista arquivos sem gravar; `--yes` aceita os padrões. Diretórios existentes nunca são sobrescritos.

| Opção | Valores |
| --- | --- |
| `--target` | web, mobile, both |
| `--web` | vite, nuxt |
| `--rendering` | client (Vite), ssr ou ssg (Nuxt) |
| `--theme` | mavis, midnight |
| `--install` / `--no-install` | Instalar com npm ou deixar para depois |
| `--doctor` | Verificar os pré-requisitos dentro do projeto gerado |

No projeto compartilhado, `shared/Welcome.vue` contém a tela. `apps/web` e `apps/mobile` fornecem os renderizadores e serviços do app. As dependências nativas ficam separadas para carregar a versão correta do runtime Vue. O arquivo `mavis.config.json` registra as escolhas e versões; salve o lockfile depois de instalar.

Node 22.16+ é necessário. Mobile exige NativeScript CLI e SDKs; iOS usa macOS/Xcode, Android usa JDK/Android SDK. O doctor informa o que encontrou sem instalar ferramentas. Se npm falhar, os arquivos são preservados para tentar novamente.

A autoria atual é Vue. React/Next, outros frameworks, sintaxe portátil e SDUI continuam no roadmap; o criador recusa essas opções com uma indicação do planejamento. A CLI não converte código React em Vue.
