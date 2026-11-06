import { defineAsyncComponent } from 'vue'
const KanbanDemo = defineAsyncComponent(() => import('./demos/KanbanDemo.vue'))
const DonutChartDemo = defineAsyncComponent(() => import('./demos/DonutChartDemo.vue'))
const SparklineDemo = defineAsyncComponent(() => import('./demos/SparklineDemo.vue'))
const GradientBackgroundDemo = defineAsyncComponent(
  () => import('./demos/GradientBackgroundDemo.vue'),
)
const ParticleFieldDemo = defineAsyncComponent(() => import('./demos/ParticleFieldDemo.vue'))
const ConfettiDemo = defineAsyncComponent(() => import('./demos/ConfettiDemo.vue'))
const ColorPickerDemo = defineAsyncComponent(() => import('./demos/ColorPickerDemo.vue'))
const SwipeDeckDemo = defineAsyncComponent(() => import('./demos/SwipeDeckDemo.vue'))
const GaugeDemo = defineAsyncComponent(() => import('./demos/GaugeDemo.vue'))
const TourDemo = defineAsyncComponent(() => import('./demos/TourDemo.vue'))
const TransferListDemo = defineAsyncComponent(() => import('./demos/TransferListDemo.vue'))
const MarqueeDemo = defineAsyncComponent(() => import('./demos/MarqueeDemo.vue'))
const CollapsibleHeaderDemo = defineAsyncComponent(
  () => import('./demos/CollapsibleHeaderDemo.vue'),
)
const RefreshControlDemo = defineAsyncComponent(() => import('./demos/RefreshControlDemo.vue'))
const ComposerDemo = defineAsyncComponent(() => import('./demos/ComposerDemo.vue'))
const SpeedDialDemo = defineAsyncComponent(() => import('./demos/SpeedDialDemo.vue'))
const PinInputDemo = defineAsyncComponent(() => import('./demos/PinInputDemo.vue'))
const AnimatedTextDemo = defineAsyncComponent(() => import('./demos/AnimatedTextDemo.vue'))
const ImageViewerDemo = defineAsyncComponent(() => import('./demos/ImageViewerDemo.vue'))
const SortableListDemo = defineAsyncComponent(() => import('./demos/SortableListDemo.vue'))
const SwipeActionsDemo = defineAsyncComponent(() => import('./demos/SwipeActionsDemo.vue'))
const NumberFlowDemo = defineAsyncComponent(() => import('./demos/NumberFlowDemo.vue'))
const ResizablePanelsDemo = defineAsyncComponent(() => import('./demos/ResizablePanelsDemo.vue'))
const ImageCompareDemo = defineAsyncComponent(() => import('./demos/ImageCompareDemo.vue'))
const CommandPaletteDemo = defineAsyncComponent(() => import('./demos/CommandPaletteDemo.vue'))
const NavigationRailDemo = defineAsyncComponent(() => import('./demos/NavigationRailDemo.vue'))
const BreadcrumbDemo = defineAsyncComponent(() => import('./demos/BreadcrumbDemo.vue'))
const TooltipDemo = defineAsyncComponent(() => import('./demos/TooltipDemo.vue'))
const TimelineDemo = defineAsyncComponent(() => import('./demos/TimelineDemo.vue'))
const ChartDemo = defineAsyncComponent(() => import('./demos/ChartDemo.vue'))
const DataTableDemo = defineAsyncComponent(() => import('./demos/DataTableDemo.vue'))
const CarouselDemo = defineAsyncComponent(() => import('./demos/CarouselDemo.vue'))
const RangeSliderDemo = defineAsyncComponent(() => import('./demos/RangeSliderDemo.vue'))
const CalendarDemo = defineAsyncComponent(() => import('./demos/CalendarDemo.vue'))
const RatingDemo = defineAsyncComponent(() => import('./demos/RatingDemo.vue'))
const TreeViewDemo = defineAsyncComponent(() => import('./demos/TreeViewDemo.vue'))
const PopoverDemo = defineAsyncComponent(() => import('./demos/PopoverDemo.vue'))
const MenuDemo = defineAsyncComponent(() => import('./demos/MenuDemo.vue'))
const AppBarDemo = defineAsyncComponent(() => import('./demos/AppBarDemo.vue'))
const TabBarDemo = defineAsyncComponent(() => import('./demos/TabBarDemo.vue'))
const TimePickerDemo = defineAsyncComponent(() => import('./demos/TimePickerDemo.vue'))
const VirtualListDemo = defineAsyncComponent(() => import('./demos/VirtualListDemo.vue'))
const GridDemo = defineAsyncComponent(() => import('./demos/GridDemo.vue'))
const ImageDemo = defineAsyncComponent(() => import('./demos/ImageDemo.vue'))
const MultiSelectDemo = defineAsyncComponent(() => import('./demos/MultiSelectDemo.vue'))
const NumberInputDemo = defineAsyncComponent(() => import('./demos/NumberInputDemo.vue'))
const StackDemo = defineAsyncComponent(() => import('./demos/StackDemo.vue'))
const LinkDemo = defineAsyncComponent(() => import('./demos/LinkDemo.vue'))
const PaginationDemo = defineAsyncComponent(() => import('./demos/PaginationDemo.vue'))
const StepsDemo = defineAsyncComponent(() => import('./demos/StepsDemo.vue'))
const FormDemo = defineAsyncComponent(() => import('./demos/FormDemo.vue'))
const FilePickerDemo = defineAsyncComponent(() => import('./demos/FilePickerDemo.vue'))
const ComboboxDemo = defineAsyncComponent(() => import('./demos/ComboboxDemo.vue'))
const DateRangePickerDemo = defineAsyncComponent(() => import('./demos/DateRangePickerDemo.vue'))
const DatePickerDemo = defineAsyncComponent(() => import('./demos/DatePickerDemo.vue'))
const ChipDemo = defineAsyncComponent(() => import('./demos/ChipDemo.vue'))
const EmptyStateDemo = defineAsyncComponent(() => import('./demos/EmptyStateDemo.vue'))
const AccordionDemo = defineAsyncComponent(() => import('./demos/AccordionDemo.vue'))
const SegmentedDemo = defineAsyncComponent(() => import('./demos/SegmentedDemo.vue'))
const ProgressDemo = defineAsyncComponent(() => import('./demos/ProgressDemo.vue'))
const AlertDemo = defineAsyncComponent(() => import('./demos/AlertDemo.vue'))
const ListItemDemo = defineAsyncComponent(() => import('./demos/ListItemDemo.vue'))
const SeparatorDemo = defineAsyncComponent(() => import('./demos/SeparatorDemo.vue'))
const AvatarDemo = defineAsyncComponent(() => import('./demos/AvatarDemo.vue'))
const BadgeDemo = defineAsyncComponent(() => import('./demos/BadgeDemo.vue'))
const SkeletonDemo = defineAsyncComponent(() => import('./demos/SkeletonDemo.vue'))
const TabsDemo = defineAsyncComponent(() => import('./demos/TabsDemo.vue'))
const DialogDemo = defineAsyncComponent(() => import('./demos/DialogDemo.vue'))
const ToastDemo = defineAsyncComponent(() => import('./demos/ToastDemo.vue'))
const SelectDemo = defineAsyncComponent(() => import('./demos/SelectDemo.vue'))
const RadioDemo = defineAsyncComponent(() => import('./demos/RadioDemo.vue'))
const ButtonDemo = defineAsyncComponent(() => import('./demos/ButtonDemo.vue'))
const InputDemo = defineAsyncComponent(() => import('./demos/InputDemo.vue'))
const CheckboxDemo = defineAsyncComponent(() => import('./demos/CheckboxDemo.vue'))
const SwitchDemo = defineAsyncComponent(() => import('./demos/SwitchDemo.vue'))
const SliderDemo = defineAsyncComponent(() => import('./demos/SliderDemo.vue'))
const CardDemo = defineAsyncComponent(() => import('./demos/CardDemo.vue'))
const TextDemo = defineAsyncComponent(() => import('./demos/TextDemo.vue'))
const IconDemo = defineAsyncComponent(() => import('./demos/IconDemo.vue'))
const RowDemo = defineAsyncComponent(() => import('./demos/RowDemo.vue'))
const ColumnDemo = defineAsyncComponent(() => import('./demos/ColumnDemo.vue'))
const BoxDemo = defineAsyncComponent(() => import('./demos/BoxDemo.vue'))
const ScreenDemo = defineAsyncComponent(() => import('./demos/ScreenDemo.vue'))
const RevealDemo = defineAsyncComponent(() => import('./demos/RevealDemo.vue'))
const SheetDemo = defineAsyncComponent(() => import('./demos/SheetDemo.vue'))

