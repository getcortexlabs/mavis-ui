---
title: Adicionar uma plataforma ao app existente
description: Acrescente Web ou NativeScript sem mover a aplicação Mavis e declare diferenças de plataforma nas telas Vue compartilhadas.
---

# Adicionar uma plataforma ao app existente

::: info Alpha.10
Estes comandos e APIs fazem parte do Mavis RC.11.1. Mantenha core, renderizadores e CLI na mesma versão. Nos comandos abaixo, use `npx @getcortexlabs/create-mavis@0.1.0-rc.11.1` no lugar de `create-mavis`, ou a CLI instalada no projeto.
:::

## Acrescentar iOS e Android ao Vue ou Nuxt

Execute dentro do pacote Web existente:

```sh
create-mavis --add-native --dry-run
create-mavis --add-native
```

O comando detecta Vue + Vite ou Nuxt e npm, pnpm ou Yarn. Cria um projeto isolado em `apps/mobile`, com NativeScript-Vue, Mavis nativo, configurações de build Android/iOS e um exemplo funcional. Preserva fontes, rotas, configuração Web e lockfiles. Acrescenta os scripts `install:mobile`, `ios` e `android` ao pacote original. As instruções seguem o gerenciador escolhido; a instalação acontece somente com `--install` ou pelo comando gerado.

Para abrir uma tela existente:

```sh
create-mavis --add-native --screen src/screens/Busca.vue
```

O host importa esse arquivo, sem copiá-lo. Um `MScreen` na raiz é detectado e colocado dentro do `Frame` nativo. Conteúdo como `MColumn` recebe um único `MScreen` externo. Use `--screen-root screen` ou `--screen-root content` quando a página for criada indiretamente pelo componente. Entradas nativas `Frame`/`Page` não são telas compartilháveis.

O auditor segue imports relativos e aponta APIs do navegador, imports específicos, HTML e CSS. Esses resultados precisam de revisão; não são conversões automáticas. Configure props obrigatórias, serviços injetados, aliases personalizados e navegação da tela na nova entrada. Composables exclusivos do Nuxt precisam de adaptação antes de rodar no nativo.

## Acrescentar Web ao NativeScript

Execute dentro do pacote NativeScript-Vue existente:

```sh
create-mavis --add-web
# Ou Nuxt com renderização no servidor:
create-mavis --add-web --web nuxt --rendering ssr
# Nuxt estático também é suportado:
create-mavis --add-web --web nuxt --rendering ssg --dry-run
```

O comando cria `apps/web` e acrescenta `install:web`, `dev:web`, `build:web` e `preview:web`. Também aceita `--screen`. A entrada, as dependências e a configuração nativa existentes permanecem. Vue + Vite usa renderização no cliente; Nuxt oferece SSR/SSG.

Ambos aceitam `--package-manager npm|pnpm|yarn`, `--dry-run`, `--json`, `--yes`, `--install` e `--no-install`. Em terminal interativo, a CLI mostra o plano e pede confirmação. Sem interação, executa o pedido explícito; use `--dry-run` para revisar antes. Repetir o mesmo comando preserva arquivos editados e informa que o destino já existe. Conflitos de caminhos/scripts, escolhas diferentes, versões Mavis incompatíveis e raízes de workspace são informados antes de escrever. Não há atualização ou downgrade silencioso. Em monorepos, execute dentro de um pacote independente e mantenha o novo host fora de globs de workspace que misturariam os dois runtimes Vue.

`--check-portability`, `--fix-imports` e `--fix-imports --write` continuam separados. A migração de imports ainda exige uma fachada `#mavis` configurada nos dois hosts. Adicionar um destino não reescreve configurações Web arbitrárias nem migra imports existentes. O auditor agora distingue `.ts`/`.mts`/`.cts`, TSX/JSX e a linguagem dos scripts Vue: um genérico TypeScript como `<T>(value: T) => value` não é tratado como JSX.

NativeScript continua exigindo Android SDK/JDK e, para iOS, macOS/Xcode. A CLI prepara o projeto; não instala SDKs, configura assinatura ou publica o aplicativo.

## Mostrar conteúdo por plataforma

`createMavis()` e a instalação apenas de serviços fornecem a plataforma automaticamente. Importe de `@getcortexlabs/mavis-core/vue`; as entradas dos dois renderizadores também exportam essas APIs. Funciona com imports individuais e `components: false`. Projetos novos da RC.11.1 exportam essas APIs por `#mavis`. Adicione re-exports explícitos às fachadas antigas depois de atualizar os pacotes.

```vue
<script setup lang="ts">
import { MPlatform, useMavisPlatform } from '@getcortexlabs/mavis-core/vue'
const { isNative } = useMavisPlatform()
</script>

<template>
  <MPlatform only="web"><MButton text="Imprimir" /></MPlatform>
  <MPlatform only="native"><MButton text="Compartilhar" /></MPlatform>
  <MPlatform :only="['ios', 'android']">
    <MText>Conteúdo do aplicativo</MText>
    <template #fallback><MText>Conteúdo do navegador</MText></template>
  </MPlatform>
  <MButton v-if="isNative" text="Abrir câmera" />
</template>
```

`only` exige `web`, `native`, `ios`, `android` ou um array não vazio desses valores. O componente não acrescenta um contêiner ao layout e só avalia o slot selecionado. Filhos excluídos não executam setup nem montagem. O composable retorna `{ platform, isWeb, isNative, isIOS, isAndroid }`, imutável e pertencente ao app. `platform` vale `web`, `ios` ou `android`. Um navegador no celular continua sendo Web, inclusive no SSR/SSG. Largura e suporte a toque não definem o renderer.

