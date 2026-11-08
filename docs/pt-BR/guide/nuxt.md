---
title: Nuxt, SSR e geração estática
description: Renderize componentes Mavis Vue no servidor, hidrate sem perder edições e gere uma rota estática com Nuxt.
---

# Nuxt, SSR e geração estática

Telas Mavis podem receber dados iniciais do Nuxt e produzir HTML útil antes do JavaScript carregar. Deixe busca de dados e navegação Nuxt na página hospedeira; compartilhe props, estado e template Mavis do componente filho com a aplicação NativeScript.

::: info Integração experimental na RC.12
Este guia descreve o consumidor Nuxt validado no repositório. As correções de hidratação estão no Mavis `0.1.0-rc.12.1`. Instale core e Web na mesma versão. Não desative SSR nem envolva a tela inteira em `ClientOnly`.
:::

Base de validação do checkout: **Nuxt 4.6.3, Vue 3.5.44, Node 22.23.3 e Jolt 0.1.0-rc.12.1**. O consumidor em `test/consumers/nuxt` instala tarballs fora do workspace, sem aliases para fontes locais. Usa saída de produção `node-server`; outros presets Nitro, streaming e hidratação parcial continuam sem validação.

## Instalação e registro

Instale `@getcortexlabs/mavis-core@0.1.0-rc.12.2`, `@getcortexlabs/mavis-web@0.1.0-rc.12.2` e `@rafaelaugusto/jolt@0.1.0-rc.12.1` juntos. Para testar um checkout local, execute `npm ci && npm run release:pack` e use os tarballs do core/Web gerados em `artifacts/release/packages`. O renderizador NativeScript não faz parte do app Nuxt.

Carregue o CSS Web em `nuxt.config.ts`; ele inclui a fonte de ícones. Fontes personalizadas pertencem à aplicação: declare/pré-carregue os arquivos e use os mesmos nomes de família no tema do servidor e do cliente.

```ts
export default defineNuxtConfig({
  css: ['@getcortexlabs/mavis-web/style.css'],
})
```

Crie `app/plugins/mavis.ts`. O plugin executa para cada aplicação/requisição Nuxt, mantendo temas e filas de Toast por aplicação, sem singleton mutável do processo.

<<< @/../test/consumers/nuxt/app/plugins/mavis.ts

O snapshot em `useState` mantém iguais as primeiras renderizações do servidor e do cliente. Uma requisição pode usar um cookie explícito claro/escuro. Uma página estática parte do snapshot do build, que não conhece o cookie do visitante. `onNuxtReady` aplica então o cookie ou inicia a observação do tema do sistema após a hidratação. A escolha do dispositivo pode mudar a cor da página nesse momento; use uma preferência conhecida pelo servidor quando evitar essa mudança for importante. Temas locais também precisam começar de forma determinística.

O `createMavis()` padrão continua útil em SPAs. No SSR, não escolha um tema exclusivo do navegador na primeira renderização do cliente nem coloque esse registro em um plugin `.client.ts`: o servidor precisa do mesmo provider.

## Dados fornecidos pela aplicação

Use a API de dados do Nuxt, que transfere o resultado no payload, e passe valores comuns ao componente compartilhado:

<<< @/../test/consumers/nuxt/app/pages/index.vue

`PreferenceEditor` recebe um perfil serializável. Seu estado local começa nessas props; autenticação, cache, mutações, novas tentativas e cancelamento pertencem à aplicação. Não serialize callbacks, handles de animação, segredos ou objetos de plataforma. Imports exclusivos do servidor ficam no código server do Nuxt. O consumidor confere que a hidratação não repete a chamada inicial e que a configuração privada não aparece nos assets do cliente.

O exemplo remonta o editor ao voltar pela navegação, reiniciando os rascunhos locais a partir do perfil inicial. Para preservar um rascunho entre rotas, guarde-o em estado da aplicação. Toast com escopo de aplicação sobrevive à troca de rota por definição; a fila pertence àquela aplicação.

## Comportamento da hidratação

