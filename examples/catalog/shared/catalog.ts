import ButtonDemo from './demos/ButtonDemo.vue'
import SliderDemo from './demos/SliderDemo.vue'
import CardDemo from './demos/CardDemo.vue'
import TextDemo from './demos/TextDemo.vue'
import RowDemo from './demos/RowDemo.vue'
import ColumnDemo from './demos/ColumnDemo.vue'
import BoxDemo from './demos/BoxDemo.vue'
import ScreenDemo from './demos/ScreenDemo.vue'
import RevealDemo from './demos/RevealDemo.vue'

export const components = [
  {
    id: 'button',
    name: 'Button',
    tag: 'm-button',
    description: 'Ações, variações e estados de interação.',
    api: [
      'variant: primary · secondary · ghost',
      'size: sm · md · lg',
      'disabled · loading · loadingText',
      '@click: ação sem payload',
    ],
    demo: ButtonDemo,
  },
  {
    id: 'slider',
    name: 'Slider',
    tag: 'm-slider',
    description: 'Escolha valores com passos inteiros ou decimais.',
    api: [
      'v-model: valor numérico',
      'min · max · step',
      'label: nome acessível obrigatório',
      'disabled: bloqueia interação',
    ],
    demo: SliderDemo,
  },
  {
    id: 'card',
    name: 'Card',
    tag: 'm-card',
    description: 'Uma superfície para organizar conteúdo relacionado.',
    api: [
      'gap · padding · paddingX · paddingY',
      'radius: token ou número',
      'Conteúdo organizado em coluna',
    ],
    demo: CardDemo,
  },
  {
    id: 'text',
    name: 'Text',
    tag: 'm-text',
    description: 'Tipografia, hierarquia e cores do tema.',
    api: [
      'variant: display · title · heading · body · caption · overline',
      'tone: cor semântica do tema',
      'as: p · span · h1 … h6',
      'wrap · align · text ou slot',
    ],
    demo: TextDemo,
  },
  {
    id: 'row',
    name: 'Row',
    tag: 'm-row',
    description: 'Composição horizontal com espaço entre os filhos.',
    api: ['gap: token ou número', 'align · justify · wrap', 'padding · grow · shrink'],
    demo: RowDemo,
  },
  {
    id: 'column',
    name: 'Column',
    tag: 'm-column',
    description: 'Conteúdo vertical com alinhamento consistente.',
    api: ['gap: token ou número', 'align · justify · wrap', 'padding · grow · shrink'],
    demo: ColumnDemo,
  },
  {
    id: 'box',
    name: 'Box',
    tag: 'm-box',
    description: 'Camadas e elementos sobrepostos.',
    api: [
      'padding · radius · backgroundColor',
      'width · height · grow · shrink',
      'O último filho fica por cima',
    ],
    demo: BoxDemo,
  },
  {
    id: 'screen',
    name: 'Screen',
    tag: 'm-screen',
    description: 'A superfície de uma página, com rolagem opcional.',
    api: [
      'scroll: habilita rolagem vertical',
      'Uma Screen por tela da aplicação',
      'Page nativa · main na Web',
    ],
    demo: ScreenDemo,
  },
  {
    id: 'reveal',
    name: 'Reveal',
    tag: 'm-reveal',
    description: 'Entrada e saída de conteúdo com movimento.',
    api: [
      'show: insere e remove o conteúdo',
      'Entrada: opacidade e deslocamento',
      'Saída: opacidade',
      'Respeita movimento reduzido',
    ],
    demo: RevealDemo,
  },
] as const

export function findComponent(id: string) {
  return components.find((component) => component.id === id)
}
