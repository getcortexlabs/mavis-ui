import ButtonDemo from './demos/ButtonDemo.vue'
import InputDemo from './demos/InputDemo.vue'
import CheckboxDemo from './demos/CheckboxDemo.vue'
import SwitchDemo from './demos/SwitchDemo.vue'
import SliderDemo from './demos/SliderDemo.vue'
import CardDemo from './demos/CardDemo.vue'
import TextDemo from './demos/TextDemo.vue'
import IconDemo from './demos/IconDemo.vue'
import RowDemo from './demos/RowDemo.vue'
import ColumnDemo from './demos/ColumnDemo.vue'
import BoxDemo from './demos/BoxDemo.vue'
import ScreenDemo from './demos/ScreenDemo.vue'
import RevealDemo from './demos/RevealDemo.vue'
import SheetDemo from './demos/SheetDemo.vue'

export const components = [
  {
    id: 'input',
    name: 'Input',
    tag: 'm-input',
    description: 'Texto, estados e detalhes que fazem um formulário.',
    demo: InputDemo,
  },
  {
    id: 'button',
    name: 'Button',
    tag: 'm-button',
    description: 'Ações, variações e estados de interação.',
    demo: ButtonDemo,
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    tag: 'm-checkbox',
    description: 'Escolhas independentes, em todos os estados.',
    demo: CheckboxDemo,
  },
  {
    id: 'switch',
    name: 'Switch',
    tag: 'm-switch',
    description: 'Preferências que mudam com um toque.',
    demo: SwitchDemo,
  },
  {
    id: 'slider',
    name: 'Slider',
    tag: 'm-slider',
    description: 'Escolha valores com passos inteiros ou decimais.',
    demo: SliderDemo,
  },
  {
    id: 'card',
    name: 'Card',
    tag: 'm-card',
    description: 'Uma superfície para organizar conteúdo relacionado.',
    demo: CardDemo,
  },
  {
    id: 'text',
    name: 'Text',
    tag: 'm-text',
    description: 'Tipografia, hierarquia e cores do tema.',
    demo: TextDemo,
  },
  {
    id: 'icon',
    name: 'Icon',
    tag: 'm-icon',
    description: 'Símbolos nítidos que acompanham o texto e o tema.',
    demo: IconDemo,
  },
  {
    id: 'row',
    name: 'Row',
    tag: 'm-row',
    description: 'Composição horizontal com espaço entre os filhos.',
    demo: RowDemo,
  },
  {
    id: 'column',
    name: 'Column',
    tag: 'm-column',
    description: 'Conteúdo vertical com alinhamento consistente.',
    demo: ColumnDemo,
  },
  {
    id: 'box',
    name: 'Box',
    tag: 'm-box',
    description: 'Camadas e elementos sobrepostos.',
    demo: BoxDemo,
  },
  {
    id: 'screen',
    name: 'Screen',
    tag: 'm-screen',
    description: 'A superfície de uma página, com rolagem opcional.',
    demo: ScreenDemo,
  },
  {
    id: 'sheet',
    name: 'Sheet',
    tag: 'm-sheet',
    description: 'Conteúdo e ações em uma camada acima da tela.',
    demo: SheetDemo,
  },
  {
    id: 'reveal',
    name: 'Reveal',
    tag: 'm-reveal',
    description: 'Entrada e saída de conteúdo com movimento.',
    demo: RevealDemo,
  },
] as const

export function findComponent(id: string) {
  return components.find((component) => component.id === id)
}

export const componentGroups = [
  {
    name: 'Essenciais',
    en: 'Essentials',
    ids: ['button', 'input', 'switch', 'checkbox', 'slider', 'card', 'text', 'icon'],
  },
  { name: 'Composição', en: 'Composition', ids: ['row', 'column', 'box', 'screen', 'sheet'] },
  { name: 'Movimento', en: 'Motion', ids: ['reveal'] },
]
