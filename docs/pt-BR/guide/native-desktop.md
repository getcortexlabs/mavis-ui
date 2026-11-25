---
title: Mac e Windows com NativeScript
outline: deep
---

# Mac e Windows com NativeScript

A CLI RC.15 adiciona apps independentes com **AppKit no macOS** e **XAML Islands no Windows**, pelos runtimes Node-API publicados pelo NativeScript. O Vue executa as telas e o estado compartilhados; cada host renderiza controles nativos. O app empacotado não usa WebView nem servidor de desenvolvimento.

::: info Disponibilidade
Esses presets experimentais estão disponíveis em `@getcortexlabs/create-mavis@0.1.0-rc.15`. Projetos novos com `--targets macos` usam AppKit. `--capabilities --json` informa os presets e sua cobertura de componentes.
:::

## Criar e executar

```sh
npx @getcortexlabs/create-mavis@0.1.0-rc.15 studio --targets macos,windows --example directory --no-install
cd studio
npm run install:apps
npm run macos       # no macOS
npm run windows     # no Windows
```

Adicione `web` e/ou `native` para compartilhar as mesmas fontes Vue com Vite/Nuxt e iOS/Android. `--web nuxt --rendering ssr` ou `ssg` escolhe o host Web. Selecione npm, pnpm ou Yarn com `--package-manager`; os scripts e as instruções gerados seguem essa escolha.

`install:apps` instala cada runtime desktop apenas no sistema correspondente. As dependências ficam separadas em `apps/macos`, `apps/windows` e, quando selecionado, `apps/mobile`. Mantenha os pacotes desktop/mobile fora do workspace Web.

| Destino | Runtime                                     | Requisitos para compilar/executar                              | Empacotamento                                                          |
| ------- | ------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| macOS   | `@nativescript/macos-node-api@0.5.0-beta.0` | Apple Silicon, macOS 13.3+, Node 22.23.3+                      | Ferramentas de linha de comando do Xcode; `.app` com assinatura ad hoc |
| Windows | `@nativescript/windows-napi@1.0.0-beta.20`  | Windows 10 build 18362+, x64/arm64, Node 22.23.3+, Windows SDK | Pasta portátil sem assinatura, com Node incluído                       |

As versões mínimas vêm dos requisitos dos runtimes, não de testes em todas as versões e arquiteturas. O aceite hospedado cobre macOS arm64 e Windows x64 no Server 2025. O runner Server 2022 não apresentou os controles nem no exemplo XAML mínimo. Execute `create-mavis --doctor` em cada máquina de destino.

O XAML exige um manifesto de compatibilidade no executável que hospeda o runtime. O launcher usa o `mt.exe` do SDK para preparar uma **cópia local do Node dentro do projeto**; não modifica o Node instalado no sistema. `MAVIS_MT` permite selecionar a ferramenta fora da pasta padrão do SDK.

## Fontes compartilhadas e componentes

`shared/Welcome.vue` demonstra input controlado, contador e serviço assíncrono do host. `shared/Directory.vue` compartilha busca, detalhes, edição, rotas e persistência com os demais hosts selecionados. O desktop salva os dados na pasta de dados do usuário, dentro de uma pasta com o nome do projeto.

O conjunto inicial é **MScreen, MColumn, MRow, MGrid, MText, MInput, MButton, MLink, MCard, MAlert, MEmptyState e MReveal**. Ele é menor que o catálogo Vue Web/mobile. As propriedades exatas estão em `--capabilities --json` → `desktop.contracts` e no `src/contract.mjs` gerado. Propriedades não suportadas produzem erro.

- MRow divide o espaço igualmente entre os filhos. MGrid se adapta a `minColumnWidth`.
- MInput oferece texto, label, placeholder, disabled/readonly, atualização do model, submit e escape.
- AppKit fornece menus nativos do app, edição e navegação, além do atalho limitado `mod+s` em botão. Windows usa foco/teclado dos controles e navegação na tela; APIs arbitrárias de atalhos e menus ficam fora deste conjunto.
- O MReveal aparece gradualmente pelos drivers públicos do Jolt RC.18, com Core Animation no macOS e um Storyboard XAML no Windows. Com as animações do sistema desativadas, o conteúdo aparece imediatamente. Ocultar ou remover a view interrompe a animação.

O suporte desktop do runtime NativeScript não transforma os widgets iOS/Android do Core em controles desktop. O Mavis fornece um host Vue próprio para essas APIs. Módulos de servidor Nuxt e código DOM continuam específicos da Web.

## Empacotar

```sh
npm run build:macos
npm run package:macos
# No Windows:
npm run build:windows
npm run package:windows
```

A saída fica em `apps/<destino>/artifacts`. Ambos incluem Node, runtime nativo e licenças, e podem executar fora do checkout. O Mac recebe assinatura ad hoc, sem notarização. O Windows gera uma pasta sem assinatura com launcher, não um instalador. A distribuição pública precisa do seu processo de assinatura/notarização/instalador.

## Adicionar um host desktop

Dentro de um app Mavis Vue existente:

```sh
create-mavis --add-macos --shared-root src/shared --entry src/shared/Directory.vue
create-mavis --add-macos --shared-root src/shared --entry src/shared/Directory.vue --write
create-mavis --add-windows --shared-root src/shared --entry src/shared/Directory.vue --write
```

O preview verifica o conjunto declarado de componentes/props, mantém as fontes no lugar e adiciona um host isolado e scripts na raiz. Destinos existentes, scripts conflitantes, symlinks e alterações desde o preview são recusados. Instale as dependências na pasta do novo host depois. O exemplo Directory registrado recebe a ligação de rotas e persistência; numa entrada personalizada, revise `apps/<destino>/src/main.ts` e instale os providers/router do app. Não é conversão automática de qualquer aplicação Vue.

O compilador SwiftUI, os templates e os testes desse alvo estão na branch [archive/swiftui](https://github.com/getcortexlabs/mavis-ui/tree/archive/swiftui). Para criar um app macOS com AppKit ou Windows com XAML, consulte o guia de [desktop NativeScript](./native-desktop).