export const components = [
  {
    id: 'kanban',
    name: 'Kanban',
    tag: 'm-kanban',
    description: 'Ideias que avançam.',
    demo: KanbanDemo,
  },
  {
    id: 'donut-chart',
    name: 'DonutChart',
    tag: 'm-donut-chart',
    description: 'O todo em perspectiva.',
    demo: DonutChartDemo,
  },
  {
    id: 'sparkline',
    name: 'Sparkline',
    tag: 'm-sparkline',
    description: 'Uma tendência, num olhar.',
    demo: SparklineDemo,
  },
  {
    id: 'gradient-background',
    name: 'GradientBackground',
    tag: 'm-gradient-background',
    description: 'Encontre a atmosfera.',
    demo: GradientBackgroundDemo,
  },
  {
    id: 'particle-field',
    name: 'ParticleField',
    tag: 'm-particle-field',
    description: 'Um pouco de encanto.',
    demo: ParticleFieldDemo,
  },
  {
    id: 'confetti',
    name: 'Confetti',
    tag: 'm-confetti',
    description: 'Celebre o momento.',
    demo: ConfettiDemo,
  },

  {
    id: 'color-picker',
    name: 'ColorPicker',
    tag: 'm-color-picker',
    description: 'Encontre sua assinatura.',
    demo: ColorPickerDemo,
  },
  {
    id: 'swipe-deck',
    name: 'SwipeDeck',
    tag: 'm-swipe-deck',
    description: 'Para onde agora?',
    demo: SwipeDeckDemo,
  },
  {
    id: 'gauge',
    name: 'Gauge',
    tag: 'm-gauge',
    description: 'Dê forma ao progresso.',
    demo: GaugeDemo,
  },
  {
    id: 'tour',
    name: 'Tour',
    tag: 'm-tour',
    description: 'Boas-vindas, de perto.',
    demo: TourDemo,
  },
  {
    id: 'transfer-list',
    name: 'TransferList',
    tag: 'm-transfer-list',
    description: 'Leve o que importa.',
    demo: TransferListDemo,
  },
  {
    id: 'marquee',
    name: 'Marquee',
    tag: 'm-marquee',
    description: 'Ideias em movimento.',
    demo: MarqueeDemo,
  },

  {
    id: 'collapsible-header',
    name: 'CollapsibleHeader',
    tag: 'm-collapsible-header',
    description: 'A vista cresce. O cabeçalho acompanha.',
    demo: CollapsibleHeaderDemo,
  },
  {
    id: 'refresh-control',
    name: 'RefreshControl',
    tag: 'm-refresh-control',
    description: 'Uma nova perspectiva.',
    demo: RefreshControlDemo,
  },
  {
    id: 'composer',
    name: 'Composer',
    tag: 'm-composer',
    description: 'Boas ideias começam aqui.',
    demo: ComposerDemo,
  },
  {
    id: 'speed-dial',
    name: 'SpeedDial',
    tag: 'm-speed-dial',
    description: 'Dê espaço a novas ações.',
    demo: SpeedDialDemo,
  },
  {
    id: 'pin-input',
    name: 'PinInput',
    tag: 'm-pin-input',
    description: 'Só mais um passo.',
    demo: PinInputDemo,
  },
  {
    id: 'animated-text',
    name: 'AnimatedText',
    tag: 'm-animated-text',
    description: 'Palavras em movimento.',
    demo: AnimatedTextDemo,
  },

  {
    id: 'image-viewer',
    name: 'ImageViewer',
    tag: 'm-image-viewer',
    description: 'Abra um mundo maior.',
    demo: ImageViewerDemo,
  },
  {
    id: 'sortable-list',
    name: 'SortableList',
    tag: 'm-sortable-list',
    description: 'Encontre sua ordem.',
    demo: SortableListDemo,
  },
  {
    id: 'swipe-actions',
    name: 'SwipeActions',
    tag: 'm-swipe-actions',
    description: 'Abra espaço com um gesto.',
    demo: SwipeActionsDemo,
  },
  {
    id: 'number-flow',
    name: 'NumberFlow',
    tag: 'm-number-flow',
    description: 'Números em movimento.',
    demo: NumberFlowDemo,
  },
  {
    id: 'resizable-panels',
    name: 'ResizablePanels',
    tag: 'm-resizable-panels',
    description: 'Espaço do seu jeito.',
    demo: ResizablePanelsDemo,
  },
  {
    id: 'image-compare',
    name: 'ImageCompare',
    tag: 'm-image-compare',
    description: 'Duas perspectivas, um quadro.',
    demo: ImageCompareDemo,
  },

  {
    id: 'command-palette',
    name: 'CommandPalette',
    tag: 'm-command-palette',
    description: 'Seu próximo passo, à mão.',
    demo: CommandPaletteDemo,
  },
  {
    id: 'navigation-rail',
    name: 'NavigationRail',
    tag: 'm-navigation-rail',
    description: 'Um lugar para cada destino.',
    demo: NavigationRailDemo,
  },
  {
    id: 'breadcrumb',
    name: 'Breadcrumb',
    tag: 'm-breadcrumb',
    description: 'O caminho conta uma história.',
    demo: BreadcrumbDemo,
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    tag: 'm-tooltip',
    description: 'Um pouco de contexto.',
    demo: TooltipDemo,
  },
  {
    id: 'timeline',
    name: 'Timeline',
    tag: 'm-timeline',
    description: 'Cada momento faz parte.',
    demo: TimelineDemo,
  },
  {
    id: 'chart',
    name: 'Chart',
    tag: 'm-chart',
    description: 'Os números ganham perspectiva.',
    demo: ChartDemo,
  },

  {
    id: 'data-table',
    name: 'DataTable',
    tag: 'm-data-table',
    description: 'Dados com clareza.',
    demo: DataTableDemo,
  },
  {
    id: 'carousel',
    name: 'Carousel',
    tag: 'm-carousel',
    description: 'Uma descoberta de cada vez.',
    demo: CarouselDemo,
  },
  {
    id: 'range-slider',
    name: 'RangeSlider',
    tag: 'm-range-slider',
    description: 'Encontre seu intervalo.',
    demo: RangeSliderDemo,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    tag: 'm-calendar',
    description: 'Reserve tempo para algo bom.',
    demo: CalendarDemo,
  },
  {
    id: 'rating',
    name: 'Rating',
    tag: 'm-rating',
    description: 'Uma experiência que merece estrelas.',
    demo: RatingDemo,
  },
  {
    id: 'tree-view',
    name: 'TreeView',
    tag: 'm-tree-view',
    description: 'Espaço para suas ideias crescerem.',
    demo: TreeViewDemo,
  },

  {
    id: 'popover',
    name: 'Popover',
    tag: 'm-popover',
    description: 'Detalhes no lugar certo.',
    demo: PopoverDemo,
  },
  {
    id: 'menu',
    name: 'Menu',
    tag: 'm-menu',
    description: 'A próxima ação, à mão.',
    demo: MenuDemo,
  },
  {
    id: 'app-bar',
    name: 'AppBar',
    tag: 'm-app-bar',
    description: 'Um começo claro para cada tela.',
    demo: AppBarDemo,
  },
  {
    id: 'tab-bar',
    name: 'TabBar',
    tag: 'm-tab-bar',
    description: 'Seus destinos, sempre por perto.',
    demo: TabBarDemo,
  },
  {
    id: 'time-picker',
    name: 'TimePicker',
    tag: 'm-time-picker',
    description: 'Cada encontro no seu horário.',
    demo: TimePickerDemo,
  },
  {
    id: 'virtual-list',
    name: 'VirtualList',
    tag: 'm-virtual-list',
    description: 'Mil ideias, espaço para todas.',
    demo: VirtualListDemo,
  },

  {
    id: 'grid',
    name: 'Grid',
    tag: 'm-grid',
    description: 'Colunas que encontram seu espaço.',
    demo: GridDemo,
  },
  {
    id: 'number-input',
    name: 'NumberInput',
    tag: 'm-number-input',
    description: 'Números, com espaço para editar.',
    demo: NumberInputDemo,
  },
  {
    id: 'multi-select',
    name: 'MultiSelect',
    tag: 'm-multi-select',
    description: 'Várias escolhas. Um só lugar.',
    demo: MultiSelectDemo,
  },
  {
    id: 'image',
    name: 'Image',
    tag: 'm-image',
    description: 'Uma imagem, bem apresentada.',
    demo: ImageDemo,
  },

  {
    id: 'stack',
    name: 'Stack',
    tag: 'm-stack',
    description: 'Um layout que acompanha seu espaço.',
    demo: StackDemo,
  },
  {
    id: 'link',
    name: 'Link',
    tag: 'm-link',
    description: 'O próximo passo, com direção.',
    demo: LinkDemo,
  },
  {
    id: 'date-picker',
    name: 'DatePicker',
    tag: 'm-date-picker',
    description: 'Um dia escolhido com cuidado.',
    demo: DatePickerDemo,
  },
  {
    id: 'date-range-picker',
    name: 'DateRangePicker',
    tag: 'm-date-range-picker',
    description: 'Do primeiro ao último dia.',
    demo: DateRangePickerDemo,
  },
  {
    id: 'combobox',
    name: 'Combobox',
    tag: 'm-combobox',
    description: 'Encontre a escolha certa.',
    demo: ComboboxDemo,
  },
  {
    id: 'file-picker',
    name: 'FilePicker',
    tag: 'm-file-picker',
    description: 'Documentos prontos para seguir.',
    demo: FilePickerDemo,
  },
  {
    id: 'form-group',
    name: 'FormGroup',
    tag: 'm-form-group',
    description: 'Campos que fazem sentido juntos.',
    demo: FormDemo,
  },
  {
    id: 'form-errors',
    name: 'FormErrors',
    tag: 'm-form-errors',
    description: 'Cada detalhe no seu lugar.',
    demo: FormDemo,
  },
  {
    id: 'steps',
    name: 'Steps',
    tag: 'm-steps',
    description: 'Um encontro, passo a passo.',
    demo: StepsDemo,
  },
  {
    id: 'pagination',
    name: 'Pagination',
    tag: 'm-pagination',
    description: 'Mais destinos para descobrir.',
    demo: PaginationDemo,
  },

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
    name: 'Interações',
    en: 'Interactions',
    ids: [
      'kanban',
      'donut-chart',
      'sparkline',
      'gradient-background',
      'particle-field',
      'confetti',
      'color-picker',
      'swipe-deck',
      'gauge',
      'tour',
      'transfer-list',
      'marquee',
      'collapsible-header',
      'refresh-control',
      'composer',
      'speed-dial',
      'pin-input',
      'animated-text',
      'image-viewer',
      'sortable-list',
      'swipe-actions',
      'number-flow',
      'resizable-panels',
      'image-compare',
    ],
  },
  {
    name: 'Essenciais',
    en: 'Essentials',
    ids: [
      'button',
      'link',
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
      'image',
      'avatar',
      'badge',
    ],
  },
  {
    name: 'Formulários e jornadas',
    en: 'Forms and journeys',
    ids: [
      'number-input',
      'multi-select',
      'date-picker',
      'date-range-picker',
      'combobox',
      'file-picker',
      'form-group',
      'form-errors',
      'steps',
      'pagination',
      'time-picker',
      'popover',
      'menu',
      'app-bar',
      'tab-bar',
      'virtual-list',
      'data-table',
      'carousel',
      'range-slider',
      'calendar',
      'rating',
      'tree-view',
      'command-palette',
      'navigation-rail',
      'breadcrumb',
      'tooltip',
      'timeline',
      'chart',
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
      'stack',
      'grid',
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