- Input, Input multilinha, Checkbox, Radio e Slider preservam edições feitas nos controles HTML antes da hidratação quando o valor inicial do pai ainda corresponde ao snapshot do servidor. Emitem uma atualização controlada ao montar. Se o pai rejeitar a alteração, seu valor prevalece. Campos desabilitados/somente leitura não adotam edições.
- O nó do editor e a seleção do texto são preservados. Enter durante composição no Input não envia o formulário. A simulação automatizada dos eventos de composição não substitui uma auditoria com IME físico.
- IDs gerados usam `useId` do Vue. Mantenha iguais a árvore inicial, a ordem das opções e as props iniciais. Se houver várias aplicações Vue no mesmo documento, atribua valores distintos a `app.config.idPrefix`, iguais no servidor e cliente de cada app. Cada requisição cria seu app, sem contador compartilhado.
- Controles HTML comuns recebem edição antes do JS. Switch, Select, Tabs e Accordion baseados em botões precisam da hidratação para suas ações. O Mavis não enfileira/reexecuta cliques nem submissões de rede anteriores à hidratação.
- O pai continua responsável pelo reset do Input. Use `@reset.prevent` para reiniciar os modelos, em vez de depender do snapshot de valor padrão do navegador. Veja [Input](../components/input#formulários-html-web).

## O que aparece no servidor

Todos os componentes registrados participam do consumidor de conformidade Vue, respeitando estes limites:

| Família | Responsabilidade do servidor e cliente |
| --- | --- |
| Layout, texto/Span, ícones, cards, identidades, feedback e linhas de lista | HTML inicial útil; carregamento de imagens e resolução de fontes pertencem ao navegador/aplicação. |
| Inputs e seleção | Valores e associações iniciais em HTML; adoção de edição e ações interativas começam no cliente. |
| Tabs / Accordion | Conteúdo selecionado/expandido determinístico pelas props. Retenção de painéis segue o contrato normal de cada componente. |
| Sheet / Dialog / popup do Select | Apresentação modal, foco, bloqueio de rolagem e posicionamento começam no cliente. Um `open` inicial não abre um modal do navegador no SSR. Conteúdo importante para SEO deve ficar fora de overlays adiados. |
| Toast | Sem apresentação nem temporizadores de duração no servidor. A fila pertence à aplicação/componente; notificações são feedback no cliente. |
| Reveal / press / superfícies experimentais de animação e scroll | Conteúdo/estado inicial sem playback Jolt ou medição. As superfícies ficam disponíveis após montar, respeitam movimento reduzido e liberam recursos ao desmontar. |

Não crie timers, listeners de navegador ou assinaturas de serviços no `setup()` do servidor. O SSR não chama um hook de desmontagem do cliente para finalizar a requisição. Sinais de cancelamento e descarte de serviços assíncronos pertencem à aplicação hospedeira. O consumidor testa isolamento após erro e desconexão; seu serviço finito com atraso não significa que o Mavis cancele trabalho do servidor.


O drag da Sheet exige ancestrais sem transformação ou zoom. Isso também afeta Select, cujo popup usa Sheet: mantenha-o fora de cards com superfície de animação ativa. A falha de composição com o modal está registrada na [#197](https://github.com/getcortexlabs/mavis-ui/issues/197).

## Rotas estáticas e híbridas

O consumidor pré-renderiza `/static` com um perfil constante e hidrata essa página usando somente um servidor de arquivos. Não precisa de API ativa. Um build Nuxt de servidor pode combinar essa rota com páginas renderizadas por requisição:

```ts
routeRules: { '/static': { prerender: true } }
```

Também é exercitado `nuxt generate` para essa rota, excluindo as rotas dinâmicas de diagnóstico. Um deploy estático não serve `/api/profile`: forneça dados no build, um serviço externo real ou um servidor compatível para as páginas dinâmicas. Pré-renderize apenas dados públicos: HTML e payload do build são arquivos compartilhados, não um cache personalizado por requisição.

## Repetir a validação

Na raiz do repositório, com a versão Node indicada:

```sh
npm run release:pack
node scripts/check-core-consumer.mjs
node scripts/check-nuxt-consumer.mjs
npx playwright install chromium webkit
node scripts/check-nuxt-browser.mjs
node scripts/check-nuxt-static.mjs
```

Resultados, logs e capturas ficam em `artifacts/ssr`. O [protocolo de conformidade](https://github.com/getcortexlabs/mavis-ui/blob/main/test/ssr.md) registra cenários e limites. React/Next, compilação portátil e SDUI continuam em entregas separadas; [arquitetura e suporte](./architecture) explica essas fronteiras.
