---
title: Starter experimental para macOS
description: Gere um app nativo SwiftUI e uma tela Vue/Vite a partir de um único arquivo Mitosis.
---

# Starter experimental para macOS

A RC.12.2 traz um **experimento opcional de compilação**: uma tela básica escrita em Mitosis gera Vue na Web e SwiftUI no macOS. Isso ainda não leva os 92 componentes ao macOS nem converte telas `.vue` existentes.

```sh
npx @getcortexlabs/create-mavis@0.1.0-rc.12.2 first-light --target macos --yes
cd first-light
npm install
npm run macos
```

Escolha **macOS + Web · experimental** no assistente ou use `--target macos`. Acrescente `--package-manager pnpm` ou `--package-manager yarn` para gerar os comandos e configurações correspondentes. A compilação nativa exige **macOS 14+ e Xcode**; Web e geração também funcionam em outros sistemas. O Mitosis **0.14.2** é uma dependência de desenvolvimento apenas desse starter.

## Uma tela para editar

```text
shared/Welcome.lite.tsx
            │ Mitosis + adaptadores limitados do Mavis
            ├── web/Welcome.generated.vue → Vue + Vite + Mavis Web
            └── native/.../Welcome.generated.swift → SwiftUI / macOS
```

O exemplo inclui janela, tipografia, tokens de tema e um contador com ações de incrementar e zerar. O código nativo usa `@State`, `Text`, stacks e controles `Button` reais. O app Mac não contém WebView nem runtime JavaScript. Cada app mantém seu próprio estado: compartilhamos o código, não os dados entre processos.

Edite `shared/Welcome.lite.tsx`. Execute `npm run generate` para atualizar as duas saídas. Os comandos de abertura e build geram automaticamente; se o Vite já estiver rodando, execute generate após editar a fonte e ele recarregará a tela. No macOS, recompile e reabra. Não edite os arquivos gerados.

| Comando               | Resultado                                    |
| --------------------- | -------------------------------------------- |
| `npm run dev:web`     | Gera e abre o servidor Vue/Vite              |
| `npm run build:web`   | Gera e compila a Web                         |
| `npm run generate`    | Valida o subconjunto e gera os dois destinos |
| `npm run macos`       | Gera, compila e abre o app nativo            |
| `npm run build:macos` | Compila `dist/first-light.app` sem abrir     |

Use `pnpm run` ou `yarn run` se esse foi o gerenciador escolhido. O README acompanha essa escolha. `--doctor` verifica ferramentas e gramática; não substitui a compilação. O build Web fica em `dist/web`; o app nativo, em `dist/first-light.app`.

## Contrato inicial

| Suportado         | Limite                                                              |
| ----------------- | ------------------------------------------------------------------- |
| `MColumn`, `MRow` | Tokens literais de `gap` e `padding`                                |
| `MText`           | Um texto ou referência de estado; tokens `variant` e `tone`         |
| `MButton`         | `text` literal, `primary`/`secondary` e uma atribuição em `onClick` |
| `useStore`        | Valores iniciais string, boolean ou inteiro não negativo            |
| Ações             | Atribuição literal do mesmo tipo ou incremento inteiro              |
| Temas             | Mavis ou Midnight fixo, com cores/espaçamento/tipografia do core    |

Sintaxe e propriedades não suportadas interrompem a geração. TypeScript arbitrário, métodos, props, condicionais, listas, efeitos, serviços assíncronos, navegação, persistência e os outros componentes ainda não estão incluídos. `--add-native`, `--add-web` e o auditor Vue não migram esse projeto experimental. Nuxt e `--example directory` são rejeitados nesse destino.

Os botões Web continuam usando Mavis/Jolt. No Mac, o feedback usa SwiftUI e respeita Reduzir Movimento; **as telas geradas ainda não usam o Jolt**. O Jolt 0.1.0-rc.13 inclui um pacote SwiftUI; a adoção neste starter está na [#315](https://github.com/getcortexlabs/mavis-ui/issues/315). Tipografia e layout seguem cada host, sem promessa de igualdade exata de pixels. O `.app` é para desenvolvimento local: assinatura, notarização, instalador e distribuição na App Store não estão configurados.

A arquitetura mais ampla continua nas issues [#144](https://github.com/getcortexlabs/mavis-ui/issues/144), [avaliação do compilador](https://github.com/getcortexlabs/mavis-ui/issues/146) e [integrações nativas diretas](https://github.com/getcortexlabs/mavis-ui/issues/42). Este starter é uma primeira prova executável; não encerra essas iniciativas.
