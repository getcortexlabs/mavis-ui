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

export const references: Record<string, ComponentReference> = {
  input: {
    usage:
      '<m-input\n  v-model="name"\n  label="Nome"\n  placeholder="Como podemos chamar você?"\n  helperText="Seu nome, do seu jeito."\n/>',
    properties: [
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
        'Tipo de edição e sugestão de teclado. Não valida o conteúdo.',
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
      'Uma ref expõe focus() e blur() (InputHandle de @getcortexlabs/mavis-core). Validação e persistência pertencem à aplicação. Não formate o v-model a cada tecla: isso pode interromper composição e seleção. No nativo, readonly não abre o teclado; seleção/cópia dependem da plataforma. Use dentro de Screen com scroll para acompanhar o teclado.',
  },
  button: {
    usage: '<m-button\n  variant="primary"\n  @click="save"\n>\n  Salvar\n</m-button>',
    properties: [
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
        name: '@click',
        payload: 'sem payload',
        description:
          'Emitido ao ativar o botão. Não ocorre enquanto disabled ou loading estiver ativo.',
      },
    ],
    behavior:
      'O slot aceita texto simples ou interpolado. Declare save no seu componente. No nativo, o Jolt anima a pressão; na Web, Enter e Espaço ativam o botão e loading preserva o foco do teclado.',
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
      prop('gap', 'token | number', 'none', 'Espaço entre os elementos do cartão.'),
      prop('padding', 'token | number', 'lg', 'Espaço entre o conteúdo e a borda.'),
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
      'Use as para títulos acessíveis e variant para sua aparência. O slot aceita texto simples ou interpolado; componha textos e outros elementos com layouts.',
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
    properties: [prop('scroll', 'boolean', 'false', 'Habilita a rolagem vertical do conteúdo.')],
    behavior:
      'Use uma Screen por página. Com scroll, a área de rolagem nativa respeita as safe areas; no iOS, acomoda o teclado. No Android, o app usa adjustResize. Na Web, acompanha a área visível e preserva o foco após redimensionamento. Navegação e estado pertencem ao app; não aninhe Screens.',
  },
  sheet: {
    usage:
      '<m-button @click="open = true">Filtros</m-button>\n<m-sheet v-model:open="open" title="Filtros"\n  closeLabel="Fechar" @close="registrar">\n  <m-text>Conteúdo da sheet.</m-text>\n  <m-button @click="open = false">Aplicar</m-button>\n</m-sheet>',
    properties: [
      prop('open', 'boolean', 'false', 'Apresenta ou recolhe a sheet. Use v-model:open.'),
      prop(
        'title',
        'string',
        'nenhum',
        'Cabeçalho e nome acessível. Sem title, accessibilityLabel é obrigatório.',
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
      'No NativeScript a sheet é um painel na própria página, acima do conteúdo da Screen, movido pelo bottom sheet do Jolt: alça arrastável, snap na altura do conteúdo ou 100%, fundo escurecido, acompanhamento do teclado e voltar do Android. Na Web usa <dialog> modal: Escape, clique no fundo, foco contido e devolvido ao abrir e fechar. O conteúdo é montado ao abrir e removido depois de recolher. Exige uma MScreen como ancestral no nativo.',
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
      'Declare visible como estado booleano. A entrada anima opacidade e deslocamento; a saída anima opacidade. O conteúdo é removido ao final. A altura não é interpolada. Respeita movimento reduzido. Ao fechar com o foco dentro do conteúdo, devolve-o ao elemento que estava focado na abertura, se ele ainda estiver disponível.',
  },
}
