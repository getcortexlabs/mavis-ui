---
title: Adaptadores diretos do NativeScript
description: Fundação NativeScript para React, Angular, Svelte, Solid e JavaScript ou TypeScript puro.
---

# Adaptadores diretos do NativeScript

O repositório inclui cinco adaptadores diretos baseados nos contratos neutros de **MBox, MRow, MColumn, MText, MButton e MInput**. Cada adaptador usa o estado e o ciclo de vida do próprio framework com views do NativeScript. Essas entradas não exigem Vue, WebView ou o compilador de autoria compartilhada.

Esta fundação está disponível na RC.15. O aceite nativo de iOS/Android roda nos workflows dos adaptadores diretos e dos starters gerados. Esta página descreve a fundação de seis componentes, não o catálogo completo do Vue.

| Framework | Pacote / entrada | Versões do consumidor |
| --- | --- | --- |
| JavaScript / TypeScript | `@getcortexlabs/mavis/native` | NativeScript Core 9.1.4 |
| React NativeScript | `@getcortexlabs/mavis-react-nativescript` | React 18.3.1, react-nativescript 5.0.0 |
| Angular | `@getcortexlabs/mavis-angular-nativescript` | Angular 22.3.0, @nativescript/angular 22.0.2 |
| Svelte Native | `@getcortexlabs/mavis-svelte-nativescript` | Svelte 4.2.20, @nativescript-community/svelte-native 1.0.32 |
| Solid Native | `@getcortexlabs/mavis-solid-nativescript` | Solid 2.0.0, @nativescript-community/solid-js 2.0.1, DOMiNATIVE 0.1.3 |

O consumidor fixa Node 22.23.3, TypeScript 6.0.3, NativeScript iOS 9.1.0, Android 9.1.1 e Jolt 0.1.0-rc.18. React Native é outro renderizador e não faz parte do pacote React NativeScript.

## Criar pela CLI

A RC.15 cria starters diretos para iOS/Android: Troque `react` por `angular`, `svelte`, `solid` ou `plain` (JS/TS). A CLI aceita npm, pnpm e Yarn, e recusa combinações Web/desktop com esses frameworks. Os hosts desktop usam Vue; veja o [guia de Mac e Windows](./native-desktop).

```sh
npx @getcortexlabs/create-mavis@0.1.0-rc.16 phone --targets native --framework react
cd phone
npm install
npm run ios
# Ou: npm run android
```

Para testar mudanças do checkout com os tarballs locais correspondentes:

```sh
npm ci
npm run release:pack
node scripts/prepare-native-creator-acceptance.mjs react
cd artifacts/native-creator/react
npm install
npm run ios
# Ou: npm run android
```

O script gera o starter normal e aponta suas dependências Mavis para os tarballs locais. Mantenha os tarballs disponíveis durante a instalação.

## Executar o catálogo

