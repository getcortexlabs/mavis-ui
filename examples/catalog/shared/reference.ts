import { advancedReferences } from './advanced-reference'
import { dashboardReferences } from './dashboard-reference'
import { creativeReferences } from './creative-reference'
import { screenComponentReferences } from './screen-component-reference'
import { interactiveReferences } from './interactive-reference'
export interface ReferenceProperty {
  name: string
  type: string
  defaultValue: string
  description: string
}
export interface ComponentReference {
  usage: string
  properties: ReferenceProperty[]
  events?: { name: string; payload: string; description: string }[]
  behavior: string
  layout?: boolean
}
const prop = (
  name: string,
  type: string,
  defaultValue: string,
  description: string,
): ReferenceProperty => ({ name, type, defaultValue, description })

export const compositionProperties = [
  prop('padding', 'token | number', 'none', 'Espaço interno. Card usa lg como padrão.'),
  prop(
    'paddingX / paddingY',
    'token | number',
    'padding',
    'Sobrescrevem o espaçamento horizontal e vertical.',
  ),
  prop('radius', 'token | number', 'none', 'Arredondamento dos cantos. Card usa lg.'),
  prop('grow', 'number', '0', 'Distribui o espaço disponível entre os filhos.'),
  prop(
    'shrink',
    'number',
    'contexto',
    'Por padrão, 1 em Row e 0 em Column. Controla quanto o filho pode encolher.',
  ),
  prop(
    'width / height',
    'number | auto | %',
    'auto',
    'Dimensões explícitas. Números usam DIP no nativo e px na Web.',
  ),
  prop(
    'backgroundColor',
    'string',
    'tema / transparente',
    'Cor da superfície. Prefira valores do tema para acompanhar claro e escuro.',
  ),
]
const layoutProperties = (column: boolean) => [
  prop(
    'gap',
    'token | number',
    'none',
    'Espaço entre os filhos. Aceita tokens do tema ou números não negativos.',
  ),
  prop(
    'align',
    'start | center | end | stretch',
    column ? 'stretch' : 'center',
    column ? 'Alinhamento horizontal dos filhos.' : 'Alinhamento vertical dos filhos.',
  ),
  prop(
    'justify',
    'start | center | end | between | around',
    'start',
    column ? 'Distribuição vertical do conteúdo.' : 'Distribuição horizontal do conteúdo.',
  ),
  prop(
    'wrap',
    'boolean',
    'false',
    column
      ? 'Permite novas colunas quando a altura está limitada.'
      : 'Permite que os itens continuem em outra linha.',
  ),
]

const navigationProperties = [
  prop('href', 'string', '—', 'Destino; ativa o modo de navegação em Button/Card.'),
  prop(
    'navigate',
    '(href: string) => void | Promise',
    '—',
    'Navegação do app; obrigatória para rotas internas no nativo.',
  ),
  prop('target', '_self | _blank', '_self', 'Contexto de navegação Web.'),
  prop('rel', 'string', '—', 'Relação Web. _blank adiciona noopener/noreferrer.'),
]

