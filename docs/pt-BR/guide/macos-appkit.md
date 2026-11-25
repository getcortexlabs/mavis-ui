---
outline: deep
---

# Experimento com NativeScript e AppKit

A primeira implementação está em [`examples/appkit`](https://github.com/getcortexlabs/mavis-ui/tree/main/examples/appkit), acompanhada pela [#367](https://github.com/getcortexlabs/mavis-ui/issues/367). Ela executa as telas Vue originais do Directory, rotas, store reativa e serviço assíncrono de persistência como JavaScript. A interface usa views AppKit, sem WebView nem tradução da lógica do app para Swift.

## Executar pelo checkout

Use macOS em Apple Silicon, Node 22.23.3 e as ferramentas de linha de comando do Xcode:

```sh
npm ci
npm ci --prefix examples/appkit
npm run build --prefix examples/appkit
npm start --prefix examples/appkit
```

Busque por nome ou cidade, abra os detalhes, edite um lugar e salve. Os menus nativos oferecem voltar/avançar, atalhos de edição e troca entre Mavis/Midnight. Um sheet nativo de informações demonstra apresentação e cancelamento. Os dados ficam em `~/Library/Application Support/Mavis AppKit Experiment/directory.json`, isolados neste experimento.

O custom renderer do Vue liga o conjunto pequeno de componentes do Directory ao AppKit. O renderizador NativeScript-Vue atual depende das views UIKit/Android do Core, por isso este experimento tem seu próprio host e fachada. As fontes compartilhadas do Directory são importadas diretamente, sem alterações. Código que depende do DOM e módulos arbitrários do Nuxt não se tornam nativos apenas porque JavaScript roda no app.

## Movimento e distribuição

O MReveal usa o driver público `@rafaelaugusto/jolt/appkit` para aparecer gradualmente com o Core Animation. Ocultar o conteúdo ou remover a view interrompe a animação. Com Reduzir Movimento ativado, o conteúdo aparece com a opacidade final.

`npm run package --prefix examples/appkit` gera `examples/appkit/artifacts/Mavis AppKit.app`, incluindo Node, JavaScript do Vue/Directory/Jolt, runtime NativeScript e licenças. O app inicia sem Edge, npm, Node instalado ou servidor de preview. O empacotador restaura links do framework omitidos pelo npm e verifica a assinatura ad hoc. Developer ID, configuração de hardened runtime, notarização e distribuição pública ficam para uma etapa própria.

O runtime fixado é `@nativescript/macos-node-api@0.5.0-beta.0`. Seu binário arm64 declara macOS 13.3 como mínimo. Ainda não há aceite nessa versão mínima, em Intel ou Windows. A PR [#105](https://github.com/NativeScript/runtimes/pull/105) serve como referência; este build usa o pacote publicado.

`node scripts/check-appkit.mjs` empacota e move o app para fora do checkout, depois usa eventos AppKit para verificar mouse/teclado, edição, persistência, movimento, sheets e descarte. Exige uma sessão WindowServer funcional. O diagnóstico separado `--host-only` usa ações dos controles e o editor nativo; ele não substitui o aceite visual. Nenhum dos dois declara paridade de ponteiro físico ou acessibilidade. As evidências ficam em `artifacts/appkit` e são coletadas pelo job `AppKit packaged native acceptance` do CI.


Adapter do Jolt: [rafaelaugustos/jolt#516](https://github.com/rafaelaugustos/jolt/issues/516).
