import ChipDemo from './demos/ChipDemo.vue'
import EmptyStateDemo from './demos/EmptyStateDemo.vue'
import AccordionDemo from './demos/AccordionDemo.vue'
import SegmentedDemo from './demos/SegmentedDemo.vue'
import ProgressDemo from './demos/ProgressDemo.vue'
import AlertDemo from './demos/AlertDemo.vue'
import ListItemDemo from './demos/ListItemDemo.vue'
import SeparatorDemo from './demos/SeparatorDemo.vue'
import AvatarDemo from './demos/AvatarDemo.vue'
import BadgeDemo from './demos/BadgeDemo.vue'
import SkeletonDemo from './demos/SkeletonDemo.vue'
import TabsDemo from './demos/TabsDemo.vue'
import DialogDemo from './demos/DialogDemo.vue'
import ToastDemo from './demos/ToastDemo.vue'
import SelectDemo from './demos/SelectDemo.vue'
import RadioDemo from './demos/RadioDemo.vue'
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
    id: 'chip',
    name: 'Chip',
    tag: 'm-chip',
    description: 'Escolhas que acompanham sua curiosidade.',
    demo: ChipDemo,
  },
  {
    id: 'empty-state',
    name: 'Empty State',
    tag: 'm-empty-state',
    description: 'Todo começo merece um convite.',
    demo: EmptyStateDemo,
  },
  {
    id: 'accordion',
    name: 'Accordion',
    tag: 'm-accordion',
    description: 'Uma pergunta abre caminhos.',
    demo: AccordionDemo,
  },
  {
    id: 'segmented-control',
    name: 'Segmented Control',
    tag: 'm-segmented-control',
    description: 'Uma escolha muda o ponto de vista.',
    demo: SegmentedDemo,
  },
  {
    id: 'progress',
    name: 'Progress',
    tag: 'm-progress',
    description: 'Cada etapa fica mais clara.',
    demo: ProgressDemo,
  },
  {
    id: 'alert',
    name: 'Alert',
    tag: 'm-alert',
    description: 'A mensagem certa, no contexto.',
    demo: AlertDemo,
  },
  {
    id: 'list-item',
    name: 'ListItem',
    tag: 'm-list-item',
    description: 'Cada linha encontra seu lugar.',
    demo: ListItemDemo,
  },
  {
    id: 'separator',
    name: 'Separator',
    tag: 'm-separator',
    description: 'Uma pausa entre ideias.',
    demo: SeparatorDemo,
  },
  {
    id: 'avatar',
    name: 'Avatar',
    tag: 'm-avatar',
    description: 'Uma identidade que permanece.',
    demo: AvatarDemo,
  },
  {
    id: 'badge',
    name: 'Badge',
    tag: 'm-badge',
    description: 'Pequenos sinais, contexto imediato.',
    demo: BadgeDemo,
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    tag: 'm-skeleton',
    description: 'O conteúdo começa a tomar forma.',
    demo: SkeletonDemo,
  },
  {
    id: 'tabs',
    name: 'Tabs',
    tag: 'm-tabs',
    description: 'Um espaço, várias perspectivas.',
    demo: TabsDemo,
  },
  {
    id: 'dialog',
    name: 'Dialog',
    tag: 'm-dialog',
    description: 'Uma pausa para decidir, com clareza.',
    demo: DialogDemo,
  },
  {
    id: 'toast',
    name: 'Toast',
    tag: 'm-toast',
    description: 'No momento certo, sem interromper.',
    demo: ToastDemo,
  },
  {
    id: 'select',
    name: 'Select',
    tag: 'm-select',
    description: 'Uma lista de possibilidades. Um campo no formulário.',
    demo: SelectDemo,
  },
  {
    id: 'radio',
    name: 'Radio',
    tag: 'm-radio-group',
    description: 'Uma escolha, no seu ritmo.',
    demo: RadioDemo,
  },
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
    ids: [
      'button',
      'input',
      'switch',
      'checkbox',
      'chip',
      'radio',
      'segmented-control',
      'select',
      'slider',
      'card',
      'text',
      'icon',
      'avatar',
      'badge',
    ],
  },
  {
    name: 'Composição',
    en: 'Composition',
    ids: [
      'accordion',
      'empty-state',
      'list-item',
      'separator',
      'row',
      'column',
      'box',
      'screen',
      'sheet',
      'dialog',
      'toast',
      'tabs',
      'skeleton',
      'progress',
      'alert',
    ],
  },
  { name: 'Movimento', en: 'Motion', ids: ['reveal'] },
]