export const references: Record<string, ComponentReference> = {
  ...interactiveReferences,
  ...advancedReferences,
  ...dashboardReferences,
  ...creativeReferences,
  ...screenComponentReferences,
  'command-palette': {
    usage:
      '<MCommandPalette v-model:open="open" :items="commands" label="Commands" @select="run" />',
    properties: [
      {
        name: 'items',
        type: 'readonly CommandItem[]',
        defaultValue: 'required',
        description:
          'Comandos com value, label, description, group, keywords, icon, disabled e atalho apenas visual.',
      },
      {
        name: 'open / query',
        type: 'boolean / string',
        defaultValue: 'false / local',
        description:
          'Apresentação controlada e busca opcionalmente controlada. Busca local é limpa ao fechar.',
      },
      {
        name: 'shortcut / loading / disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Cmd/Ctrl+K opcional na Web; loading bloqueia seleção enquanto o app busca.',
      },
      {
        name: 'label / searchLabel / placeholder / emptyLabel / loadingLabel / closeLabel',
        type: 'string',
        defaultValue: 'see source',
        description: 'Título, busca e mensagens localizáveis.',
      },
      {
        name: 'returnFocus',
        type: 'SheetReturnFocus',
        defaultValue: 'captured opener',
        description: 'Destino de foco Web ao fechar, herdado de MSheet.',
      },
    ],
    events: [
      {
        name: 'update:open',
        payload: 'boolean',
        description: 'Notifica o aplicativo.',
      },
      {
        name: 'update:query',
        payload: 'string',
        description: 'Notifica o aplicativo.',
      },
      {
        name: 'select',
        payload: 'ChoiceValue, CommandItem',
        description: 'Notifica o aplicativo.',
      },
    ],
    behavior:
      'A busca ignora acentos e combina todos os termos com rótulos, descrições, grupos e palavras-chave. Setas percorrem ações disponíveis; Home/End funcionam nos resultados, Enter seleciona e Escape fecha. O atalho Web é opcional, ignora editores, composição e outros diálogos, e é removido ao desmontar. No nativo, uma Sheet apresenta busca e ações explícitas. O aplicativo executa comandos e controla requisições; selecionar fecha a paleta. Atalhos dos itens são dicas visuais.',
  },
  'navigation-rail': {
    usage:
      '<MNavigationRail v-model:collapsed="collapsed" :modelValue="routeKey" :groups="groups" label="Workspace" />',
    properties: [
      {
        name: 'groups',
        type: 'readonly NavigationGroup[]',
        defaultValue: 'required',
        description:
          'Grupos com key, label e itens NavigationItem. Valores dos itens são únicos entre grupos.',
      },
      {
        name: 'modelValue',
        type: 'ChoiceValue or null',
        defaultValue: 'null',
        description:
          'Destino atual controlado pelo app; navegação concluída determina o item ativo.',
      },
      {
        name: 'collapsed / collapsible / disabled',
        type: 'boolean',
        defaultValue: 'false / true / false',
        description: 'Apresentação compacta de 80 px/DIP ou expandida de 256 px/DIP.',
      },
      {
        name: 'header / footer',
        type: 'slots',
        defaultValue: '—',
        description: 'Recebem { collapsed } para marca e conta.',
      },
    ],
    events: [
      {
        name: 'update:collapsed',
        payload: 'boolean',
        description: 'Notifica o aplicativo.',
      },
      {
        name: 'error',
        payload: 'unknown',
        description: 'Notifica o aplicativo.',
      },
    ],
    behavior:
      'Links usam o adaptador de navegação Mavis ou navigate do item. A Web preserva href e comportamento de links. O estado atual pertence ao aplicativo e não muda antecipadamente ao clique. Botões compactos mantêm nomes acessíveis e contexto dos badges. Jolt anima indicadores e feedback; o aplicativo escolhe quando recolher conforme seu layout.',
  },
  breadcrumb: {
    usage: '<MBreadcrumb :items="path" :maxItems="3" label="Breadcrumb" />',
    properties: [
      {
        name: 'items',
        type: 'readonly BreadcrumbItem[]',
        defaultValue: 'required',
        description:
          'Key única, label e href dos ancestrais; navigate opcional. Último item é a página atual.',
      },
      {
        name: 'maxItems',
        type: 'number',
        defaultValue: '4',
        description:
          'No mínimo dois. Ancestrais intermediários ficam acessíveis pelo botão de expansão.',
      },
      {
        name: 'label / expandLabel',
        type: 'string',
        defaultValue: 'Breadcrumb / Show full path',
        description: 'Rótulos localizáveis da navegação e expansão.',
      },
    ],
    events: [
      {
        name: 'error',
        payload: 'unknown',
        description: 'Notifica o aplicativo.',
      },
    ],
    behavior:
      'O último item é texto com semântica de página atual. Ancestrais usam destinos reais MLink. Expandir mostra o caminho inteiro, sem outro modelo de navegação, e é reiniciado quando as identidades mudam. Caminhos longos quebram linha em telas estreitas. Separadores são decorativos.',
  },
  tooltip: {
    usage:
      '<MTooltip triggerLabel="About this metric" text="Active members in the last seven days." />',
    properties: [
      {
        name: 'text / triggerLabel',
        type: 'string',
        defaultValue: 'required',
        description: 'Texto simples de ajuda e nome acessível explícito do botão de informação.',
      },
      {
        name: 'icon / variant',
        type: 'IconName / ButtonVariant',
        defaultValue: 'info / ghost',
        description: 'Aparência do acionador próprio do componente.',
      },
      {
        name: 'placement',
        type: 'PopoverPlacement',
        defaultValue: 'top-start',
        description: 'top-start, top-end, bottom-start ou bottom-end; ajusta à área disponível.',
      },
      {
        name: 'delay / disabled',
        type: 'number / boolean',
        defaultValue: '350 / false',
        description: 'Atraso de hover Web em milissegundos. Foco e toque não aguardam.',
      },
    ],
    events: [],
    behavior:
      'Na Web, abre por foco, hover ou clique, permite mover o cursor sobre a ajuda e fecha com Escape sem mover foco. O conteúdo não é interativo. No nativo, um acionador rotulado abre MPopover com retorno do sistema, sem exigir toque longo. O componente possui seu próprio acionador. Instruções essenciais devem continuar visíveis no formulário.',
  },
  timeline: {
    usage:
      '<MTimeline :items="activity" label="Project activity"><template #default="{ item }"><MText :text="item.description" /></template></MTimeline>',
    properties: [
      {
        name: 'items',
        type: 'readonly TimelineItem[]',
        defaultValue: 'required',
        description: 'Key estável, title, description, horário formatado, icon e status opcionais.',
      },
      {
        name: 'statusLabels',
        type: 'Record<TimelineStatus, string>',
        defaultValue: 'English labels',
        description:
          'complete, current, upcoming e error; o estado pode ser lido sem depender da cor.',
      },
      {
        name: 'label / emptyLabel',
        type: 'string',
        defaultValue: 'required / No activity yet',
        description: 'Nome acessível da lista e mensagem vazia.',
      },
      {
        name: 'default',
        type: 'slot',
        defaultValue: '—',
        description:
          'Recebe { item, index }; conteúdo permanece montado durante mudanças de estado.',
      },
    ],
    events: [],
    behavior:
      'Lista cronológica na ordem do aplicativo, com conectores, ícones de estado e entrada/indicadores Jolt. Não infere progresso nem temporizadores. Horários chegam formatados pelo app; use formatDateTime para locale e fuso. Mantenha chaves estáveis ao substituir ou reordenar dados. Movimento reduzido segue o contexto Mavis.',
  },
  chart: {
    usage:
      '<MChart v-model="selection" v-model:hiddenSeries="hidden" :categories="days" :series="series" label="Activity" type="line" />',
    properties: [
      {
        name: 'categories / series',
        type: 'readonly ChartCategory[] / readonly ChartSeries[]',
        defaultValue: 'required',
        description:
          'Chaves e rótulos estáveis; cada série tem um número finito ou null por categoria.',
      },
      {
        name: 'type / height',
        type: 'line or bar / number',
        defaultValue: 'line / 240',
        description: 'Tipo e altura (120–800 px/DIP). Até 100 categorias e 8 séries.',
      },
      {
        name: 'domain',
        type: 'readonly [number, number]',
        defaultValue: 'automatic',
        description:
          'Limites finitos crescentes contendo todos os valores. Domínio automático inclui zero.',
      },
      {
        name: 'modelValue / hiddenSeries',
        type: 'ChartSelection or null / readonly ChoiceValue[]',
        defaultValue: 'null / []',
        description:
          'Seleção por chaves { category, series } e visibilidade da legenda controlada.',
      },
      {
        name: 'formatValue / showData',
        type: 'function / boolean',
        defaultValue: 'string / false',
        description: 'Formatação e expansão inicial dos dados textuais.',
      },
      {
        name: 'label / description / categoryLabel / seriesLabel',
        type: 'string',
        defaultValue: 'see source',
        description: 'Título, contexto e rótulos de seleção acessíveis.',
      },
      {
        name: 'showDataLabel / hideDataLabel / emptyLabel / missingLabel / clearLabel',
        type: 'string',
        defaultValue: 'English labels',
        description: 'Ações e estados vazios/ausentes localizáveis.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'ChartSelection or null',
        description: 'Notifica o aplicativo.',
      },
      {
        name: 'update:hiddenSeries',
        payload: 'ChoiceValue[]',
        description: 'Notifica o aplicativo.',
      },
    ],
    behavior:
      'Gráficos categóricos de linhas e barras agrupadas compartilham geometria normalizada. Null cria uma lacuna, nunca zero inventado. Valores negativos usam uma linha de zero comum; ocultar séries preserva o domínio. Web usa SVG; nativo usa formas nativas limitadas, sem WebView. Toque/clique escolhe a série próxima, e seletores rotulados oferecem alternativa em todas as plataformas. Mostrar dados expõe todos os valores, inclusive séries ocultas. Jolt anima entrada/substituição do gráfico; não promete interpolação de valores/eixos. Cores são hex de seis dígitos ou do tema; rótulos e valores complementam a cor. Esta versão não inclui eixos temporais, zoom, empilhamento, gráficos financeiros ou telemetria ilimitada.',
  },

  'data-table': {
    usage:
      '<MDataTable :items="rows" :columns="columns" v-model:sort="sort" v-model:selected="selected" label="Collections" selectable />',
    properties: [
      {
        name: 'items / itemKey',
        type: 'readonly object[] / string or function',
        defaultValue: 'required / id',
        description: 'Dados da página e identidade estável.',
      },
      {
        name: 'columns',
        type: 'readonly DataColumn[]',
        defaultValue: 'required',
        description: 'Chave, título, largura, alinhamento e acesso ao valor.',
      },
      {
        name: 'sort / v-model:sort',
        type: 'DataSort or null',
        defaultValue: 'null',
        description: 'Emite ascendente, descendente e sem ordem; o app ordena os dados.',
      },
      {
        name: 'selected / v-model:selected',
        type: 'readonly ChoiceValue[]',
        defaultValue: '[]',
        description: 'Chaves selecionadas; preserva seleção fora da página atual.',
      },
      {
        name: 'selectable / rowDisabled / rowLabel',
        type: 'boolean / function / function',
        defaultValue: 'false / — / —',
        description: 'Seleção opcional, indisponibilidade por linha e rótulo acessível.',
      },
      {
        name: 'disabled / loading',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Bloqueiam edição; loading apresenta indicador.',
      },
    ],
    behavior:
      'A tabela recebe os dados da página atual. Ordenação, filtros, requisições e paginação pertencem ao app; use MPagination no slot footer. Os slots cell e cell:chave recebem item, itemKey, column, value e index; actions e empty também estão disponíveis. Web usa tabela HTML com cabeçalhos e aria-sort; no nativo, as colunas têm rolagem horizontal e cada célula mantém o título da coluna. Chaves numéricas e strings são distintas. Não é uma grade editável nem uma lista virtualizada: pagine conjuntos grandes.',
  },
  carousel: {
    usage:
      '<MCarousel v-model="current" :items="slides" itemKey="id" label="Stories"><template #default="{ item }">…</template></MCarousel>',
    properties: [
      {
        name: 'items / itemKey',
        type: 'readonly T[] / string or function',
        defaultValue: 'required / id',
        description: 'Slides com chaves únicas e estáveis.',
      },
      {
        name: 'modelValue / v-model',
        type: 'ChoiceValue or null',
        defaultValue: 'null',
        description: 'Chave do slide ativo. Ausente ou removida mostra o primeiro.',
      },
      {
        name: 'loop / disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Permite retornar ao começo; bloqueia a interação.',
      },
      {
        name: 'previousLabel / nextLabel / slideLabel / emptyLabel',
        type: 'string',
        defaultValue: 'Previous slide / Next slide / Slide / No slides',
        description: 'Rótulos traduzíveis.',
      },
    ],
    behavior:
      'Botões, indicadores, setas do teclado Web e swipe horizontal mudam o slide. Jolt anima a entrada e respeita movimento reduzido. Não há autoplay. Somente o slide ativo é montado; mantenha drafts no app por chave. O slot recebe item, index e itemKey. Interações Web em controles dentro do slide não iniciam swipe; a rolagem vertical continua disponível. Uma largura e conteúdo com altura estável evitam saltos. Os indicadores são destinados a coleções pequenas, como onboarding e destaques.',
  },
  'range-slider': {
    usage: '<MRangeSlider v-model="budget" :min="0" :max="1000" :step="25" label="Budget" />',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'readonly [number, number]',
        defaultValue: '[0, 100]',
        description: 'Par ordenado; marcadores não atravessam um ao outro.',
      },
      {
        name: 'min / max / step',
        type: 'number',
        defaultValue: '0 / 100 / 1',
        description: 'Limites finitos e passo positivo; aceita decimais.',
      },
      {
        name: 'lowerLabel / upperLabel',
        type: 'string',
        defaultValue: 'Minimum / Maximum',
        description: 'Nome de cada extremo.',
      },
      {
        name: 'formatValue',
        type: '(number) => string',
        defaultValue: '—',
        description: 'Texto de apresentação; o modelo permanece numérico.',
      },
      {
        name: 'disabled / readonly',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Impede alterações.',
      },
    ],
    behavior:
      'Na Web, dois inputs range compartilham a faixa e mantêm foco e identidade independentes, inclusive quando coincidem. No nativo, marcadores de 48 DIP respondem a pan; campos MNumberInput rotulados oferecem ajuste preciso, teclado e leitor de tela. Jolt anima o feedback dos marcadores nativos. A orientação numérica da faixa é esquerda para direita. Os valores são arredondados ao passo e limitados; entradas não finitas, limites inválidos e pares invertidos são rejeitados.',
  },
  calendar: {
    usage:
      '<MCalendar v-model="dates" mode="range" label="Your next escape" initialMonth="2026-11" locale="en-US" />',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'CivilDate or DateRange or null',
        defaultValue: 'null',
        description: 'Data ISO no modo single, objeto start/end no modo range.',
      },
      {
        name: 'mode',
        type: 'single or range',
        defaultValue: 'single',
        description: 'Seleção simples ou intervalo inclusivo.',
      },
      {
        name: 'min / max / unavailableDates',
        type: 'CivilDate / CivilDate / readonly CivilDate[]',
        defaultValue: '— / — / []',
        description: 'Limites e dias indisponíveis.',
      },
      {
        name: 'initialMonth / locale / firstDayOfWeek',
        type: 'string / en-US or pt-BR / number',
        defaultValue: '2000-01 / en-US / locale',
        description: 'Mês vazio determinístico; sem leitura implícita do relógio.',
      },
      {
        name: 'disabled / readonly',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Bloqueia seleção; readonly permite explorar meses.',
      },
    ],
    behavior:
      'Calendário embutido, com a mesma aritmética civil dos date pickers. Não converte datas em timestamps nem aplica fuso. O primeiro clique define start; o segundo completa o intervalo e pode preceder start. Intervalos que atravessam dias indisponíveis emitem invalid e preservam o início. Um clique após um intervalo completo inicia outro. Não toma foco ao montar. Web oferece uma parada de Tab, setas, Home/End e PageUp/PageDown; nativo oferece botões e rolagem horizontal para fontes grandes. Use footer para legenda e ações.',
  },
  rating: {
    usage: '<MRating v-model="score" :step="0.5" label="How was your stay?" />',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'number',
        defaultValue: '0',
        description: 'Avaliação de zero até max.',
      },
      {
        name: 'max / step',
        type: 'number / 1 or 0.5',
        defaultValue: '5 / 1',
        description: 'De uma a dez estrelas, inteiras ou meias.',
      },
      {
        name: 'readonly / disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Resumo sem controles ou controles indisponíveis.',
      },
      {
        name: 'clearable / clearLabel',
        type: 'boolean / string',
        defaultValue: 'true / Clear rating',
        description: 'Ação explícita para zerar.',
      },
      {
        name: 'formatValue',
        type: '(value, max) => string',
        defaultValue: '—',
        description: 'Texto da avaliação e nomes acessíveis.',
      },
    ],
    behavior:
      'Estrelas acionáveis escolhem valores inteiros e recebem o feedback Jolt do MButton. Com step 0.5, um slider permite selecionar meias estrelas com toque, teclado ou leitor de tela. O modo readonly mostra os ícones e a descrição textual, sem ações. Valores são limitados e arredondados; use o modelo numérico, sem extrair texto dos ícones.',
  },
  'tree-view': {
    usage:
      '<MTreeView v-model="selected" v-model:expanded="expanded" :nodes="nodes" label="Files" @load="loadChildren" />',
    properties: [
      {
        name: 'nodes',
        type: 'readonly TreeNode[]',
        defaultValue: 'required',
        description: 'key, label, disabled, children e hasChildren.',
      },
      {
        name: 'modelValue / v-model',
        type: 'ChoiceValue or null',
        defaultValue: 'null',
        description: 'Chave selecionada, independente da expansão.',
      },
      {
        name: 'expanded / v-model:expanded',
        type: 'readonly ChoiceValue[]',
        defaultValue: '[]',
        description: 'Chaves dos ramos abertos.',
      },
      {
        name: 'loadingKeys',
        type: 'readonly ChoiceValue[]',
        defaultValue: '[]',
        description: 'Ramos carregando; evita repetir pedidos durante a espera.',
      },
      {
        name: 'disabled / emptyLabel',
        type: 'boolean / string',
        defaultValue: 'false / No items',
        description: 'Indisponibilidade global e estado vazio.',
      },
    ],
    behavior:
      'Cada nó tem uma chave única em toda a árvore; ciclos e profundidade acima de 100 níveis são rejeitados. hasChildren com children ausente emite load ao expandir. O app busca os filhos, atualiza nodes e controla loadingKeys; forneça [] para um resultado vazio. Requisições, erros e cancelamento pertencem ao app. Web oferece roving tabindex, setas, Home/End, busca por inicial e Enter/Space; setas de expansão seguem o padrão de árvore esquerda/direita. Nativo mantém ações explícitas para expandir e selecionar. MReveal/Jolt anima a expansão com movimento reduzido. Não há seleção em cascata nem virtualização nesta versão.',
  },
  popover: {
    usage: '<MPopover v-model:open="open" label="Filters" triggerLabel="Filters">…</MPopover>',
    properties: [
      {
        name: 'open / v-model:open',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Visibilidade controlada pelo app.',
      },
      {
        name: 'label / triggerLabel',
        type: 'string',
        defaultValue: 'required',
        description: 'Nome do painel e texto do acionador.',
      },
      {
        name: 'placement',
        type: 'bottom-start / bottom-end / top-start / top-end',
        defaultValue: 'bottom-start',
        description: 'Alinhamento preferido; inverte e limita à área visível.',
      },
      {
        name: 'width',
        type: 'number',
        defaultValue: '280',
        description: 'Largura preferida em px/DIP.',
      },
      {
        name: 'padding',
        type: 'token / number',
        defaultValue: 'md',
        description: 'Espaçamento interno.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Bloqueia abertura e solicita fechamento.',
      },
    ],
    behavior:
      'Superfície ancorada para filtros e formulários pequenos. O componente cuida do acionador, posicionamento e retorno de foco. O slot padrão recebe close(). update:open solicita a mudança de visibilidade; close(reason) informa acionador, toque externo, Escape, voltar do Android, seleção ou programa. opened ocorre depois da apresentação. Na Web acompanha tamanho, rolagem, viewport e RTL; no nativo fecha ao rolar um ancestral. Escape/toque externo fecham; voltar do Android participa do adaptador de navegação instalado. No nativo exige um ancestral MScreen. O painel respeita a área segura; para fluxos longos use Sheet. Na Web é não modal, e Tab pode sair do painel; no nativo a camada delimita a navegação de acessibilidade. No SSR a apresentação aguarda montagem no cliente. Tema e injeções continuam sendo os da declaração.',
  },
  menu: {
    usage:
      '<MMenu v-model:open="open" label="Actions" triggerLabel="Actions" :items="actions" @select="onAction" />',
    properties: [
      {
        name: 'items',
        type: 'MenuItem[]',
        defaultValue: 'required',
        description:
          'Ações com value, label, icon, disabled e destructive; grupo/separador com key única.',
      },
      {
        name: 'open / v-model:open',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Visibilidade controlada.',
      },
      {
        name: 'label / triggerLabel',
        type: 'string',
        defaultValue: 'required',
        description: 'Nome do menu e texto do acionador.',
      },
      {
        name: 'placement / width',
        type: 'Popover props',
        defaultValue: 'bottom-start / 280',
        description: 'Apresentação ancorada compartilhada.',
      },
    ],
    behavior:
      'Menu de ações de um nível, composto sobre Popover. select(value, item) emite apenas para ação habilitada e solicita fechamento com motivo select. Números e strings mantêm identidades distintas. Na Web suporta Enter/Espaço, setas, Home/End, busca pela primeira letra e Escape com retorno de foco. Setas pulam ações desabilitadas. Grupos são títulos visuais; separadores não são ações. No nativo usa botões Mavis acessíveis em camada ancorada. Submenus, seleção checkbox/radio e execução assíncrona não fazem parte deste contrato; tarefas e confirmações pertencem à aplicação.',
  },
  'app-bar': {
    usage: '<MAppBar title="Library" back><template #actions>…</template></MAppBar>',
    properties: [
      { name: 'title', type: 'string', defaultValue: 'required', description: 'Título da tela.' },
      { name: 'subtitle', type: 'string', defaultValue: '—', description: 'Texto complementar.' },
      {
        name: 'back',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Mostra ação de voltar.',
      },
      {
        name: 'backLabel',
        type: 'string',
        defaultValue: 'Back',
        description: 'Nome acessível da ação.',
      },
      {
        name: 'navigateBack',
        type: '() => void / Promise',
        defaultValue: '—',
        description: 'Substitui o voltar do adaptador instalado.',
      },
    ],
    behavior:
      'Cabeçalho com slots leading e actions. A ação de voltar aguarda a navegação do app e emite back ao concluir ou error se falhar. Configure createRouterNavigation uma vez para Vue Router, Nuxt ou vue-router-ns, ou passe navigateBack. O componente não cria Page, roteador, posição fixa nem duplica a área segura; no nativo ela pertence ao MScreen. Posicione o cabeçalho fora da área de rolagem, ou use a receita existente de cabeçalho retido, quando precisar mantê-lo visível. O título quebra linha para acomodar texto ampliado.',
  },
  'tab-bar': {
    usage: '<MTabBar :modelValue="currentRoute" :items="destinations" label="Main navigation" />',
    properties: [
      {
        name: 'items',
        type: 'NavigationItem[]',
        defaultValue: 'required',
        description: 'value estável, label, href e opcionais icon, badge, disabled, navigate.',
      },
      {
        name: 'modelValue',
        type: 'string / number / null',
        defaultValue: 'null',
        description: 'Identidade da rota atual fornecida pelo app.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Nome da região de navegação.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Desabilita todos os destinos.',
      },
      {
        name: 'safeArea',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Inset inferior opcional na Web; nativo já usa MScreen.',
      },
    ],
    behavior:
      'Navegação por rotas com links reais na Web e ações nativas usando o serviço instalado. Derive modelValue da rota confirmada; não há seleção otimista nem evento update:modelValue que contorne guards. Cliques modificados na Web preservam o comportamento do link. error encaminha falhas de navegação. O link atual tem aria-current="page"; no nativo o nome inclui currentLabel. Badges entram no nome acessível. Use MTabs para painéis locais. A barra participa do layout normal; o app decide a posição. Use poucos destinos e nomes curtos; não há menu de overflow. No nativo mantenha a área segura do MScreen; ative o inset Web somente quando posicionar a barra no limite inferior da viewport.',
  },
  'time-picker': {
    usage:
      '<MTimePicker v-model="time" label="Meeting time" min="08:00" max="18:00" :minuteStep="15" />',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'HH:mm / null',
        defaultValue: 'null',
        description: 'Horário canônico sem data.',
      },
      {
        name: 'draft / v-model:draft',
        type: 'string',
        defaultValue: '—',
        description: 'Texto de edição opcional controlado.',
      },
      { name: 'label', type: 'string', defaultValue: 'required', description: 'Rótulo visível.' },
      {
        name: 'locale',
        type: 'en-US / pt-BR',
        defaultValue: 'en-US',
        description: 'Ciclo de exibição padrão.',
      },
      {
        name: 'hourCycle',
        type: 'h12 / h23',
        defaultValue: 'locale',
        description: 'Exibição explícita em 12/24 horas.',
      },
      {
        name: 'min / max',
        type: 'HH:mm',
        defaultValue: '00:00 / 23:59',
        description: 'Limites inclusivos no mesmo dia.',
      },
      {
        name: 'minuteStep',
        type: 'number',
        defaultValue: '1',
        description: 'Divisor de 60 entre 1 e 30.',
      },
      {
        name: 'disabled / readonly',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Bloqueia edição e abertura.',
      },
      {
        name: 'name',
        type: 'string',
        defaultValue: '—',
        description: 'Campo oculto Web envia o modelo canônico.',
      },
    ],
    behavior:
      'O campo mostra h:mm AM/PM em en-US e HH:mm em pt-BR, salvo hourCycle explícito. Texto incompleto permanece visível sem substituir o último modelo válido. validityChange informa empty, valid, incomplete, invalid, range ou step; use para bloquear envio enquanto o texto for inválido. update:draft, focus e blur são compartilhados; os métodos públicos são focus()/blur(). Alterações no seletor são provisórias até Aplicar; Cancelar preserva o modelo. Web usa controles rotulados de hora/minuto/período; iOS e Android usam TimePicker do sistema dentro de MSheet. Limites e intervalo são validados antes de confirmar; rodas nativas podem mostrar um valor que não pode ser confirmado. required desabilita Limpar; a validação de negócio pertence ao app. Traduza rótulos de ações, campos e erro.\n\nUm horário isolado não é um instante: este componente não aplica fuso nem horário de verão. Combine data civil, horário e fuso explícito no domínio antes de produzir um instante; depois use o helper existente formatDateTime para exibi-lo. formatTime, parseTime e validateTime formatam e validam o horário de modo determinístico nos renderizadores e no SSR. Limites min/max que atravessam a meia-noite são rejeitados.',
  },
  'virtual-list': {
    usage:
      '<MVirtualList :items="items" itemKey="id" :rowHeight="72" :height="360" label="Collections"><template #default="{ item }">…</template></MVirtualList>',
    properties: [
      {
        name: 'items',
        type: 'readonly T[]',
        defaultValue: 'required',
        description: 'Coleção controlada pelo app.',
      },
      {
        name: 'itemKey',
        type: 'keyof T / (item: T) => string or number',
        defaultValue: 'id',
        description: 'Identidade única estável; índices não servem para reordenação.',
      },
      {
        name: 'rowHeight',
        type: 'number',
        defaultValue: 'required',
        description: 'Altura fixa positiva em px/DIP.',
      },
      {
        name: 'height',
        type: 'number',
        defaultValue: 'required',
        description: 'Altura finita da área de rolagem.',
      },
      {
        name: 'overscan',
        type: 'number',
        defaultValue: '3',
        description: 'Linhas extras Web; nativo controla o buffer.',
      },
      {
        name: 'initialIndex',
        type: 'number',
        defaultValue: '0',
        description: 'Destino inicial de rolagem.',
      },
      {
        name: 'label / emptyLabel',
        type: 'string',
        defaultValue: 'required / No items',
        description: 'Nome da lista e fallback vazio.',
      },
    ],
    behavior:
      'Coleção vertical com altura fixa de linha. Web renderiza a viewport mais overscan; NativeScript usa ListView com reciclagem. O slot padrão tipado recebe { item, index, itemKey }; empty substitui o estado vazio. O método público scrollToIndex(index) rejeita índices inválidos. Use substituição imutável do array ou itens reativos. Chaves ausentes/duplicadas falham cedo; números e strings mantêm identidades distintas. Ao reordenar preserva o primeiro item lógico visível quando possível: no nativo restaura a linha e na Web também o deslocamento em pixels.\n\nMantenha drafts, seleção e carregamento no item ou em store pela chave. Estado local da célula não sobrevive à desmontagem; no nativo o filho com chave é recriado ao reciclar para outro item. Na Web a linha focada continua montada ao rolar e, se removida, o foco retorna à lista. Não há promessa de preservar foco de editores nativos arbitrários fora da viewport. Escolha rowHeight que comporte texto e fonte de acessibilidade; altura variável, paginação, arrastar para reordenar e restauração automática entre rotas ficam fora deste primeiro contrato. Dê à lista uma viewport limitada e evite colocá-la dentro de outro scroller vertical. SSR renderiza a mesma janela inicial limitada e hidrata sua posição.',
  },

  'number-input': {
    usage: '<m-number-input v-model="quantity" label="Quantity" :min="1" :max="8" />',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'number | null',
        defaultValue: 'null',
        description: 'Valor válido controlado pelo app.',
      },
      {
        name: 'draft / v-model:draft',
        type: 'string',
        defaultValue: '—',
        description: 'Rascunho opcional, inclusive texto incompleto.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Rótulo visível obrigatório.',
      },
      {
        name: 'min / max',
        type: 'number',
        defaultValue: '—',
        description: 'Limites inclusivos.',
      },
      {
        name: 'step',
        type: 'number',
        defaultValue: '1',
        description: 'Passo positivo dos botões e das setas Web.',
      },
      {
        name: 'locale',
        type: 'en-US | pt-BR',
        defaultValue: 'en-US',
        description: 'Separador decimal; agrupamento não é aceito.',
      },
      {
        name: 'disabled / readonly',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Bloqueia edição e ações.',
      },
    ],
    behavior:
      'Texto incompleto permanece no editor sem publicar um número inválido. Não aceita agrupamento, notação exponencial nem moeda. Usa números JavaScript; não é um tipo decimal financeiro. focus() e blur() são públicos.',
    events: [
      {
        name: 'update:modelValue',
        payload: 'number | null',
        description: 'Evento controlado.',
      },
      {
        name: 'update:draft',
        payload: 'string',
        description: 'Evento controlado.',
      },
      {
        name: 'validityChange',
        payload: 'NumberDraft',
        description: 'Evento controlado.',
      },
    ],
  },
  'multi-select': {
    usage: '<m-multi-select v-model="extras" :options="options" label="Extras" :maxSelected="2" />',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'readonly ChoiceValue[]',
        defaultValue: '[]',
        description: 'Valores únicos controlados pelo app.',
      },
      {
        name: 'options',
        type: 'readonly ChoiceOption[]',
        defaultValue: 'required',
        description: 'Opções locais com valor, rótulo e disabled opcional.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Rótulo e título da Sheet.',
      },
      {
        name: 'maxSelected',
        type: 'number',
        defaultValue: '—',
        description: 'Limite positivo de escolhas.',
      },
      {
        name: 'searchLabel / closeLabel / removeLabel',
        type: 'string',
        defaultValue: '—',
        description: 'Textos das ações, definidos pelo app.',
      },
    ],
    behavior:
      'Busca local em uma Sheet nos dois renderizadores. Cada seleção deve existir em options; filtro não apaga seleções. Não inclui paginação remota ou virtualização. O app atualiza opções e seleção de forma consistente.',
    events: [
      {
        name: 'update:modelValue',
        payload: 'ChoiceValue[]',
        description: 'Evento controlado.',
      },
    ],
  },
  image: {
    usage: '<m-image src="https://example.com/print.png" alt="Art print" :aspectRatio="4/3" />',
    properties: [
      {
        name: 'src',
        type: 'string',
        defaultValue: 'required',
        description: 'Imagem local, data URI ou URL conforme a plataforma.',
      },
      {
        name: 'alt',
        type: 'string',
        defaultValue: 'required',
        description: 'Descrição; texto vazio para imagem decorativa.',
      },
      {
        name: 'aspectRatio',
        type: 'number',
        defaultValue: '4 / 3',
        description: 'Proporção positiva que reserva a altura.',
      },
      {
        name: 'fit',
        type: 'cover | contain',
        defaultValue: 'cover',
        description: 'Recorte ou encaixe da imagem.',
      },
      {
        name: 'radius',
        type: 'token | number',
        defaultValue: 'md',
        description: 'Raio do tema ou número.',
      },
      {
        name: 'loadingLabel / errorLabel',
        type: 'string',
        defaultValue: '—',
        description: 'Textos de carregamento e falha.',
      },
    ],
    behavior:
      'Preserva o espaço durante carregamento e falha. Resultados de fontes antigas são ignorados. Usa o carregamento da plataforma, sem cache global próprio ou promessa de cancelamento de rede.',
    events: [
      {
        name: 'load',
        payload: 'string',
        description: 'Evento controlado.',
      },
      {
        name: 'error',
        payload: 'string',
        description: 'Evento controlado.',
      },
    ],
  },

  grid: {
    usage: `<m-grid :columns="3" :min-column-width="180" gap="md">
  <m-card>Uma ideia</m-card>
  <m-card>Outra ideia</m-card>
</m-grid>`,
    properties: [
      prop('columns', 'number', '—', 'Número fixo de colunas, ou limite com minColumnWidth.'),
      prop(
        'minColumnWidth',
        'number',
        '—',
        'Largura mínima desejada por coluna, em pixels CSS ou DIPs.',
      ),
      prop('gap', 'Spacing', 'none', 'Espaçamento horizontal e vertical por token.'),
    ],
    behavior:
      'Colunas iguais por largura disponível, preservando os filhos. Uma coluna no SSR quando não há columns.',
    layout: true,
  },
  stack: {
    usage: `<m-stack gap="md" :responsive="{ at: 640, direction: 'row', gap: 'lg' }">
  <m-input label="Nome" />
  <m-button>Continuar</m-button>
</m-stack>`,
    properties: [
      prop(
        'direction',
        'row | column',
        'column',
        'Direção antes da primeira medição e em larguras menores.',
      ),
      prop(
        'responsive',
        'StackBreakpoint | StackBreakpoint[]',
        '—',
        'Ajustes por largura disponível: at, direction, gap, align, justify e wrap.',
      ),
    ],
    behavior: 'Mede o espaço interno, sem desmontar os filhos. SSR começa com a direção base.',
    layout: true,
  },
  link: {
    usage: `<m-link href="https://mavis-ui.getcortexlabs.com/" target="_blank">
  Conheça o Mavis
</m-link>`,
    properties: [
      prop('href', 'string', 'obrigatório', 'Destino da navegação.'),
      prop(
        'navigate',
        '(href) => void | Promise',
        '—',
        'Navegação do aplicativo. Obrigatória para rotas internas no nativo.',
      ),
      prop('target', '_self | _blank', '_self', 'Destino da janela na Web.'),
      prop('disabled', 'boolean', 'false', 'Mantém o nome e impede ativação.'),
      prop('inline', 'boolean', 'false', 'Apresentação em linha, sem altura mínima de toque.'),
    ],
    events: [
      { name: '@click', payload: '—', description: 'Ativação permitida.' },
      { name: '@error', payload: 'unknown', description: 'Falha no adaptador de navegação.' },
    ],
    behavior:
      'Usa um link real na Web. Ctrl/Cmd+clique continua no navegador. No nativo, o aplicativo resolve suas rotas e o sistema abre URLs externas.',
  },
  'date-picker': {
    usage:
      '<m-date-picker v-model="date" label="Data do encontro" locale="pt-BR" initialMonth="2026-11" />',
    properties: [
      prop(
        'dateFormat',
        'iso | locale | yyyy-MM-dd | dd/MM/yyyy | MM/dd/yyyy',
        'iso',
        'Formato numérico do campo; modelo continua ISO.',
      ),
      prop(
        'draft / v-model:draft',
        'string',
        'omitido',
        'Texto controlado separado do modelo válido; restaura edições incompletas.',
      ),
      prop(
        'modelValue / v-model',
        'CivilDate | null',
        'null',
        'Data civil AAAA-MM-DD, sem hora nem conversão UTC.',
      ),
      prop('label', 'string', 'obrigatório', 'Nome visível do campo.'),
      prop('min / max', 'CivilDate', '—', 'Limites inclusivos.'),
      prop('unavailableDates', 'readonly CivilDate[]', '[]', 'Datas bloqueadas.'),
      prop(
        'locale',
        'en-US | pt-BR',
        'en-US',
        'Texto do calendário; dateFormat controla a edição.',
      ),
      prop('initialMonth', 'YYYY-MM', '2000-01', 'Mês inicial determinístico para SSR.'),
      prop('disabled / readonly', 'boolean', 'false', 'Bloqueia alterações.'),
      prop('name', 'string', '—', 'Nome do editor na Web.'),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'CivilDate | null',
        description: 'Solicita uma data válida.',
      },
      {
        name: 'update:draft',
        payload: 'string',
        description: 'Edição parcial, sem perder texto inválido.',
      },
      {
        name: 'validityChange',
        payload: 'DateValidation',
        description: 'Validade do rascunho atual.',
      },
    ],
    behavior:
      'Teclado e calendário compartilham as regras. focus()/blur() públicos. Valores são datas civis, não instantes.',
  },
  'date-range-picker': {
    usage:
      '<m-date-range-picker v-model="period" label="Período" locale="pt-BR" initialMonth="2026-11" />',
    properties: [
      prop(
        'draft / v-model:draft',
        'DateRangeDraft',
        'omitido',
        'Texto controlado separado do modelo válido; restaura edições incompletas.',
      ),
      prop(
        'modelValue / v-model',
        'DateRange',
        '{ start: null, end: null }',
        'Extremos parciais mantidos; ordem nunca corrigida silenciosamente.',
      ),
      prop('label', 'string', 'obrigatório', 'Nome do intervalo.'),
      prop('min / max', 'CivilDate', '—', 'Limites inclusivos.'),
      prop(
        'unavailableDates',
        'readonly CivilDate[]',
        '[]',
        'Bloqueia também datas dentro do intervalo.',
      ),
      prop('locale', 'en-US | pt-BR', 'en-US', 'Idioma do calendário.'),
      prop('startName / endName', 'string', '—', 'Nomes dos editores na Web.'),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'DateRange',
        description: 'Solicita extremos válidos, inclusive incompletos.',
      },
      { name: 'update:draft', payload: 'DateRangeDraft', description: 'Texto dos dois editores.' },
      {
        name: 'validityChange',
        payload: 'DateValidation',
        description: 'Validade do intervalo digitado.',
      },
    ],
    behavior:
      'Rascunhos inválidos permanecem editáveis. O calendário mantém um único dono de foco. Datas sem fuso.',
  },
  combobox: {
    usage:
      '<m-combobox v-model="city" v-model:query="query" :search="searchCities" :selectedOption="selected" label="Cidade" @select="selected = $event" />',
    properties: [
      prop(
        'modelValue / v-model',
        'ChoiceValue | null',
        'null',
        'Escolha confirmada; digitar não seleciona.',
      ),
      prop('query / v-model:query', 'string', 'obrigatório', 'Texto de busca controlado.'),
      prop('search', 'ComboboxSearch', 'obrigatório', 'Serviço da aplicação com cancelamento.'),
      prop(
        'selectedOption',
        'ChoiceOption | null',
        'null',
        'Rótulo da escolha fora dos resultados atuais.',
      ),
      prop('initialResults', 'ComboboxSnapshot', '—', 'Snapshot inicial para SSR.'),
      prop('label', 'string', 'obrigatório', 'Nome visível.'),
      prop('debounce', 'number', '200', 'Espera antes de buscar, em ms.'),
      prop('maxResults', 'number', '50', 'Limite entre 1 e 100 resultados.'),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'ChoiceValue | null',
        description: 'Pede seleção ou limpeza.',
      },
      { name: 'update:query', payload: 'string', description: 'Pede alteração do editor.' },
      {
        name: 'select',
        payload: 'ChoiceOption | null',
        description: 'Snapshot da opção solicitada.',
      },
    ],
    behavior:
      'Resultados atrasados são ignorados; foco e IME permanecem no editor. Apenas uma seleção e uma página de resultados.',
  },
  'file-picker': {
    usage: '<m-file-picker :selection="files" label="Anexos" chooseLabel="Escolher arquivos" />',
    properties: [
      prop(
        'selection',
        'FileSelectionController',
        'obrigatório',
        'Criado com useFileSelection; pertence à aplicação.',
      ),
      prop('label', 'string', 'obrigatório', 'Nome visível.'),
      prop('disabled', 'boolean', 'false', 'Impede novas ações.'),
      prop(
        'chooseLabel / uploadLabel / cancelLabel / retryLabel / removeLabel',
        'string',
        'inglês',
        'Rótulos traduzidos pela aplicação.',
      ),
      prop('statusLabels / errorLabels', 'record parcial', '{}', 'Mensagens de estado e rejeição.'),
    ],
    behavior:
      'O seletor usa APIs de cada plataforma. Upload é uma função da aplicação, sem endpoint embutido. Descritores são serializáveis; handles e URLs temporárias não são.',
  },
  'form-group': {
    usage:
      '<m-form-group label="Seus dados" description="Vamos manter contato.">\n  <m-input v-model="name" label="Nome" />\n</m-form-group>',
    properties: [
      prop('label', 'string', 'obrigatório', 'Título visível do grupo.'),
      prop('description', 'string', "''", 'Explicação opcional.'),
      prop('id', 'string', 'gerado', 'Identidade estável.'),
    ],
    behavior:
      'Agrupa campos. A aplicação controla valores, regras e envio. Na Web, não cria um form nem intercepta Enter.',
  },
  'form-errors': {
    usage: '<m-form-errors :form="form" title="Revise seus dados" />',
    properties: [
      prop(
        'form',
        'FormController',
        'obrigatório',
        'Controlador criado por formulário, com campos registrados.',
      ),
      prop('title', 'string', 'Review these fields', 'Título visível.'),
      prop('announce', 'boolean', 'false', 'Opta por alert na Web.'),
    ],
    events: [
      {
        name: 'focus',
        payload: 'field, focused',
        description: 'Resultado da ativação de um erro.',
      },
    ],
    behavior:
      'Erros levam aos handles públicos dos campos, com reveal opcional. Validação cancelável e valores do formulário pertencem à aplicação.',
  },
  steps: {
    usage: '<m-steps v-model="step" :steps="steps" label="Etapas do cadastro" />',
    properties: [
      prop('modelValue / v-model', 'ChoiceValue | null', 'null', 'Etapa atual.'),
      prop('steps', 'readonly StepOption[]', 'obrigatório', 'IDs, rótulos, bloqueio e estado.'),
      prop('label', 'string', 'obrigatório', 'Nome da navegação.'),
      prop('loading / disabled', 'boolean', 'false', 'Bloqueia solicitações.'),
      prop(
        'currentLabel / completeLabel / errorLabel',
        'string',
        'Current / Complete / Needs attention',
        'Textos de estado.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'ChoiceValue',
        description: 'Solicita outra etapa habilitada.',
      },
    ],
    behavior:
      'A aplicação controla validação e painéis. A receita usa KeepAlive para preservar editores visitados e revela a etapa antes de focar erros.',
  },
  pagination: {
    usage:
      '<m-pagination v-model="page" :total="total" :pageSize="20" label="Páginas de resultados" />',
    properties: [
      prop('modelValue / v-model', 'number', '1', 'Página começando em 1.'),
      prop('total', 'number', 'obrigatório', 'Total de registros, inteiro não negativo.'),
      prop('pageSize', 'number', '20', 'Registros por página.'),
      prop('siblingCount', '0 | 1 | 2', '1', 'Páginas vizinhas.'),
      prop('statusText', 'string', "''", 'Anúncio dos resultados, definido pela aplicação.'),
      prop('loading / disabled', 'boolean', 'false', 'Bloqueia solicitações.'),
      prop('label', 'string', 'Result pages', 'Nome da navegação.'),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'number',
        description: 'Solicita uma página diferente e válida.',
      },
    ],
    behavior:
      'O pai controla os resultados e a recuperação de uma página inválida após filtros. A receita cancela pedidos antigos e volta à primeira página.',
  },

  chip: {
    usage:
      '<m-chip v-model="design" selectable label="Design" icon="palette" />\n<m-chip label="Vue" removable removeLabel="Remover Vue" @remove="removeTag" />',
    properties: [
      prop(
        'label',
        'string',
        'obrigatório',
        'Texto visível e nome da ação de seleção; não pode ser vazio.',
      ),
      prop('icon', 'IconName', '—', 'Ícone decorativo, substituído pelo check quando selecionado.'),
      prop(
        'selectable / modelValue',
        'boolean / boolean',
        'false / false',
        'Ativa seleção controlada por v-model. Sem selectable, o rótulo é estático.',
      ),
      prop(
        'removable / removeLabel',
        'boolean / string',
        'false / —',
        'Ação separada de remoção. Exige nome contextual não vazio, como Remover Vue.',
      ),
      prop('tone', 'primary | accent', 'primary', 'Cor da seleção e do foco.'),
      prop(
        'disabled',
        'boolean',
        'false',
        'Bloqueia seleção e remoção, preservando o valor recebido.',
      ),
      prop(
        'width / grow / shrink',
        'dimensão / number / number',
        'auto / 0 / contexto',
        'Participação no layout.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'boolean',
        description: 'Solicita alternar a seleção. O pai aceita ou rejeita a mudança.',
      },
      {
        name: 'remove',
        payload: '—',
        description: 'Solicita remoção. Não altera seleção nem remove o componente sozinho.',
      },
    ],
    behavior:
      'Seleção e remoção são alvos irmãos. Use Row com wrap para coleções. Na Web, Tab alcança cada ação; Enter/Espaço a ativam. O app cuida da coleção e do foco após remover um item. Press usa Jolt no nativo e CSS na Web, respeitando movimento reduzido.',
  },
  'empty-state': {
    usage:
      '<m-empty-state title="Nada salvo ainda."\n  description="Guarde uma leitura para depois." icon="bookmark">\n  <template #actions>\n    <m-button @click="explore">Explorar</m-button>\n  </template>\n</m-empty-state>',
    properties: [
      prop('title', 'string', 'obrigatório', 'Título não vazio; cresce com o conteúdo.'),
      prop('description', 'string', 'vazio', 'Contexto e orientação opcional.'),
      prop('icon', 'IconName', 'inbox', 'Símbolo da ilustração padrão.'),
      prop('tone', 'primary | accent', 'primary', 'Cor da ilustração.'),
      prop('compact', 'boolean', 'false', 'Reduz ilustração, título e espaços; sem altura fixa.'),
      prop(
        'titleAs',
        'h1 | h2 | h3 | h4 | h5 | h6',
        'h2',
        'Nível do título na Web; no nativo continua um cabeçalho.',
      ),
      prop(
        'width / grow / shrink',
        'dimensão / number / number',
        'auto / 0 / contexto',
        'Participação no layout.',
      ),
    ],
    behavior:
      'illustration substitui a arte padrão e é sempre decorativo; coloque ações no slot actions. O app decide quando mostrar, buscar ou recuperar. Não toma foco, anuncia mudanças ou inicia animação automaticamente. Sem eventos próprios.',
  },
  accordion: {
    usage:
      '<m-accordion v-model="expanded"\n  :items="questions" label="Ajuda"\n  expandedLabel="Expandido" collapsedLabel="Recolhido">\n  <template #default="{ item }">\n    <m-text>{{ answers[item.value] }}</m-text>\n  </template>\n</m-accordion>',
    properties: [
      prop(
        'items',
        'readonly AccordionItem[]',
        'obrigatório',
        'value único (string ou número), title, description?, icon? e disabled?.',
      ),
      prop(
        'modelValue',
        'readonly ChoiceValue[]',
        '[]',
        'Valores abertos. Sempre um array, inclusive no modo simples.',
      ),
      prop('multiple', 'boolean', 'false', 'Permite manter várias seções abertas.'),
      prop('label', 'string', 'obrigatório', 'Nome acessível do grupo.'),
      prop(
        'expandedLabel / collapsedLabel',
        'string',
        'Expanded / Collapsed',
        'Estado acessível nativo. Traduza no app.',
      ),
      prop(
        'disabled',
        'boolean',
        'false',
        'Bloqueia cabeçalhos; não desabilita os controles do conteúdo.',
      ),
      prop(
        'width / grow / shrink',
        'dimensão / number / number',
        'auto / 0 / contexto',
        'Participação no layout.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'ChoiceValue[]',
        description: 'Pede a nova lista de valores abertos, sem alterar o array recebido.',
      },
    ],
    behavior:
      'O slot padrão recebe { item }. O corpo monta ao abrir e desmonta após a saída do Reveal; guarde dados persistentes no pai. Reveal anima a altura intrínseca. No modo simples, mais de um valor aberto lança RangeError. Valores ausentes dos items não abrem um corpo nem alteram o model. Na Web, setas verticais, Home e End movem o foco entre cabeçalhos; Enter/Espaço alternam a seção.',
  },
  'segmented-control': {
    usage:
      "<m-segmented-control v-model=\"period\"\n  label=\"Período\" :options=\"[\n    { value: 'day', label: 'Dia' },\n    { value: 'week', label: 'Semana' },\n    { value: 'month', label: 'Mês' }\n  ]\" />",
    properties: [
      prop(
        'options',
        'readonly SegmentedOption[]',
        'obrigatório',
        'value único (string ou número), label e disabled? por opção.',
      ),
      prop(
        'modelValue',
        'ChoiceValue | null',
        'null',
        'Valor selecionado. null ou valor ausente deixa o grupo sem marcador.',
      ),
      prop(
        'label',
        'string',
        'obrigatório',
        'Nome acessível do grupo, sem rótulo visual automático.',
      ),
      prop('disabled', 'boolean', 'false', 'Bloqueia todas as opções.'),
      prop(
        'width / grow / shrink',
        'dimensão / number / number',
        'auto / 0 / contexto',
        'Participação no layout.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'ChoiceValue',
        description: 'Pede uma opção habilitada diferente da atual.',
      },
    ],
    behavior:
      'Segmentos de largura igual, rótulos com quebra natural e indicador animado com Jolt no nativo/CSS na Web. Prefira 2–4 opções curtas. O app controla o valor e o conteúdo relacionado; não há painéis nem navegação embutida. Na Web, Tab entra uma vez e setas/Home/End focam e pedem seleção, pulando desabilitados. Respeita movimento reduzido.',
  },
  'list-item': {
    usage: `<m-list-item title="Marina Costa" description="Design · São Paulo" interactive @click="openMember">
  <template #leading><m-avatar name="Marina Costa" :accessibilityHidden="true" /></template>
</m-list-item>`,
    properties: [
      prop('title', 'string', 'obrigatório', 'Título não vazio; quebra linha.'),
      prop('description', 'string', "''", 'Texto secundário opcional.'),
      prop('interactive', 'boolean', 'false', 'Uma ação sobre a linha inteira.'),
      prop('disabled', 'boolean', 'false', 'Bloqueia somente a ação da linha interativa.'),
      prop(
        'width / grow / shrink',
        'dimension / number / number',
        'auto / 0 / contexto',
        'Participação no layout.',
      ),
      prop(
        'accessibilityLabel',
        'string',
        'título + descrição',
        'Nome interativo; inclua informação relevante dos slots.',
      ),
      prop('accessibilityHidden', 'boolean', 'false', 'Oculta conteúdo redundante.'),
      prop('id', 'string', '—', 'Identificador opcional.'),
    ],
    events: [
      { name: 'click', payload: 'none', description: 'Linha interativa habilitada ativada.' },
    ],
    behavior:
      'Slots leading e trailing para conteúdo compacto. Sem slot padrão. Linha interativa sem trailing mostra seta; não aninhe controles nesse modo. Linha informativa preserva seus filhos e aceita botão independente. Altura natural, superfície do tema, padding/radius md, sem borda. Sem coleção virtualizada, seleção ou navegação própria.',
  },
  separator: {
    usage: `<m-column>
  <m-list-item title="Design" />
  <m-separator inset="md" />
  <m-list-item title="Engenharia" />
</m-column>`,
    properties: [
      prop('orientation', 'horizontal | vertical', 'horizontal', 'Eixo da linha.'),
      prop('length', 'number', 'automático', 'Comprimento da linha em DIP/px, sem margens.'),
      prop('spacing', 'token | number', 'none', 'Margem de cada lado perpendicular à linha.'),
      prop('inset', 'token | number', 'none', 'Recuo de cada ponta da linha.'),
      prop('id', 'string', '—', 'Identificador opcional.'),
    ],
    behavior:
      'Linha decorativa de 1 DIP/px na cor border, sem conteúdo, foco, eventos ou semântica de grupo. Automática em Column horizontal ou Row vertical, sem wrap; fora desses contextos, forneça length. Length explícito é centralizado. Valores negativos ou não finitos são rejeitados.',
  },
  avatar: {
    usage: `<m-row gap="md">
  <m-avatar name="Marina Costa" size="lg" />
  <m-badge text="Criadora" tone="accent" />
</m-row>`,
    properties: [
      prop(
        'src',
        'string',
        "''",
        'Fonte de imagem conforme a plataforma; ausente ou inválida mantém o fallback.',
      ),
      prop(
        'name',
        'string',
        "''",
        'Primeira e última iniciais; nome acessível padrão. Sem nome, ícone user-round.',
      ),
      prop('size', 'sm | md | lg | xl', 'md', '32, 48, 64 ou 96 DIP/px.'),
      prop('shape', 'circle | square', 'circle', 'Círculo ou quadrado com cantos arredondados.'),
      prop('accessibilityLabel', 'string', 'name', 'Substitui o nome anunciado.'),
      prop(
        'accessibilityHidden',
        'boolean',
        'false',
        'Oculta identidade redundante com texto próximo.',
      ),
      prop('id', 'string', '—', 'Identificador opcional.'),
    ],
    behavior:
      'Imagem com recorte central, iniciais durante carregamento/erro e ícone sem nome. Trocar src restaura o fallback e ignora resultados antigos. Sem upload, ação ou retry automático. Dimensão e marca visual fixas; forneça o nome ao lado para texto ampliável.',
  },
  badge: {
    usage: `<m-row gap="sm" wrap>
  <m-badge text="Publicado" tone="success" />
  <m-badge :text="0" tone="accent" accessibilityLabel="0 mensagens não lidas" />
</m-row>`,
    properties: [
      prop('text', 'string | number', 'obrigatório', 'Conteúdo do badge, incluindo zero.'),
      prop(
        'tone',
        'neutral | primary | accent | success | warning | danger',
        'neutral',
        'Cores semânticas do tema.',
      ),
      prop('size', 'sm | md', 'md', 'Escala de texto e espaçamento; altura acompanha o conteúdo.'),
      prop('accessibilityLabel', 'string', '—', 'Descreve contadores no contexto.'),
      prop('accessibilityHidden', 'boolean', 'false', 'Oculta conteúdo redundante.'),
      prop('id', 'string', '—', 'Identificador opcional.'),
    ],
    behavior:
      'Informação sem ação, foco, slots ou anúncio automático. O app controla valores, tradução e formatação, como 99+. Texto longo quebra linha; use Row com wrap para grupos. Não dependa apenas da cor para transmitir significado.',
  },
  progress: {
    usage: `<m-progress :value="64" label="Download da coleção" tone="accent" />
<m-progress indeterminate label="Preparando coleção" indeterminateLabel="Preparando" />`,
    properties: [
      prop(
        'value / max',
        'number',
        '0 / 100',
        'Valor finito limitado entre zero e max. max precisa ser finito e positivo.',
      ),
      prop('label', 'string', 'obrigatório', 'Nome acessível; não desenha um rótulo visível.'),
      prop(
        'indeterminate',
        'boolean',
        'false',
        'Segmento em movimento para tarefas sem total conhecido.',
      ),
      prop(
        'indeterminateLabel',
        'string',
        'Loading',
        'Descrição acessível do estado indeterminado. Traduza no app.',
      ),
      prop('size', 'sm | md | lg', 'md', 'Espessuras de 4, 8 e 12 DIP/px.'),
      prop(
        'tone',
        'primary | accent | success | warning | danger',
        'primary',
        'Cor de preenchimento do tema.',
      ),
      prop(
        'width / grow / shrink',
        'dimension / number / number',
        'auto / 0 / contexto',
        'Participação no layout, como Box.',
      ),
      prop(
        'id / accessibilityHidden',
        'string / boolean',
        '— / false',
        'Identificador e exclusão da árvore acessível.',
      ),
    ],
    behavior:
      'Indicador linear sem slots ou eventos. O app fornece valor, mensagem e estado da tarefa. Valores conhecidos mudam diretamente; o segmento indeterminado usa Jolt no nativo e CSS na Web. Movimento reduzido mantém o segmento parado no centro. Pausa em segundo plano; libera animações e listeners no unload/unmount.',
  },
  alert: {
    usage: `<m-alert v-if="visible" title="Não foi possível baixar" description="Confira a conexão e tente novamente." tone="error" dismissible closeLabel="Fechar aviso" @close="visible = false">
  <template #actions><m-button @click="retry">Tentar novamente</m-button></template>
</m-alert>`,
    properties: [
      prop('title', 'string', 'obrigatório', 'Título não vazio do aviso.'),
      prop('description', 'string', "''", 'Texto complementar opcional.'),
      prop('tone', 'info | success | warning | error', 'info', 'Ícone e cor semântica do aviso.'),
      prop(
        'dismissible',
        'boolean',
        'false',
        'Mostra a ação de fechar. A remoção pertence ao app.',
      ),
      prop(
        'closeLabel',
        'string',
        'Dismiss message',
        'Nome acessível da ação de fechar. Traduza no app.',
      ),
      prop(
        'announce',
        'boolean',
        'false',
        'Anúncio opcional de mensagens dinâmicas, sem mover o foco.',
      ),
      prop(
        'width / grow / shrink',
        'dimension / number / number',
        'auto / 0 / contexto',
        'Participação no layout, como Column.',
      ),
      prop(
        'id / accessibilityHidden',
        'string / boolean',
        '— / false',
        'Identificador e exclusão da árvore acessível.',
      ),
    ],
    events: [
      {
        name: 'close',
        payload: '—',
        description: 'Solicita fechar. Use v-if ou o estado do app para remover o aviso.',
      },
    ],
    behavior:
      'Aviso persistente no fluxo da tela, sem timer, fila, overlay ou captura de foco. Slot actions para botões independentes; não há slot default. Título e descrição são lidos juntos no nativo. announce cria uma região status/alert na Web e solicita anúncio nativo quando carregado; a fala depende do leitor de tela.',
  },
  skeleton: {
    usage: `<m-column gap="md">
  <m-text>Carregando perfil…</m-text>
  <m-row gap="md">
    <m-skeleton :width="48" :height="48" radius="full" :shrink="0" />
    <m-column :width="0" :grow="1" gap="sm">
      <m-skeleton width="70%" />
      <m-skeleton width="45%" :height="12" />
    </m-column>
  </m-row>
</m-column>`,
    properties: [
      prop(
        'width',
        'number | % | auto',
        'auto',
        'Preenche a largura da Column por padrão. Use dimensões iguais com radius=full para um círculo.',
      ),
      prop(
        'height',
        'number | % | auto',
        '16',
        'Altura do bloco. Porcentagens precisam de um pai com altura definida.',
      ),
      prop('radius', 'token | number', 'sm', 'Arredondamento dos cantos.'),
      prop(
        'animated',
        'boolean',
        'true',
        'Pulso discreto. Movimento reduzido mantém o bloco estático.',
      ),
      prop('grow / shrink', 'number', '0 / contexto', 'Participação no layout, como Box.'),
      prop('id', 'string', '—', 'Identificador opcional.'),
    ],
    behavior:
      'Bloco decorativo, sem foco, eventos ou conteúdo. O app controla carregamento, dados e mensagem de estado. Cor border do tema; Jolt no nativo e CSS na Web. Animação suspensa em segundo plano e liberada no unload/unmount. Remova os placeholders quando a resposta chegar.',
  },
  tabs: {
    usage: `<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceValue } from '@getcortexlabs/mavis-core'
const active = ref<ChoiceValue | null>('profile')
const tabs = [
  { value: 'profile', label: 'Perfil' },
  { value: 'activity', label: 'Atividade' },
]
</script>
<template>
  <m-tabs v-model="active" :tabs="tabs" label="Seu espaço">
    <template #default="{ value }">
      <m-text v-if="value === 'profile'">Sobre você.</m-text>
      <m-text v-else>Suas últimas novidades.</m-text>
    </template>
  </m-tabs>
</template>`,
    properties: [
      prop(
        'modelValue',
        'string | number | null',
        'null',
        'Aba selecionada. Use v-model e inicialize o valor no app.',
      ),
      prop(
        'tabs',
        'readonly TabOption[]',
        'obrigatório',
        'Itens com value único, label não vazio e disabled opcional. Número e string são distintos.',
      ),
      prop('label', 'string', 'obrigatório', 'Nome não vazio do conjunto de abas.'),
      prop(
        'keepAlive',
        'boolean',
        'false',
        'Preserva painéis visitados fora da árvore visível. Remover a aba descarta seu cache.',
      ),
      prop(
        'disabled',
        'boolean',
        'false',
        'Impede ativação pelo usuário; alterações externas ainda são aplicadas.',
      ),
      prop('id', 'string', 'omitido', 'Identificador do componente.'),
      prop(
        'width / grow / shrink',
        'Dimension / number',
        'auto / 0 / contexto',
        'Tamanho e participação no layout do contêiner.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'string | number',
        description: 'Uma ativação habilitada e diferente solicita mudança; o pai pode rejeitar.',
      },
    ],
    behavior:
      'Slot default recebe { value }. Por padrão, mudar de aba desmonta o painel anterior. keepAlive preserva instâncias visitadas e desativa as inativas. Guarde no app os dados que precisam permanecer. Null ou valor removido deixa a barra sem painel e não escolhe outra aba. Barra horizontal rolável, indicador Jolt no nativo e CSS na Web. Na Web, setas/Home/End movem foco; Enter/Espaço ativam. Não altera rotas nem troca painéis por swipe.',
  },
  dialog: {
    usage: `<script setup lang="ts">
import { ref } from 'vue'
const open = ref(false)
function remove() {
  // Execute a ação e feche quando terminar.
  open.value = false
}
</script>
<template>
  <m-screen>
    <m-button @click="open = true">Excluir coleção</m-button>
    <m-dialog v-model:open="open" title="Excluir coleção?"
      description="Esta ação não pode ser desfeita." tone="danger"
      confirmLabel="Excluir" cancelLabel="Manter" @confirm="remove" />
  </m-screen>
</template>`,
    properties: [
      prop('open', 'boolean', 'false', 'Estado controlado por v-model:open.'),
      prop('title', 'string', 'obrigatório', 'Título não vazio, usado como nome acessível.'),
      prop('description', 'string', 'omitido', 'Consequência da ação, em texto simples.'),
      prop('tone', 'default | danger', 'default', 'Ênfase do ícone e da confirmação.'),
      prop(
        'confirmLabel / cancelLabel',
        'string',
        'Continue / Cancel',
        'Rótulos não vazios. Traduza no app.',
      ),
      prop(
        'loading',
        'boolean',
        'false',
        'Bloqueia ações e fechamento incidental durante o processamento.',
      ),
      prop('loadingLabel', 'string', 'Working…', 'Texto não vazio durante o processamento.'),
      prop(
        'dismissible',
        'boolean',
        'true',
        'Permite fundo, Escape e voltar. Cancelar continua disponível.',
      ),
      prop('id', 'string', 'omitido', 'Identificador da superfície modal.'),
    ],
    events: [
      {
        name: 'confirm',
        payload: 'nenhum',
        description: 'Solicita a ação. O app decide quando fechar.',
      },
      {
        name: 'update:open',
        payload: 'false',
        description: 'Solicita fechamento por cancelamento ou navegação.',
      },
      {
        name: 'close',
        payload: 'DialogCloseReason',
        description:
          'cancel, backdrop, escape, back, program ou navigation; emitido antes da saída terminar.',
      },
    ],
    behavior:
      'Declare dentro de MScreen no nativo. Uma decisão por vez, sem slots ou modais aninhados. A confirmação não fecha sozinha; loading permite processar e tentar novamente após erro. Web contém e devolve foco; Android trata voltar. Navegar libera a camada; segundo plano preserva o estado. Toast aguarda o modal. Texto longo rola dentro da superfície.',
  },
  toast: {
    usage: `<script setup lang="ts">
import { useToast } from '@getcortexlabs/mavis-core/vue'
const toast = useToast()
const saved = () => toast.show({
  title: 'Perfil salvo',
  message: 'Tudo no lugar.',
  tone: 'success',
})
</script>

<template>
  <MScreen>
    <MButton @click="saved">Salvar</MButton>
    <MToast :controller="toast" closeLabel="Fechar aviso" />
  </MScreen>
</template>`,
    properties: [
      prop(
        "useToast({ scope: 'app' })",
        'ToastController',
        'local',
        'Fila por app, hospedada automaticamente pela Screen ativa; preserva ordem e tempo entre rotas e adia avisos durante modais.',
      ),
      prop(
        'controller',
        'ToastController',
        'obrigatório',
        'Fila criada por useToast(). Um host por fila, dentro da Screen nativa.',
      ),
      prop(
        'closeLabel',
        'string',
        'Dismiss notification',
        'Nome acessível do botão de fechar; traduza no app.',
      ),
      prop(
        'show({ message, title?, tone?, duration? })',
        'método do controller',
        '—',
        'Enfileira um aviso e retorna seu ID. message é obrigatório; title é opcional.',
      ),
      prop('tone', 'success | error | warning | info', 'info', 'Ícone e cor semântica do aviso.'),
      prop(
        'duration',
        'number',
        '5000',
        'Milissegundos depois da entrada. Zero mantém o aviso até fechar.',
      ),
      prop(
        'dismiss(id?) / clear()',
        'métodos do controller',
        '—',
        'Fecha o atual ou remove um ID; clear também descarta a fila pendente.',
      ),
    ],
    behavior:
      'Um aviso por vez, no topo, sem bloquear a tela ou roubar foco. O escopo local limpa ao sair da página; scope app usa a fila do aplicativo e preserva avisos entre rotas. Modais adiam a apresentação e pausam o tempo. A Web pausa também em hover/foco e aba oculta. Sem ações ou swipe.',
  },
  select: {
    usage: `<MSelect
  v-model="interest"
  label="Seu universo"
  placeholder="Escolha um interesse"
  closeLabel="Fechar"
  :options="[
    { value: 'design', label: 'Design' },
    { value: 'photo', label: 'Fotografia' },
  ]"
/>`,
    properties: [
      prop(
        'modelValue / v-model',
        'string | number | null',
        'null',
        'Escolha controlada; null exibe o placeholder.',
      ),
      prop(
        'options',
        'readonly ChoiceOption[]',
        'obrigatório',
        'Mesmo contrato de Radio: value único, label, helperText e disabled opcionais.',
      ),
      prop('label', 'string', 'obrigatório', 'Rótulo visível do campo e título da lista.'),
      prop(
        'placeholder',
        'string',
        'Select an option',
        'Texto quando o valor não corresponde a uma opção.',
      ),
      prop(
        'helperText / error',
        'string',
        "''",
        'Mensagem abaixo do campo. error tem precedência e pinta a borda.',
      ),
      prop('disabled', 'boolean', 'false', 'Impede abertura e fecha a lista sem alterar o valor.'),
      prop(
        'closeLabel',
        'string',
        'Close',
        'Nome acessível do botão de fechar. Traduza com os rótulos.',
      ),
      prop('emptyText', 'string', 'No options available', 'Mensagem na lista vazia.'),
      prop(
        'width / grow / shrink',
        'dimension / number',
        'auto / 0 / contexto',
        'Dimensão e distribuição do campo.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'string | number',
        description:
          'Uma solicitação por escolha habilitada diferente. Abrir, cancelar, repetir e limpar externamente não emitem.',
      },
    ],
    behavior:
      'A seleção fecha a lista imediatamente; o pai mantém a decisão final. Para limpar, atribua null. Opções mudam ao vivo: remoção não escolhe um substituto, disabled não ativa. Web usa diálogo/listbox com setas, Home/End, letras, Enter/Espaço, Escape e retorno de foco. No nativo, declare dentro de MScreen e integre claimSystemBack com o router, como no Sheet. Lista local, sem busca ou virtualização.',
  },
  radio: {
    usage: `<MRadioGroup
  v-model="rhythm"
  label="Ritmo de leitura"
  :options="[
    { value: 'weekly', label: 'Sem pressa' },
    { value: 'daily', label: 'Um pouco por dia' },
  ]"
/>`,
    properties: [
      prop(
        'modelValue / v-model',
        'string | number | null',
        'null',
        'Escolha controlada. null representa nenhuma seleção.',
      ),
      prop(
        'options',
        'readonly ChoiceOption[]',
        'obrigatório',
        'Opções com value único, label, helperText e disabled opcionais.',
      ),
      prop('label', 'string', 'obrigatório', 'Rótulo visível do grupo.'),
      prop('helperText', 'string', "''", 'Explicação opcional do grupo.'),
      prop('disabled', 'boolean', 'false', 'Desabilita todas as opções sem mudar o valor.'),
      prop(
        'width / grow / shrink',
        'dimension / number',
        'auto / 0 / contexto',
        'Distribuição do grupo no layout.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'string | number',
        description:
          'Solicita uma opção habilitada diferente da atual. Não emite null nem repete a seleção.',
      },
    ],
    behavior:
      'O app mantém o valor. Remover a opção selecionada deixa todas desmarcadas; desabilitá-la preserva a marca. Nenhum desses casos emite ou escolhe outra opção. Na Web, Tab entra uma vez no grupo; setas percorrem opções habilitadas, Home/End vão à primeira/última e Espaço seleciona. Arrays, validação e envio pertencem ao app.',
  },
  checkbox: {
    usage:
      '<MCheckbox\n  v-model="selected"\n  v-model:indeterminate="mixed"\n  label="Todos os assuntos"\n  indeterminateLabel="Seleção parcial"\n/>',
    properties: [
      prop('modelValue / v-model', 'boolean', 'false', 'Valor marcado, controlado pelo app.'),
      prop(
        'indeterminate',
        'boolean',
        'false',
        'Estado visual parcial, com precedência sobre modelValue.',
      ),
      prop('label', 'string', 'obrigatório', 'Rótulo visível e nome acessível.'),
      prop('helperText', 'string', "''", 'Explicação opcional abaixo do rótulo.'),
      prop(
        'indeterminateLabel',
        'string',
        'Partially selected',
        'Descrição acessível do estado parcial. Traduza junto com o rótulo.',
      ),
      prop('disabled', 'boolean', 'false', 'Impede ativação pelo rótulo, marca e teclado.'),
      prop(
        'width / grow / shrink',
        'dimension / number',
        'auto / 0 / contexto',
        'Dimensão e distribuição de espaço da linha.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'boolean',
        description: 'Uma proposta por ativação. Parcial solicita true; caso contrário, alterna.',
      },
      {
        name: 'update:indeterminate',
        payload: 'false',
        description: 'Solicita limpar o parcial antes de emitir o novo valor marcado.',
      },
    ],
    behavior:
      'A linha inteira ativa o controle. O app aceita os eventos ou mantém os valores anteriores. Mudanças externas não emitem. Arrays, selecionar todos e validação pertencem ao app. Na Web, Espaço alterna o checkbox; no nativo, a superfície usa um botão com semântica de checkbox e feedback Jolt na marca.',
  },
  switch: {
    usage:
      '<MSwitch\n  v-model="notifications"\n  label="Notificações"\n  helperText="Novidades de quem você acompanha."\n/>',
    properties: [
      prop('modelValue / v-model', 'boolean', 'false', 'Preferência controlada pela aplicação.'),
      prop('label', 'string', 'obrigatório', 'Rótulo visível e nome acessível do controle.'),
      prop('helperText', 'string', "''", 'Detalhe opcional abaixo do rótulo.'),
      prop('disabled', 'boolean', 'false', 'Impede ativação pelo rótulo e pelo controle.'),
      prop('width', 'number | auto | %', 'auto', 'Largura da linha completa.'),
      prop('grow / shrink', 'number', '0 / contexto', 'Distribuição de espaço no layout pai.'),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'boolean',
        description: 'Uma mudança por ativação; alterações externas não emitem.',
      },
    ],
    behavior:
      'Toque no rótulo ou no controle. Na Web, Espaço e Enter alternam o valor. O app aceita a mudança atualizando o v-model; sem isso, o valor anterior é mantido. O controle nativo preserva os gestos e a animação do sistema; o rótulo tem feedback Jolt. Não coloque links ou outros controles dentro do rótulo.',
  },
  input: {
    usage:
      '<m-input\n  v-model="name"\n  label="Nome"\n  placeholder="Como podemos chamar você?"\n  helperText="Seu nome, do seu jeito."\n/>',
    properties: [
      prop(
        'trailingAction',
        'InputAction { icon, label, disabled? }',
        'nenhuma',
        'Ação com alvo de 48 pontos e nome obrigatório. Emite action; disabled/readonly bloqueiam a ação. Não combinar com trailingIcon.',
      ),
      prop(
        'modelValue / v-model',
        'string',
        "''",
        'Texto controlado pela aplicação, sem conversão numérica.',
      ),
      prop('label', 'string', 'obrigatório', 'Rótulo visível e nome acessível do editor.'),
      prop('placeholder', 'string', "''", 'Dica dentro do campo vazio. Não substitui o label.'),
      prop('helperText', 'string', "''", 'Orientação exibida abaixo do campo.'),
      prop(
        'error',
        'string',
        "''",
        'Mensagem de erro; substitui a ajuda e marca o campo como inválido.',
      ),
      prop(
        'type',
        'text | email | password | tel | url | search',
        'text',
        'Tipo de edição e sugestão de teclado. Na Web, email/URL participam da validação HTML.',
      ),
      prop(
        'name / autocomplete / form',
        'string',
        'não definido',
        'Somente Web: nome no envio, preenchimento e ID do formulário.',
      ),
      prop('required', 'boolean', 'false', 'Somente Web: validação HTML de campo obrigatório.'),
      prop(
        'inputmode',
        'none | text | decimal | numeric | tel | search | email | url',
        'não definido',
        'Somente Web: sugestão de teclado virtual.',
      ),
      prop(
        'disabled / readonly',
        'boolean',
        'false',
        'Impedem edição. Disabled também impede foco e interação.',
      ),
      prop(
        'multiline',
        'boolean',
        'false',
        'Permite novas linhas com type="text". Enter não emite submit.',
      ),
      prop(
        'rows',
        'number',
        '3',
        'Inteiro positivo. Define a altura mínima aproximada do campo multilinha, que cresce com o conteúdo.',
      ),
      prop(
        'maxLength',
        'number',
        'sem limite',
        'Inteiro não negativo. Limita novas edições em unidades UTF-16, sem cortar um modelo externo.',
      ),
      prop(
        'icon / trailingIcon',
        'IconName',
        'nenhum',
        'Ícones Lucide decorativos dentro da caixa do editor, em tom muted ou danger com erro.',
      ),
      prop(
        'autocapitalize',
        'none | sentences | words | characters',
        'sentences / none',
        'Sentences em text/search; none nos demais tipos. O teclado pode ignorar a sugestão.',
      ),
      prop(
        'autocorrect',
        'boolean',
        'true / false',
        'Ativo em text/search; desativado nos demais tipos.',
      ),
      prop(
        'returnKey',
        'done | next | go | search | send',
        'done',
        'Sugere a ação do teclado de uma linha. A aplicação trata submit e move ou remove o foco.',
      ),
      prop(
        'width / grow / shrink',
        'dimension / number',
        'auto / 0 / contexto',
        'Dimensionam o conjunto de rótulo, editor e mensagem.',
      ),
      prop(
        'id',
        'string',
        'automático na Web',
        'Identifica o editor. Class e style afetam o contêiner.',
      ),
    ],
    events: [
      {
        name: 'action',
        payload: 'nenhum',
        description:
          'Ativação da ação final; o app altera valor/tipo. Mantém o foco da edição e não envia formulários.',
      },
      {
        name: 'update:modelValue',
        payload: 'string',
        description: 'Texto completo da edição, incluindo valores intermediários do IME.',
      },
      {
        name: 'focus / blur',
        payload: 'nenhum',
        description: 'Entrada e saída do foco de edição.',
      },
      {
        name: 'submit',
        payload: 'string',
        description:
          'Ação do teclado em um campo de uma linha; não encerra o foco automaticamente.',
      },
    ],
    behavior:
      'Uma ref expõe focus() e blur(), com InputHandle, InstanceType ou useTemplateRef. Na Web, atributos ARIA e eventos de edição chegam ao editor; class/style ficam no contêiner. Sem @submit no Input, Enter segue o formulário HTML. Com @submit, o handler assume a ação. O modelo controla o reset: trate @reset.prevent no formulário. Validação da aplicação e persistência pertencem ao app. Não formate o v-model a cada tecla: isso pode interromper composição e seleção. No nativo, readonly não abre o teclado; seleção/cópia dependem da plataforma. Use dentro de Screen com scroll para acompanhar o teclado.',
  },
  button: {
    usage: '<m-button\n  variant="primary"\n  @click="save"\n>\n  Salvar\n</m-button>',
    properties: [
      ...navigationProperties,
      prop(
        'slots leading / trailing',
        'conteúdo decorativo',
        'omitidos',
        'Prevalecem sobre icon/trailingIcon. Não recebem interação nem alteram o nome acessível; não aninhe controles.',
      ),
      prop(
        'motionSurface',
        'MotionSurface (experimental)',
        'não definido',
        'Referência criada por createMotionSurface(); disponível após montar/carregar. Compartilha animação do app e preserva a camada de press. Veja o guia de movimento.',
      ),
      prop(
        'type',
        'button | submit | reset',
        'button',
        'Somente Web: ação HTML. Loading e disabled bloqueiam envio e reset.',
      ),
      prop(
        'name / value / form',
        'string',
        'não definido',
        'Somente Web: nome/valor do botão de envio e ID do formulário.',
      ),
      prop(
        'variant',
        'primary | secondary | ghost',
        'primary',
        'Escolhe a hierarquia visual da ação.',
      ),
      prop('size', 'sm | md | lg', 'md', 'Define altura mínima, espaçamento e tamanho da fonte.'),
      prop(
        'disabled',
        'boolean',
        'false',
        'Bloqueia a ação e aplica o estado visual desabilitado.',
      ),
      prop(
        'loading',
        'boolean',
        'false',
        'Bloqueia novos cliques enquanto uma ação está em andamento.',
      ),
      prop(
        'loadingText',
        'string',
        'Loading…',
        'Substitui o texto do botão durante o carregamento.',
      ),
      prop('text', 'string', 'slot', 'Alternativa ao conteúdo de texto entre as tags.'),
      prop(
        'icon / trailingIcon',
        'IconName',
        'nenhum',
        'Ícone Lucide antes ou depois do texto, no tamanho do botão. Um botão só com ícone exige accessibilityLabel.',
      ),
      prop(
        'accessibilityLabel',
        'string',
        'texto visível',
        'Nome anunciado quando o texto visível não descreve a ação por completo.',
      ),
      prop(
        'grow / shrink',
        'number',
        '0 / contexto',
        'Controlam a distribuição de espaço no layout pai.',
      ),
    ],
    events: [
      {
        name: '@error',
        payload: 'unknown',
        description: 'Falha na navegação do aplicativo ou na abertura da URL.',
      },
      {
        name: '@click',
        payload: 'sem payload',
        description:
          'Emitido ao ativar o botão. Não ocorre enquanto disabled ou loading estiver ativo.',
      },
    ],
    behavior:
      'O slot aceita texto simples ou interpolado. Declare save no seu componente. O Jolt anima a pressão nos dois renderizadores; na Web, Enter e Espaço ativam o botão e loading preserva o foco do teclado.',
  },
  slider: {
    usage:
      '<m-slider\n  v-model="temperature"\n  :min="16" :max="28"\n  :step="0.5"\n  label="Temperatura"\n/>',
    properties: [
      prop(
        'v-model',
        'number',
        '0',
        'Valor selecionado. Declare temperature como um estado numérico.',
      ),
      prop('min', 'number', '0', 'Limite inferior, menor que max.'),
      prop('max', 'number', '100', 'Limite superior da faixa.'),
      prop('step', 'number', '1', 'Passo positivo. Aceita valores fracionários, como 0.5.'),
      prop('label', 'string', 'obrigatório', 'Nome acessível que descreve o controle.'),
      prop('disabled', 'boolean', 'false', 'Impede alterações pelo usuário.'),
    ],
    events: [
      {
        name: '@update:modelValue',
        payload: 'number',
        description: 'Emite o valor ajustado ao passo. v-model conecta este evento ao seu estado.',
      },
    ],
    behavior:
      'Todos os números precisam ser finitos. O último passo alcança max mesmo quando a faixa não é divisível por step. VoiceOver e TalkBack usam os valores reais da faixa e avançam um passo por ajuste. Na Web, use as setas, Home e End.',
  },
  card: {
    usage:
      '<m-card\n  interactive\n  accessibilityLabel="Abrir coleção"\n  @click="openCollection"\n>\n  <m-text>Minha coleção</m-text>\n</m-card>',
    properties: [
      ...navigationProperties,
      prop(
        'motionSurface',
        'MotionSurface (experimental)',
        '—',
        'Referência para animação, valores contínuos e drag/snap no mesmo componente. Veja o guia de movimento.',
      ),
      prop('gap', 'token | number', 'none', 'Espaço entre os elementos do cartão.'),
      prop('padding', 'token | number', 'tema (lg)', 'Espaço entre o conteúdo e a borda.'),
      prop(
        'elevation',
        'none | sm | md | lg',
        'tema (none)',
        'Sombra decorativa do tema, sem alterar o empilhamento.',
      ),
      prop('radius', 'token | number', 'lg', 'Arredondamento da superfície.'),
      prop(
        'interactive',
        'boolean',
        'false',
        'Transforma toda a superfície em uma única ação acessível.',
      ),
      prop('disabled', 'boolean', 'false', 'Bloqueia a ação de um cartão interativo.'),
      prop(
        'accessibilityLabel',
        'string',
        '—',
        'Nome acessível da ação. Use-o em cartões interativos com conteúdo visual.',
      ),
    ],
    events: [
      {
        name: '@error',
        payload: 'unknown',
        description: 'Falha na navegação do aplicativo ou na abertura da URL.',
      },
      {
        name: '@click',
        payload: 'sem payload',
        description:
          'Emitido pelo toque, clique ou teclado quando interactive está ativo e disabled está desligado.',
      },
    ],
    behavior:
      'Um cartão comum agrupa conteúdo. Um cartão interativo com accessibilityLabel representa uma única ação; seus descendentes Mavis não criam paradas de leitura. Não coloque botões, links ou campos dentro dele. Declare openCollection no seu componente.',
    layout: true,
  },
  text: {
    usage:
      '<m-text\n  as="h1"\n  variant="title"\n  tone="primary"\n>\n  Sua próxima ideia.\n</m-text>',
    properties: [
      prop(
        'variant',
        'display | title | heading | body | caption | overline',
        'body',
        'Escolhe uma escala tipográfica do tema.',
      ),
      prop(
        'weight',
        'normal | bold | 100 … 900 (strings)',
        'tema',
        'Altera o peso sem mudar o tamanho da variante.',
      ),
      prop(
        'MSpan',
        'text / weight / tone / emphasis',
        'nenhum',
        'Trechos dentro do mesmo texto; emphasis strong ou em. Não aceita views nem eventos.',
      ),
      prop('tone', 'chave da paleta', 'text', 'Cor semântica, como primary, accent ou muted.'),
      prop(
        'as',
        'p | span | h1 … h6',
        'p',
        'Define a semântica independentemente do tamanho visual.',
      ),
      prop('align', 'left | center | right', 'left', 'Alinhamento do texto.'),
      prop('wrap', 'boolean', 'true', 'Permite quebra de linha.'),
      prop('text', 'string', 'slot', 'Alternativa ao conteúdo de texto entre as tags.'),
      prop('grow / shrink', 'number', '0 / contexto', 'Distribuição de espaço no layout pai.'),
    ],
    behavior:
      'Use as para títulos acessíveis e variant para sua aparência. O slot aceita texto e MSpan com ênfase, peso e tom. Os trechos preservam a leitura e escala do sistema dentro de um único texto. Outras views usam layouts.',
  },
  icon: {
    usage:
      '<m-row gap="sm" align="center">\n  <m-icon name="search" tone="muted" />\n  <m-text>Buscar</m-text>\n</m-row>\n<m-icon name="circle-check"\n  tone="success" label="Concluído" />',
    properties: [
      prop(
        'name',
        'IconName',
        'obrigatório',
        'Nome do ícone Lucide, como search ou circle-check. Nomes desconhecidos lançam RangeError.',
      ),
      prop('size', 'sm | md | lg | number', 'md', '16, 20 ou 24 pontos, ou um número positivo.'),
      prop('tone', 'cor do tema', 'text', 'Cor da paleta, como primary, muted ou danger.'),
      prop(
        'label',
        'string',
        'nenhum',
        'Nome acessível. Sem label, o ícone é decorativo e fica oculto para leitores de tela.',
      ),
      prop('id', 'string', 'nenhum', 'Identifica o ícone renderizado.'),
    ],
    behavior:
      'Renderiza um glifo da fonte Lucide embutida nos pacotes. No NativeScript, copie fonts/lucide.ttf do pacote para a pasta fonts do app; na Web, o style.css carrega a fonte. O ícone mantém o tamanho dentro de Rows e centraliza ao lado do texto. Combine com um texto que carregue o significado; use label só quando o ícone fica sozinho.',
  },
  row: {
    usage:
      '<m-row gap="sm" align="center">\n  <m-button :grow="1">\n    Continuar\n  </m-button>\n  <m-button variant="ghost">\n    Voltar\n  </m-button>\n</m-row>',
    properties: layoutProperties(false),
    behavior:
      'Os filhos aparecem lado a lado. grow e shrink pertencem ao filho que deve ocupar ou ceder espaço. Use wrap quando o conteúdo precisar de mais de uma linha.',
    layout: true,
  },
  column: {
    usage:
      '<m-column gap="md" padding="lg">\n  <m-text variant="title">\n    Seu espaço.\n  </m-text>\n  <m-button>Começar</m-button>\n</m-column>',
    properties: layoutProperties(true),
    behavior:
      'Os filhos seguem um fluxo vertical e preservam sua altura natural. Os mesmos tokens de espaçamento são usados no nativo e na Web.',
    layout: true,
  },
  box: {
    usage:
      '<m-box :height="160">\n  <m-column padding="lg">\n    <m-text>Fundo</m-text>\n  </m-column>\n  <m-column align="end"\n    justify="end" padding="md">\n    <m-button>Abrir</m-button>\n  </m-column>\n</m-box>',
    properties: [
      prop(
        'width / height',
        'number | auto | %',
        'auto',
        'Delimitam a área compartilhada pelas camadas.',
      ),
      prop('radius', 'token | number', 'none', 'Arredondamento da área.'),
      prop('backgroundColor', 'string', 'transparente', 'Cor opcional atrás das camadas.'),
    ],
    behavior:
      'Todos os filhos ocupam a mesma área. O último fica por cima. Use Row e Column dentro das camadas para posicionar seu conteúdo.',
    layout: true,
  },
  screen: {
    usage:
      '<m-screen scroll>\n  <m-column padding="lg">\n    <m-text as="h1">\n      Minha tela\n    </m-text>\n  </m-column>\n</m-screen>',
    properties: [
      prop('scroll', 'boolean', 'false', 'Habilita a rolagem vertical do conteúdo.'),
      prop(
        'motionScroll',
        'MotionScrollSource (experimental)',
        '—',
        'Origem de movimento compartilhado com scroll ativo. Veja Field Guide e o guia de movimento.',
      ),
      prop(
        'dismissKeyboard',
        'boolean',
        'true',
        'Fecha o teclado ao tocar fora do editor e, com scroll, ao arrastar o conteúdo em direção a ele.',
      ),
    ],
    behavior:
      'Use uma Screen por página. Com scroll, a área de rolagem nativa respeita as safe areas; no iOS, acomoda o teclado. No Android, o app usa adjustResize. Um toque fora do editor, inclusive em um botão, fecha o teclado; o toque chega ao controle normalmente. Na Web, acompanha a área visível e preserva o foco após redimensionamento. Navegação e estado pertencem ao app; não aninhe Screens.',
  },
  sheet: {
    usage:
      '<m-button @click="open = true">Filtros</m-button>\n<m-sheet v-model:open="open" title="Filtros"\n  closeLabel="Fechar" @close="registrar">\n  <m-text>Conteúdo da sheet.</m-text>\n  <m-button @click="open = false">Aplicar</m-button>\n</m-sheet>',
    properties: [
      prop('open', 'boolean', 'false', 'Apresenta ou recolhe a sheet. Use v-model:open.'),
      prop(
        'accessibilityLabel',
        'string',
        'nenhum',
        'Nome alternativo sem cabeçalho quando title está ausente ou em branco. Um nome válido é obrigatório mesmo com open=false.',
      ),
      prop(
        'title',
        'string',
        'nenhum',
        'Cabeçalho e nome acessível, sem espaços nas extremidades. Sem título não vazio, accessibilityLabel é obrigatório.',
      ),
      prop(
        'dismissible',
        'boolean',
        'true',
        'Permite fechar pelo fundo, Escape, voltar, arrasto e botão de fechar. Lido ao abrir.',
      ),
      prop('fullscreen', 'boolean', 'false', 'Ocupa a altura útil em vez da altura do conteúdo.'),
      prop('closeLabel', 'string', 'Close', 'Nome acessível do botão de fechar.'),
      prop('padding', 'token | number', 'lg', 'Espaço interno do painel.'),
      prop('gap', 'token | number', 'none', 'Espaço entre os filhos do conteúdo.'),
      prop(
        'align',
        'start | center | end | stretch',
        'stretch',
        'Alinhamento horizontal do conteúdo.',
      ),
      prop('id', 'string', 'nenhum', 'Identifica o painel renderizado.'),
    ],
    events: [
      { name: 'update:open', payload: 'boolean', description: 'Pedido para abrir ou fechar.' },
      {
        name: 'close',
        payload: 'button | backdrop | escape | back | swipe | program',
        description: 'Motivo de cada fechamento, emitido ao pedir o fechamento.',
      },
    ],
    behavior:
      'No NativeScript a sheet é um painel na própria página, acima do conteúdo da Screen, movido pelo bottom sheet do Jolt: alça arrastável, snap na altura do conteúdo ou 100%, fundo escurecido, acompanhamento do teclado e voltar do Android. Na Web usa <dialog> modal com playback Jolt e arrasto pela alça: Escape, clique no fundo, foco contido e devolvido ao abrir e fechar. O conteúdo é montado ao abrir e removido depois de recolher. Exige uma MScreen como ancestral no nativo. O nome é validado mesmo fechado e nas atualizações; título tem precedência sobre accessibilityLabel. Para títulos assíncronos, forneça um nome alternativo ou use v-if.',
  },
  reveal: {
    usage:
      '<m-reveal :show="visible">\n  <m-card>\n    <m-text>Mais detalhes.</m-text>\n  </m-card>\n</m-reveal>',
    properties: [
      prop('show', 'boolean', 'false', 'Controla a entrada e a saída do conteúdo.'),
      ...layoutProperties(true),
    ],
    layout: true,
    behavior:
      'Declare visible como estado booleano. O Jolt anima altura e opacidade: de zero a auto na abertura e até zero no fechamento. O conteúdo permanece montado durante reversões rápidas e é removido somente ao fechar. Depois de abrir, a altura auto acompanha novas medidas. Respeita movimento reduzido. Ao fechar com o foco dentro do conteúdo, devolve-o ao elemento que estava focado na abertura, se ele ainda estiver disponível.',
  },
}
