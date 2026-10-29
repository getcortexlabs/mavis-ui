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
    'number | string',
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
      'O slot aceita texto simples ou interpolado. Declare save no seu componente. No nativo, o Jolt anima a pressão; na Web, Enter e Espaço ativam o botão.',
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
      'Todos os números precisam ser finitos. O último passo alcança max mesmo quando a faixa não é divisível por step. Na Web, use as setas, Home e End.',
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
      'Um cartão comum agrupa conteúdo. Um cartão interativo representa uma única ação: não coloque botões, links ou campos dentro dele. Declare openCollection no seu componente.',
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
        'number | string',
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
      'Use uma Screen por página. No NativeScript, ela representa uma Page e precisa de um host de navegação; não aninhe Pages. Na Web, usa main e acompanha a altura da janela.',
  },
  reveal: {
    usage:
      '<m-reveal :show="visible">\n  <m-card>\n    <m-text>Mais detalhes.</m-text>\n  </m-card>\n</m-reveal>',
    properties: [prop('show', 'boolean', 'false', 'Controla a entrada e a saída do conteúdo.')],
    behavior:
      'Declare visible como estado booleano. A entrada anima opacidade e deslocamento; a saída anima opacidade. O conteúdo é removido ao final. A altura não é interpolada. Respeita movimento reduzido.',
  },
}
