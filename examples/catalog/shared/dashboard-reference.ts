import type { ComponentReference } from './reference'
export const dashboardEnglishReferences: Record<string, ComponentReference> = {
  kanban: {
    usage: '<MKanban v-model="cards" :columns="columns" label="Studio" :query="query" />',
    properties: [
      {
        name: 'columns',
        type: 'readonly KanbanColumn[]',
        defaultValue: 'required',
        description: 'Unique id, title, optional positive integer limit.',
      },
      {
        name: 'modelValue',
        type: 'readonly KanbanCard[]',
        defaultValue: 'required',
        description:
          'Unique id, column, title, optional description/disabled. Consumer metadata is preserved.',
      },
      {
        name: 'query',
        type: 'string',
        defaultValue: "''",
        description: 'Filters title/description without removing hidden cards.',
      },
      {
        name: 'animated / draggable / disabled',
        type: 'boolean',
        defaultValue: 'true / true / false',
        description: 'Jolt settling of a released card, drag handle and all editing.',
      },
      {
        name: 'moveLabel / upLabel / downLabel / emptyLabel / fullLabel',
        type: 'string',
        defaultValue: 'English',
        description: 'Localizable control and status labels.',
      },
    ],
    behavior:
      'Columns stack on narrow containers and sit side by side from 760px/DIP. Drag the handle to reorder or transfer; arrow keys on that handle, the move menu and up/down buttons offer alternatives. Full columns reject incoming cards, including while filtering. External model/filter changes cancel an active drag; rejected controlled updates keep the original model. Cards are not virtualized (maximum 500 cards / 12 columns). Dragging runs on Jolt drop zones: only the handle starts it, so the rest of the card keeps its controls and touch scrolling. A gap shows where the card will land, and a card released up to 60px/DIP below a column still drops into it. A release anywhere else, Escape, scrolling, a window that loses focus or a locked board returns the card. Dragging is limited to visible drop targets: use the menu for distant columns. On the Web a pointer drag needs a place on the page without transforms: inside an ancestor that keeps one, the arrow keys on the handle, the menu and the buttons still move cards. The `card` slot receives `{ card, column }`; the app owns persistence, editing and navigation.',
  },
  'donut-chart': {
    usage: '<MDonutChart v-model="selected" :segments="segments" label="Hours" animateNumber />',
    properties: [
      {
        name: 'segments',
        type: 'readonly DonutSegment[]',
        defaultValue: 'required',
        description:
          'Unique id, label, nonnegative finite value, optional six-digit HEX color. Up to 24.',
      },
      {
        name: 'modelValue',
        type: 'string or null',
        defaultValue: 'null',
        description: 'Selected segment ID; selecting again clears it.',
      },
      {
        name: 'size / strokeWidth',
        type: 'number',
        defaultValue: '220 / 12',
        description: 'Diameter 100–800px/DIP, stroke 1–20 in the 100-unit view box.',
      },
      {
        name: 'animated / animateNumber / disabled',
        type: 'boolean',
        defaultValue: 'true / false / false',
        description: 'Jolt arcs, optional numeric presentation and selection lock.',
      },
      {
        name: 'formatValue / totalLabel / emptyLabel',
        type: 'function / string / string',
        defaultValue: 'default / Total / No data',
        description: 'App-controlled number formatting and localized text.',
      },
    ],
    behavior:
      'Legend buttons expose exact values and rounded percentages immediately; the decorative ring interpolates with Jolt. Stable IDs preserve segment identity. All-zero input shows an empty track, never an invalid division. Empty arrays are valid. The center shows the selected value or total. SVG SSR remains readable before enhancement; native rendering uses Jolt shape layers. Reduced motion settles immediately.',
  },
  sparkline: {
    usage: '<MSparkline :points="points" label="Conversations" :height="64" />',
    properties: [
      {
        name: 'points',
        type: 'readonly SparklinePoint[]',
        defaultValue: 'required',
        description: 'Unique id, label and finite value or null; at most 100.',
      },
      {
        name: 'domain',
        type: 'readonly [number, number]',
        defaultValue: 'automatic',
        description:
          'Shared chart domain, including zero by default; explicit bounds must contain every value.',
      },
      {
        name: 'height / color',
        type: 'number / string',
        defaultValue: '64 / theme',
        description: '24–240px/DIP and line color.',
      },
      {
        name: 'animated / showData',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Jolt line presentation and permanently expanded data.',
      },
      {
        name: 'formatValue / dataLabel / emptyLabel',
        type: 'function / string / string',
        defaultValue: 'default / View data / No data',
        description: 'Custom numbers and localized disclosure/empty labels.',
      },
    ],
    behavior:
      'Compact presentation reuses the chart domain and null conventions. Null creates a gap; it never becomes zero. Compatible paths interpolate, while changed point/gap topology settles to the new path. A summary and expandable data list remain canonical and accessible; neither requires a hover gesture. All-null and empty input show the empty summary. One point remains visible. No axes or heavy chart controls are added.',
  },
  'gradient-background': {
    usage:
      '<MGradientBackground :colors="colors" :active="playing">\n  <MText text="Make room for something good." />\n</MGradientBackground>',
    properties: [
      {
        name: 'colors',
        type: 'readonly string[]',
        defaultValue: '#9C5270, #51847B, #D5AD6C',
        description: '2–8 six-digit HEX colors.',
      },
      {
        name: 'angle',
        type: 'number',
        defaultValue: '130',
        description: 'Linear gradient angle in degrees.',
      },
      {
        name: 'active / animated',
        type: 'boolean',
        defaultValue: 'false / true',
        description: 'Opt-in continuous rotation and palette transitions.',
      },
      {
        name: 'duration',
        type: 'number',
        defaultValue: '12000',
        description: '1000–120000ms per half turn.',
      },
      {
        name: 'height / radius',
        type: 'number / token',
        defaultValue: '280 / lg',
        description: '40–1600px/DIP and shared corner token.',
      },
    ],
    behavior:
      'Static by default, including SSR. Setting active starts Jolt angle motion. Palette changes animate without remounting slot content. Offer a visible play/pause control when enabling continuous motion. Reduced motion, hidden Web documents and unloaded/deactivated native views stop decoration. Web also pauses outside the viewport. Content remains interactive; choose foreground colors with adequate contrast across every palette.',
  },
  'particle-field': {
    usage:
      '<MParticleField :active="playing" :density="12" :speed="28">\n  <MText text="Room for wonder." />\n</MParticleField>',
    properties: [
      {
        name: 'active',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Explicit request to emit decorative particles.',
      },
      {
        name: 'colors / shape',
        type: 'string[] / circle, rectangle, ring',
        defaultValue: 'palette / circle',
        description: '2–8 six-digit HEX colors and particle shape.',
      },
      {
        name: 'density / lifetime',
        type: 'number',
        defaultValue: '12 / 3000',
        description: '1–60 particles/second, 100–5000ms lifetime: at most 300 live particles.',
      },
      {
        name: 'speed / size / duration',
        type: 'number',
        defaultValue: '28 / 3 / continuous',
        description: 'Speed 0–300px or DIP/s, size 1–24, optional finite emission 100–60000ms.',
      },
      {
        name: 'height / radius / backgroundColor',
        type: 'number / token / string',
        defaultValue: '280 / lg / #202A32',
        description: 'Surface size, corners and static backdrop.',
      },
    ],
    behavior:
      'Uses the Jolt emitter, with no component animation loop or particle solver. Pausing disposes existing particles; resuming starts a new field. Duration limits emission; existing particles may live until their lifetime ends. Reduced motion suppresses emission. Web pauses outside the viewport/background; native stops on unload, deactivation or application suspension. The slot remains mounted and usable. Provide a visible pause control for continuous emission.',
  },
  confetti: {
    usage:
      '<MConfetti :trigger="celebration" :count="70">\n  <MButton text="Publish" @click="celebration++" />\n</MConfetti>',
    properties: [
      {
        name: 'trigger',
        type: 'string or number',
        defaultValue: '0',
        description: 'Changing the token requests one burst; initial render/hydration never emits.',
      },
      {
        name: 'count / colors',
        type: 'number / string[]',
        defaultValue: '70 / palette',
        description: '1–180 pieces and 2–8 six-digit HEX colors.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Disposes an active burst and rejects new ones.',
      },
    ],
    behavior:
      'The exposed burst() requests a celebration; stop() disposes it. A repeated request replaces the previous burst. Jolt owns the finite lifetime and cleanup; the component does not claim a completion callback. The burst event means a request started; skipped reports disabled, reduced-motion or unavailable. Keep success messages independent from decoration so every user receives confirmation. No browser-only imports are required in shared screens.',
  },
}
export const dashboardReferences: Record<string, ComponentReference> = {
  kanban: {
    usage: '<MKanban v-model="cards" :columns="columns" label="Studio" :query="query" />',
    properties: [
      {
        name: 'columns',
        type: 'readonly KanbanColumn[]',
        defaultValue: 'required',
        description: 'ID único, título e limite inteiro positivo opcional.',
      },
      {
        name: 'modelValue',
        type: 'readonly KanbanCard[]',
        defaultValue: 'required',
        description:
          'ID único, coluna, título e description/disabled opcionais. Metadados do consumidor são preservados.',
      },
      {
        name: 'query',
        type: 'string',
        defaultValue: "''",
        description: 'Filtra título/descrição sem remover cartões ocultos.',
      },
      {
        name: 'animated / draggable / disabled',
        type: 'boolean',
        defaultValue: 'true / true / false',
        description: 'Acomodação Jolt do cartão solto, alça de arraste e bloqueio de edição.',
      },
      {
        name: 'moveLabel / upLabel / downLabel / emptyLabel / fullLabel',
        type: 'string',
        defaultValue: 'English',
        description: 'Rótulos dos controles e estados traduzíveis.',
      },
    ],
    behavior:
      'As colunas empilham em contêineres estreitos e ficam lado a lado a partir de 760px/DIP. Arraste a alça para ordenar ou transferir; setas do teclado na alça, menu e botões de subir/descer oferecem alternativas. Colunas cheias rejeitam entradas, inclusive ao filtrar. Mudanças externas no modelo/filtro cancelam o arraste; atualizações controladas rejeitadas mantêm o modelo original. Sem virtualização (até 500 cartões / 12 colunas). O arraste usa os drop zones do Jolt: só a alça o inicia, então o resto do cartão mantém seus controles e a rolagem por toque. Um vão mostra onde o cartão vai cair, e um cartão solto até 60px/DIP abaixo de uma coluna ainda entra nela. Soltar em qualquer outro lugar, Escape, rolagem, a janela perder o foco ou travar o quadro devolvem o cartão. O arraste usa destinos visíveis: use o menu para colunas distantes. Na Web o arraste por ponteiro precisa de um lugar da página sem transformações: dentro de um ancestral que mantém uma, as setas na alça, o menu e os botões continuam movendo cartões. O slot `card` recebe `{ card, column }`; persistência, edição e navegação pertencem ao app.',
  },
  'donut-chart': {
    usage: '<MDonutChart v-model="selected" :segments="segments" label="Hours" animateNumber />',
    properties: [
      {
        name: 'segments',
        type: 'readonly DonutSegment[]',
        defaultValue: 'required',
        description:
          'ID único, rótulo, valor finito não negativo e cor HEX de seis dígitos opcional. Até 24.',
      },
      {
        name: 'modelValue',
        type: 'string or null',
        defaultValue: 'null',
        description: 'ID do segmento selecionado; selecionar novamente limpa.',
      },
      {
        name: 'size / strokeWidth',
        type: 'number',
        defaultValue: '220 / 12',
        description: 'Diâmetro 100–800px/DIP, traço 1–20 na caixa de 100 unidades.',
      },
      {
        name: 'animated / animateNumber / disabled',
        type: 'boolean',
        defaultValue: 'true / false / false',
        description: 'Arcos Jolt, apresentação numérica opcional e bloqueio da seleção.',
      },
      {
        name: 'formatValue / totalLabel / emptyLabel',
        type: 'function / string / string',
        defaultValue: 'default / Total / No data',
        description: 'Formatação numérica pelo app e textos traduzíveis.',
      },
    ],
    behavior:
      'Botões da legenda mostram valores exatos e percentuais arredondados imediatamente; o anel decorativo interpola com Jolt. IDs estáveis preservam a identidade dos segmentos. Valores todos zero mostram uma trilha vazia, sem divisão inválida. Arrays vazios são válidos. O centro mostra o valor selecionado ou total. O SVG SSR é legível antes da ativação; no nativo, o desenho usa camadas Jolt. Movimento reduzido aplica o resultado imediatamente.',
  },
  sparkline: {
    usage: '<MSparkline :points="points" label="Conversations" :height="64" />',
    properties: [
      {
        name: 'points',
        type: 'readonly SparklinePoint[]',
        defaultValue: 'required',
        description: 'ID único, rótulo e valor finito ou null; até 100.',
      },
      {
        name: 'domain',
        type: 'readonly [number, number]',
        defaultValue: 'automatic',
        description:
          'Domínio compartilhado dos gráficos, incluindo zero por padrão; limites explícitos devem conter todos os valores.',
      },
      {
        name: 'height / color',
        type: 'number / string',
        defaultValue: '64 / theme',
        description: '24–240px/DIP e cor da linha.',
      },
      {
        name: 'animated / showData',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Apresentação da linha por Jolt e dados sempre expandidos.',
      },
      {
        name: 'formatValue / dataLabel / emptyLabel',
        type: 'function / string / string',
        defaultValue: 'default / View data / No data',
        description: 'Números personalizados e rótulos traduzíveis.',
      },
    ],
    behavior:
      'A apresentação compacta reutiliza o domínio e as convenções de null dos gráficos. Null cria uma lacuna; não vira zero. Caminhos compatíveis interpolam; mudanças na quantidade de pontos/lacunas aplicam o novo caminho. Resumo e lista expansível de dados permanecem canônicos e acessíveis, sem depender de hover. Dados vazios ou todos null mostram o resumo vazio. Um único ponto permanece visível. Sem eixos ou controles pesados.',
  },
  'gradient-background': {
    usage:
      '<MGradientBackground :colors="colors" :active="playing">\n  <MText text="Make room for something good." />\n</MGradientBackground>',
    properties: [
      {
        name: 'colors',
        type: 'readonly string[]',
        defaultValue: '#9C5270, #51847B, #D5AD6C',
        description: '2–8 cores HEX de seis dígitos.',
      },
      {
        name: 'angle',
        type: 'number',
        defaultValue: '130',
        description: 'Ângulo do gradiente linear em graus.',
      },
      {
        name: 'active / animated',
        type: 'boolean',
        defaultValue: 'false / true',
        description: 'Rotação contínua opcional e transições de paleta.',
      },
      {
        name: 'duration',
        type: 'number',
        defaultValue: '12000',
        description: '1000–120000ms por meia volta.',
      },
      {
        name: 'height / radius',
        type: 'number / token',
        defaultValue: '280 / lg',
        description: '40–1600px/DIP e token de arredondamento compartilhado.',
      },
    ],
    behavior:
      'Estático por padrão, inclusive no SSR. Active inicia o movimento de ângulo do Jolt. Trocar a paleta anima sem remontar o conteúdo do slot. Ofereça controle visível de ativar/pausar ao habilitar movimento contínuo. Movimento reduzido, documento Web oculto e views nativas descarregadas/desativadas interrompem a decoração. A Web também pausa fora da área visível. O conteúdo permanece interativo; escolha cores de texto com contraste adequado em todas as paletas.',
  },
  'particle-field': {
    usage:
      '<MParticleField :active="playing" :density="12" :speed="28">\n  <MText text="Room for wonder." />\n</MParticleField>',
    properties: [
      {
        name: 'active',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Pedido explícito para emitir partículas decorativas.',
      },
      {
        name: 'colors / shape',
        type: 'string[] / circle, rectangle, ring',
        defaultValue: 'palette / circle',
        description: '2–8 cores HEX e formato das partículas.',
      },
      {
        name: 'density / lifetime',
        type: 'number',
        defaultValue: '12 / 3000',
        description: '1–60 partículas/segundo, vida de 100–5000ms: até 300 partículas vivas.',
      },
      {
        name: 'speed / size / duration',
        type: 'number',
        defaultValue: '28 / 3 / continuous',
        description:
          'Velocidade 0–300px ou DIP/s, tamanho 1–24, emissão finita opcional de 100–60000ms.',
      },
      {
        name: 'height / radius / backgroundColor',
        type: 'number / token / string',
        defaultValue: '280 / lg / #202A32',
        description: 'Tamanho, cantos e fundo estático.',
      },
    ],
    behavior:
      'Usa o emissor Jolt, sem loop ou simulação própria do componente. Pausar descarta partículas existentes; retomar inicia um novo campo. Duration limita a emissão; partículas existentes podem durar até o fim da vida. Movimento reduzido suprime a emissão. Web pausa fora da área visível/em segundo plano; nativo interrompe ao descarregar, desativar ou suspender o app. O slot permanece montado e utilizável. Ofereça controle visível para pausar emissão contínua.',
  },
  confetti: {
    usage:
      '<MConfetti :trigger="celebration" :count="70">\n  <MButton text="Publish" @click="celebration++" />\n</MConfetti>',
    properties: [
      {
        name: 'trigger',
        type: 'string or number',
        defaultValue: '0',
        description: 'Mudar o token solicita uma emissão; render inicial/hidratação não emitem.',
      },
      {
        name: 'count / colors',
        type: 'number / string[]',
        defaultValue: '70 / palette',
        description: '1–180 confetes e 2–8 cores HEX de seis dígitos.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Descarta a emissão ativa e rejeita novas.',
      },
    ],
    behavior:
      'O método exposto burst() solicita a celebração; stop() a descarta. Repetir substitui a emissão anterior. Jolt controla a duração finita e limpeza; o componente não promete callback de conclusão. O evento burst informa início; skipped informa disabled, reduced-motion ou unavailable. Mantenha mensagens de sucesso independentes da decoração para todos receberem confirmação. Telas compartilhadas não precisam de imports exclusivos do navegador.',
  },
}