Neste checkout, com o [ambiente NativeScript](https://docs.nativescript.org/setup/) instalado:

```sh
npm ci
npm run build
cd examples/native-adapters
npm ci
ns run ios --env.framework=react
# Ou: ns run android --env.framework=angular
```

Escolha `plain`, `react`, `angular`, `svelte` ou `solid`. O aplicativo reutiliza a pasta `App_Resources` do catálogo principal. O [manifesto do consumidor](https://github.com/getcortexlabs/mavis-ui/blob/main/examples/native-adapters/package.json) e a configuração Webpack são a referência executável da instalação. Eles incluem os cinco frameworks para comparação; um aplicativo precisa somente do framework e renderizador escolhidos, Mavis, Mavis Core, NativeScript e Jolt.

Em um aplicativo existente, importe a entrada explícita do framework e mantenha seu bootstrap e host de navegação NativeScript. Para usar ícones, copie `@getcortexlabs/mavis/fonts/lucide.ttf` para a pasta `fonts` do aplicativo. A regra de cópia do exemplo já faz isso. Uma entrada nativa não deve ser importada por um bundler de navegador.

React NativeScript e Svelte Native estável ainda declaram peers do Core 8. O consumidor mantém os overrides específicos para selecionar Core 9.1.4. O Jolt RC.17 aceita Solid 2 e Svelte 4 no uso nativo imperativo, então os overrides específicos do Jolt foram removidos ([Jolt #517](https://github.com/rafaelaugustos/jolt/issues/517)). Estes adaptadores Mavis usam a API nativa imperativa do Jolt. Os bindings próprios de `jolt/solid` continuam exigindo Solid 1; a mudança nos peers não torna esses bindings compatíveis com Solid 2.

O Svelte Native 5.0.0-alpha.0 importa `svelte/renderer`, ausente no pacote Svelte 5.57.3 publicado e examinado nesta entrega. Por isso esta fundação usa Svelte 4 estável. O adaptador Solid usa as APIs atuais de contexto e renderização do Solid 2. Fixe suas entradas de navegador/cliente como no exemplo, para que o build NativeScript não selecione a entrada de servidor sem reatividade.

## JavaScript e TypeScript

`createMavis()` possui um escopo de tema. `create()` retorna a view e operações separadas de atualização, foco e descarte. Adicione filhos pela view nativa do layout.

```ts
import { createMavis } from '@getcortexlabs/mavis/native'

const ui = createMavis()
let value = 'Ada'
const field = ui.create(
  'MInput',
  { label: 'Nome', modelValue: value },
  {
    valueChange(next) {
      value = next
      field.update({ label: 'Nome', modelValue: value })
    },
  },
)
const column = ui.create('MColumn', { padding: 'lg', gap: 'md' })
column.view.addChild(field.view)
// Monte column.view na Page do aplicativo. Ao liberar a propriedade definitivamente:
// field.dispose(); column.dispose()
```

Cada atualização é um snapshot completo das props; propriedades opcionais omitidas voltam ao padrão. Chamar `update()` depois do descarte definitivo lança erro. O unload nativo temporário não descarta o objeto do aplicativo, permitindo recarregar views retidas.

## React NativeScript

Use componentes e estado React normais. `MInput` solicita `onValueChange`; o proprietário decide se aceita o valor. A ref expõe `{ view, focus(), blur(), focusAction() }`.

```tsx
import { useState } from 'react'
import { MColumn, MInput, MButton } from '@getcortexlabs/mavis-react-nativescript'

function Form() {
  const [name, setName] = useState('Ada')
  return (
    <MColumn padding="lg" gap="md">
      <MInput label="Nome" modelValue={name} onValueChange={setName} />
      <MButton onClick={() => save(name)}>Salvar</MButton>
    </MColumn>
  )
}
```

O renderizador nativo controla a montagem e a desmontagem. Text e Button aceitam filhos de texto. Uma prop `text` explícita, inclusive `''`, tem prioridade sobre o conteúdo.

## Angular

Importe as diretivas standalone individualmente ou espalhe `MAVIS_COMPONENTS` no `imports` do componente. O Mavis registra nomes nativos como `MInput` e `m-input`. A biblioteca distribui compilação parcial do Angular.

```html
<MColumn padding="lg" gap="md">
  <MInput label="Nome" [modelValue]="name()" (modelValueChange)="name.set($event)" />
  <MButton text="Salvar" (click)="save(name())" />
</MColumn>
```

`[(modelValue)]` funciona com uma propriedade atribuível do proprietário. `Page` e `Frame` vêm do NativeScript Angular. Uma referência à diretiva expõe `view`, `focusInput()`, `blurInput()` e `focusAction()`. Para um tema por escopo, importe `MThemeProvider` e use `[mavisTheme]="themeData"` em um ancestral, ou passe um `MavisThemeScope` por `[theme]`.

## Svelte Native

Os wrappers Svelte 4 disparam eventos semânticos. Mantenha o modelo controlado atribuindo explicitamente o valor no proprietário. Os wrappers não alteram `modelValue` silenciosamente nem criam um estado independente de edição.

```svelte
<script>
  import { MColumn, MInput, MButton } from '@getcortexlabs/mavis-svelte-nativescript'
  let name = 'Ada'
</script>

<MColumn padding="lg" gap="md">
  <MInput label="Nome" modelValue={name} on:valueChange={event => name = event.detail} />
  <MButton on:click={() => save(name)}>Salvar</MButton>
</MColumn>
```

`bind:this` expõe `focusInput()`, `blurInput()` e `focusAction()`. O slot padrão dos layouts aceita componentes; os slots de Text e Button aceitam texto puro ou interpolado. O pacote distribui componentes compilados para o cliente Svelte 4. Compile os arquivos `.svelte` do aplicativo com sua configuração normal de Svelte Native.

## Solid Native

Use os acessores de estado do Solid nas props e o renderizador universal do NativeScript. Não desestruture props reativas antes de passar seus valores atuais. O consumidor executável mostra a forma `createComponent` e a resolução de exports necessária.

```tsx
const [name, setName] = createSignal('Ada')
<MColumn padding="lg" gap="md">
  <MInput label="Nome" modelValue={name()} onValueChange={setName} />
  <MButton onClick={() => save(name())}>Salvar</MButton>
</MColumn>
```

Importe os componentes de `@getcortexlabs/mavis-solid-nativescript`. A `ref` recebe a view nativa, com `focusInput()`, `blurInput()` e `focusInputAction()`. Essas intenções de foco ficam separadas do estado de renderização. O proprietário do Solid é responsável pelo descarte.

## Temas, movimento e ciclo de vida

`createMavisTheme(themeData)` retorna um escopo com `setTheme(next)`. React, Svelte e Solid oferecem `MThemeProvider` com esse escopo. As views assinam mudanças enquanto carregadas, liberam assinaturas no unload e usam o tema mais recente ao recarregar. A prop `theme` de um componente substitui o escopo ancestral. O aplicativo escolhe a aparência do sistema e passa o tema desejado; esta fundação não instala os serviços de aplicativo do Vue.

Button usa a integração existente de pressão com o Jolt nativo. Box, Text e Button aceitam `motionSurface`; Box, Row e Column aceitam `motionRegion`. Essas referências reutilizam a propriedade dos recursos nativos, incluindo redução de movimento. Começam quando a view carrega e liberam recursos no unload ou descarte definitivo. Os hooks do framework não criam outro motor de animação.

A navegação pertence ao aplicativo. O callback `navigate` do Button pode usar o roteador NativeScript do framework; `href` externo utiliza o serviço nativo de URLs. Nenhum roteador Vue é instalado. Atributos de formulário exclusivos da Web não criam formulários HTML no nativo. Esses destinos NativeScript não oferecem SSR Web, hidratação, HTML estático ou RSC.

## Limite da cobertura

A fundação inicial usa os nomes e padrões das props neutras. Inclui dimensões e tokens de layout, tipografia, ícones, texto de loading, estado desabilitado, campos controlados de uma ou várias linhas, ações do input, temas e referências nativas de movimento. O catálogo completo do Vue e seus serviços de aplicativo não são reexportados.

Conteúdo rico com `MSpan`, slots personalizados de decoração `leading`/`trailing` do Button, handles de reordenação e decorações animadas de loading do Button ainda não estão implementados nesta primeira fundação direta. `reorderHandle=true` ou `loadingIndicator` diferente de `none` gera um diagnóstico. Mantenha conteúdo interativo fora do Button. Use referências nativas para operações da plataforma, preservando a propriedade do Mavis sobre suas props de apresentação.

Suporte direto ao framework não adiciona um frontend de autoria portátil. As semânticas do compilador e os geradores de frameworks continuam na fronteira separada da #146.

O workflow nativo instala tarballs da release e verifica mudanças de estado, ativação nativa, edição controlada, identidade/foco, temas independentes e montagem/remontagem/descarte do Jolt. Gravações e relatórios ficam nos artefatos do CI. Esses testes em simuladores e emuladores não comprovam desempenho em aparelhos físicos nem uma auditoria completa de acessibilidade.

Cada framework tem um pacote separado para que seus peers não interfiram na instalação de outros frameworks. Instale apenas o adaptador escolhido, além da base Mavis e do Mavis Core com a mesma versão. Os oito pacotes da release usam a mesma versão coordenada.

O Svelte Native 1.0.32 entrega incorretamente o payload de CustomEvent do Svelte 4. O adaptador aplica uma correção detectada por comportamento após inicializar o DOM nativo, preservando `detail` e cancelamento; a [#380](https://github.com/getcortexlabs/mavis-ui/issues/380) acompanha sua remoção quando o upstream corrigir (as issues upstream estão desabilitadas).