Isso controla a instanciação dos componentes, não o carregamento dos módulos nem tree shaking. Imports estáticos e o setup do pai ainda executam. Pacotes nativos, globais do navegador e serviços do aparelho devem ficar nos hosts. Não é necessário um transformador de compilação para `v-web`/`v-native`.

## Animar listas filtradas e reordenadas

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useMavisListMotion } from '@getcortexlabs/mavis-core/vue'
const items = ref([{ id: 1, text: 'Um' }, { id: 2, text: 'Dois' }])
const list = useMavisListMotion({ size: false, transition: { duration: 240 } })
function inverter() {
  return list.update(() => { items.value = [...items.value].reverse() })
}
</script>

<template>
  <MColumn :motionRegion="list.region" gap="md">
    <MCard v-for="item in items" :key="item.id"><MText>{{ item.text }}</MText></MCard>
  </MColumn>
</template>
```

A mudança dos dados é síncrona. `update()` retorna `{ finished: Promise<boolean>, stop() }`; false indica interrupção ou ausência de host montado. Antes da montagem e no SSR, os dados ainda mudam, sem medir layout. A API de nível inferior é `region.animateLayout(change, options)`. `MRow` e `MColumn` agora aceitam regiões, além de `MBox`.

O Jolt mede e anima os filhos diretos em cada renderer. As chaves Vue precisam ser únicas e estáveis; rascunhos pertencem ao estado de cada item. As opções são `transition`, `size: 'scale' | false` e `enter` (entrada dos filhos novos por opacidade). Itens removidos saem imediatamente; os restantes animam até a nova posição. Não há retenção de linhas apagadas para animar saída nem animação de itens fora da tela/reciclados de `MVirtualList`. É um contrato diferente do arraste para reordenação e das entradas de `animateItems`. Movimento reduzido e interrupções continuam com o Jolt.

## Vincular movimento à passagem de uma seção

Declare a região estável separadamente do filho animado:

```ts
import { markRaw, onBeforeUnmount } from 'vue'
import { createMotionRegion, createMotionScrollSource, createMotionSurface, whenMotionAvailable } from '@getcortexlabs/mavis-core/experimental'

const scroll = markRaw(createMotionScrollSource())
const section = markRaw(createMotionRegion())
const artwork = markRaw(createMotionSurface())
onBeforeUnmount(whenMotionAvailable([scroll, section, artwork], () => {
  const link = artwork.scrollSection(scroll, section, { y: [0, -60], opacity: [0.3, 1] }, {
    start: ['start', 'end'],
    end: ['end', 'start'],
  })
  return () => link.dispose()
}))
```

Associe `scroll` a `MScreen.motionScroll` com `scroll`, `section` a `MBox.motionRegion` e `artwork` a `MCard.motionSurface` em um filho. Cada ponto combina uma borda da seção com uma borda da área visível: `start`, `center` ou `end`. Os padrões começam quando o topo da seção chega à base da área visível e terminam quando a base da seção chega ao topo.

Os adaptadores acompanham alterações de layout e delegam a animação numérica ao Jolt. O intervalo é limitado às posições alcançáveis de rolagem; uma seção sem intervalo percorrível fica no último quadro. O contrato é vertical, em pixels CSS na Web e DIPs no nativo. Mantenha a seção estável e anime um filho separado. Use `link.refresh()` após mudanças que não emitam eventos observados de tamanho/conteúdo. Descartar a superfície, seção ou origem libera observadores e animação. `scrollLinked(..., { range })` continua disponível.

## Declarar transições de navegação uma vez

Compartilhe uma política na aplicação:

```ts
import { defineNavigationTransition } from '@getcortexlabs/mavis-core'
export const pageTransition = defineNavigationTransition({ name: 'slide', duration: 220 })
```

Vue + Vite importa `createMavisNavigation` de `@getcortexlabs/mavis-web`; NativeScript importa o mesmo nome de `@getcortexlabs/mavis/vue`:

```ts
const navigation = createMavisNavigation(router, { transition: pageTransition })
app.use(createMavis({ navigation }))
```

No plugin Nuxt, use `createNuxtMavisNavigation(nuxtApp, { transition: pageTransition })` do pacote Web. Ele coordena páginas assíncronas com o hook `page:finish`. O adaptador Web registra hooks por aplicação; os serviços Mavis os liberam ao desmontar. Instâncias mantidas manualmente expõem `dispose()`.

As políticas são `fade`, `slide` ou `none`, com duração em milissegundos. A Web usa View Transitions do navegador quando disponíveis; navegadores sem suporte e movimento reduzido mantêm navegação e foco sem os snapshots. NativeScript delega transições, cancelamento, retorno interativo e foco de acessibilidade ao vue-router-ns. A Web observa navegações confirmadas, preserva falhas dos guards e histórico, foca o novo título e restaura o foco anterior conectado ou identificado ao voltar. Use `id` estável ou `data-mavis-focus-key` no acionador que será remontado. `focus()` permite escolher outro destino. Mudanças deliberadas de foco são respeitadas.

São transições de cada plataforma, sem promessa de pixels idênticos ou uma segunda pilha de histórico. Mantenha apresentações específicas e gestos do aparelho no roteador nativo. Valide cancelamentos, redirecionamentos, navegação rápida e foco nos hosts usados pelo aplicativo.
