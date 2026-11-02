---
title: Arquitetura e suporte
description: Renderizadores atuais, contratos independentes de framework e os limites entre uso direto, autoria portátil e interfaces dirigidas pelo servidor.
---

# Arquitetura e suporte

Hoje o Mavis renderiza componentes Vue na Web e views NativeScript-Vue no iOS e Android. Uma tela compartilhada usa a mesma API de componentes; cada aplicação cuida da navegação, dos dados e dos serviços da plataforma.

A tabela vem de `targetCapabilities`, exportado por `@getcortexlabs/mavis-core`, e descreve o repositório. **As melhorias de Nuxt/hidratação ainda não foram publicadas; a alpha.4 do npm tinha somente uma verificação básica de importação/renderização SSR.** Experimental significa um contrato validado que ainda pode mudar, sem prometer todos os ambientes ou modos de deploy.

<CapabilityTable locale="pt" />

A validação Nuxt usa SSR em produção com `node-server`. A rota pré-renderizada `/static` também funciona em um servidor de arquivos, sem API em execução. Streaming, hidratação parcial/seletiva, presets de edge e server islands não foram validados. RSC não é uma capacidade do Vue. [Configuração e limites](./nuxt).

## Fundação independente de framework

A entrada principal do core importa sem Vue, NativeScript, Jolt ou tipos do DOM. Tokens de tema e regras de comportamento já vivem nela. `componentContracts` agora define propriedades de **Box, Row, Column, Text, Button e Input** com metadados simples; `describeContract(name)` produz uma descrição compatível com JSON. `packages/core/src/vue/contracts.ts` deriva dessa fonte as props Vue usadas pelos dois renderizadores atuais. Os demais componentes ainda mantêm suas declarações na camada Vue.

Os metadados descrevem nomes, tipos, padrões, obrigatoriedade, tokens/unidades, conteúdo, eventos e responsabilidade pelo estado controlado. Não representam uma aplicação serializada nem um compilador. Valores `runtimeOnly`, como superfícies de animação, não podem ser enviados como JSON. Objetos mais ricos, como as ações do Input, continuam tendo contratos TypeScript; seus schemas executáveis pertencem às futuras camadas de autoria portátil/SDUI.

| Intenção comum | Integração Vue atual |
| --- | --- |
| Button `activate()` | `@click`, sem evento da plataforma no payload |
| Input `valueChange(string)` | `update:modelValue` / `v-model` |
| Input `submit`, `focus`, `blur`, `action` | Eventos com os mesmos nomes |
| Handle Input `focus()` / `blur()` | Métodos expostos, sem objeto DOM ou view nativa |
| Conteúdo Text `text` / `spans` | Slot padrão com texto e `MSpan` |
| Texto e decoração nas bordas do Button | Slot padrão de texto, slots decorativos `leading` e `trailing` |

O componente pai controla o valor. Um evento solicita uma alteração; não modifica o estado do pai. Teclado, foco, gestos e layout nativos continuam no renderizador nativo. Formulários de navegador continuam no renderizador Web. Números de geometria representam DIPs no nativo e pixels CSS na Web. Altura de linha é uma proporção; espaçamento de letras usa em. O export `themeContract` registra unidades e famílias de tokens. Informar uma fonte ainda exige que a aplicação a instale/carregue.

O [contrato dos componentes](./component-contract) inclui tabelas de propriedades geradas. O CI confere os descritores contra props Vue, contratos dos dois renderizadores, catálogo e referências nos dois idiomas. Um consumidor limpo do tarball também verifica os tipos usando apenas bibliotecas ES, sem framework ou DOM. Isso comprova a separação das dependências Vue; a prova com um segundo framework continua na [#145](https://github.com/getcortexlabs/mavis-ui/issues/145).

## Três caminhos de uso

| Modo | Estado | Quem executa |
| --- | --- | --- |
| Componentes diretos | Experimental em Vue Web e NativeScript-Vue | Framework e plataforma da aplicação |
| Autoria portátil | Planejada na [#144](https://github.com/getcortexlabs/mavis-ui/issues/144) | Futuros compilador e adaptadores de destino |
| Interface dirigida pelo servidor | Planejada; SSR não a habilita | Futuro protocolo validado de documentos/ações e renderizador |

SSR produz HTML para uma requisição Web e o hidrata com os mesmos dados iniciais. Não traduz Vue para outro framework, não transforma APIs de navegador em APIs nativas nem permite receber documentos de UI remotamente. Componentes compartilhados podem receber props serializáveis do Nuxt; a aplicação NativeScript fornece as mesmas props por seus próprios serviços. APIs exclusivas do Nuxt ficam fora do componente compartilhado.

React Web, Next, Angular, Svelte, Solid e novas integrações NativeScript continuam planejados. React Native, Flutter, SwiftUI e Compose exigem implementações e validações próprias. Esta entrega não adiciona pacote React/Next, compilador, ponte entre runtimes ou motor universal de estado. Acompanhe o [roadmap](./roadmap) e o [índice de entregas](https://github.com/getcortexlabs/mavis-ui/issues/1).
