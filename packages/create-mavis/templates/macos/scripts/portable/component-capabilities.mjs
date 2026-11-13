import { components } from './components/index.mjs'
import { spelling } from './frontends/vue-lower.mjs'

// This is a compiler contract inventory, not a validation report. Registering a renderer does
// not establish that every combination of properties, source syntax or interaction is portable.
const families = {
  344: [
    'primitives',
    'Primitives',
    'Primitivos',
    'MColumn MRow MGrid MCard MText MButton MInput MCheckbox MSelect',
  ],
  345: [
    'layout',
    'Layout',
    'Layout',
    'MScreen MStack MBox MSpan MSeparator MThemeProvider MPlatform MMasonry MResizablePanels MVirtualList MCollapsibleHeader MRefreshControl',
  ],
  346: [
    'media',
    'Images and media',
    'Imagens e mídia',
    'MIcon MImage MAvatar MGradientBackground MCarousel MImageCompare MImageViewer MImageCropper',
  ],
  347: [
    'feedback',
    'Feedback and status',
    'Feedback e estado',
    'MBadge MProgress MSkeleton MAlert MEmptyState MChip MToast MTooltip MNotificationCenter',
  ],
  348: [
    'overlays',
    'Overlays',
    'Sobreposições',
    'MSheet MDialog MPopover MMenu MCommandPalette MTour MTourTarget MSpeedDial',
  ],
  349: [
    'inputs',
    'Form inputs',
    'Campos de formulário',
    'MSwitch MRadioGroup MSegmentedControl MSlider MRangeSlider MNumberInput MMultiSelect MCombobox MTreeSelect MPinInput MRating MColorPicker MFilePicker MFormGroup MFormErrors MComposer MTransferList',
  ],
  350: [
    'dates',
    'Dates and time',
    'Data e hora',
    'MCalendar MTimePicker MDatePicker MDateRangePicker MScheduler',
  ],
  351: [
    'navigation',
    'Navigation',
    'Navegação',
    'MLink MTabs MTabBar MAppBar MNavigationRail MBreadcrumb MSteps MPagination',
  ],
  352: [
    'lists',
    'Lists and data',
    'Listas e dados',
    'MListItem MAccordion MDataTable MTreeView MTimeline MKanban MSortableList MSwipeActions MSwipeDeck',
  ],
  353: ['charts', 'Charts', 'Gráficos', 'MChart MDonutChart MSparkline MGauge MHeatmap'],
  354: [
    'motion',
    'Motion and effects',
    'Movimento e efeitos',
    'MReveal MAnimatedText MNumberFlow MMarquee MParticleField MConfetti',
  ],
}
const note = (en, pt) => ({ en, pt })
const notes = {
  MCard: [
    note(
      'Interactive cards keep child controls independent. Cards with href remain one link and reject child controls; motionSurface uses the declared motion subset.',
      'Cards interativos mantêm os controles filhos independentes. Cards com href continuam como um link único e recusam controles filhos; motionSurface usa o subconjunto de movimento declarado.',
    ),
  ],
  MScreen: [
    note(
      'One root screen. Overlay content is non-interactive; dismissKeyboard has no effect on macOS.',
      'Uma tela na raiz. O conteúdo do overlay não é interativo; dismissKeyboard não tem efeito no macOS.',
    ),
  ],
  MStack: [
    note(
      'Responsive breakpoints must be literal values in the attribute; state-backed breakpoint lists are rejected.',
      'Os breakpoints responsivos precisam ser literais no atributo; listas em estado são recusadas.',
    ),
  ],
  MBox: [
    note(
      'Layers with their own width/height are rejected. Motion surfaces and regions accept only the compiler’s declared motion subset.',
      'Camadas com width/height próprios são recusadas. Surfaces e regiões aceitam apenas o subconjunto de movimento declarado pelo compilador.',
    ),
  ],
  MSpan: [
    note(
      'Inline content inside MText; not a standalone view.',
      'Conteúdo inline dentro de MText; não é uma view independente.',
    ),
  ],
  MThemeProvider: [
    note(
      'Built-in themes or named exports of literal defineTheme modules. Runtime theme factories and runtime theme editing are rejected.',
      'Temas embutidos ou exports nomeados de módulos com defineTheme literal. Fábricas e edição de tema em runtime são recusadas.',
    ),
  ],
  MPlatform: [
    note(
      'Literal platform branches. Vue branches excluded from macOS are not compiled for the Mac; generated TSX branches remain within the shared subset.',
      'Ramos de plataforma literais. Ramos Vue excluídos do macOS não são compilados para Mac; ramos TSX gerados permanecem no subconjunto compartilhado.',
    ),
  ],
  MMasonry: [
    note(
      'Record items with string IDs. Slot receives the shared masonry item; estimatedHeight is not used for Mac measurement.',
      'Itens record com IDs string. O slot recebe o item compartilhado de masonry; estimatedHeight não é usado na medição do Mac.',
    ),
  ],
  MResizablePanels: [
    note(
      'Controlled split layout with pointer/keyboard resizing; persistence belongs to the application.',
      'Layout dividido controlado com redimensionamento por ponteiro/teclado; a persistência pertence à aplicação.',
    ),
  ],
  MVirtualList: [
    note(
      'Fixed-height record rows and a literal itemKey field; key callbacks and primitive item arrays are rejected. scrollToIndex outside the range is ignored on Mac.',
      'Linhas record com altura fixa e campo itemKey literal; callbacks de chave e arrays de valores primitivos são recusados. scrollToIndex fora do intervalo é ignorado no Mac.',
    ),
  ],
  MCollapsibleHeader: [
    note(
      'Decorative header slots; interactive controls belong in content. Jolt supplies scroll progress/fades; Mac layout computes collapse.',
      'Slots decorativos no cabeçalho; controles interativos ficam no conteúdo. Jolt fornece progresso/fades da rolagem; o layout do Mac calcula o colapso.',
    ),
  ],
  MRefreshControl: [
    note(
      'Button and Command-R instead of pull-to-refresh; threshold is accepted without a Mac gesture. Async refresh has cancellation and guarded commit; scoped controller slots/imperative handles are not exposed.',
      'Botão e Command-R em vez de puxar para atualizar; threshold é aceito sem gesto no Mac. Refresh async tem cancelamento e commit protegido; slots de controlador e handles imperativos não são expostos.',
    ),
  ],
  MImage: [
    note(
      'Shared assets and supported URLs; browser image-loading hints do not alter the Mac image loader.',
      'Assets compartilhados e URLs suportadas; dicas de carregamento do navegador não alteram o loader do Mac.',
    ),
  ],
  MCarousel: [
    note(
      'Record items with a literal key field; only the active slide is mounted. Keep persistent drafts in application state.',
      'Itens record com campo de chave literal; apenas o slide ativo é montado. Mantenha rascunhos persistentes no estado da aplicação.',
    ),
  ],
  MDataTable: [
    note(
      'Columns and rows use the compiler’s typed record contracts; arbitrary DOM cell renderers are not portable.',
      'Colunas e linhas usam os contratos de records tipados do compilador; renderizadores DOM arbitrários de células não são portáveis.',
    ),
  ],
  MSortableList: [
    note(
      'Keyed records and a literal itemKey field; computed key callbacks are rejected.',
      'Records com chave e campo itemKey literal; callbacks de chave calculada são recusados.',
    ),
  ],
  MKanban: [
    note(
      'Controlled in-board moves and Jolt drop zones. Drag auto-scroll lacks a public JoltSwiftUI hook (Jolt #502); cross-window/app dragging is outside this contract.',
      'Movimentos controlados no quadro e drop zones do Jolt. Auto-scroll durante arraste depende de API pública do JoltSwiftUI (Jolt #502); arraste entre janelas/apps fica fora deste contrato.',
    ),
  ],
  MChart: [
    note(
      'Line and bar follow the current core contract; area is not an available core chart type. Uses shared geometry rather than Swift Charts defaults.',
      'Linha e barra seguem o contrato atual do core; área não é um tipo disponível no core. Usa a geometria compartilhada, não os padrões do Swift Charts.',
    ),
  ],
  MAnimatedText: [
    note(
      'Jolt text animation requires macOS 15; macOS 14 shows static text.',
      'Animação de texto do Jolt exige macOS 15; macOS 14 mostra texto estático.',
    ),
  ],
  MNumberFlow: [
    note(
      'Jolt number animation requires macOS 15; macOS 14 shows the formatted value without animation.',
      'Animação numérica do Jolt exige macOS 15; macOS 14 mostra o valor formatado sem animação.',
    ),
  ],
  MParticleField: [
    note(
      'Finite active emitters only: duration plus lifetime must fit within 60 seconds. Continuous emission is rejected; inactive static fields are accepted.',
      'Emissores ativos finitos: duração mais vida útil devem caber em 60 segundos. Emissão contínua é recusada; campos estáticos inativos são aceitos.',
    ),
  ],
  MMarquee: [
    note(
      'Typed item records; motion pauses on hover/visibility/Reduce Motion. Speed, item width and spacing are bounded by the shared contract.',
      'Records de itens tipados; movimento pausa por hover/visibilidade/Reduce Motion. Velocidade, largura e espaçamento seguem os limites do contrato compartilhado.',
    ),
  ],
  MFilePicker: [
    note(
      'Native file selection and a typed host-service boundary for upload; browser File/Blob objects are not exposed in generated Swift.',
      'Seleção nativa de arquivos e serviços tipados do host para upload; objetos File/Blob do navegador não são expostos no Swift gerado.',
    ),
  ],
  MDatePicker: [
    note(
      'Civil-date string values and localized field text; date/time formatting uses Foundation on Mac.',
      'Valores string de data civil e texto localizado no campo; formatação de data/hora usa Foundation no Mac.',
    ),
  ],
  MDateRangePicker: [
    note(
      'Civil-date ranges; time-zone conversion does not change a date-only selection.',
      'Intervalos de datas civis; conversão de fuso não altera uma seleção que contém somente data.',
    ),
  ],
  MScheduler: [
    note(
      'Controlled event records with explicit time zone and disambiguation; invalid local times are reported rather than silently moved.',
      'Records de eventos controlados com fuso e desambiguação explícitos; horários locais inválidos são informados em vez de movidos silenciosamente.',
    ),
  ],
}
const familyOf = new Map(
  Object.entries(families).flatMap(([issue, [id, en, pt, names]]) =>
    names.split(' ').map((name) => [name, { id, label: { en, pt }, issue: Number(issue) }]),
  ),
)

export function macosComponentCapabilities(names = Object.keys(components), propsOf = () => []) {
  return {
    schemaVersion: 1,
    source: 'repository',
    maturity: 'experimental',
    validation: 'not-asserted',
    minimumOS: 14,
    authoring: ['vue-sfc', 'mitosis-tsx'],
    renderer: 'swiftui',
    sharedLimits: [
      note(
        'Partial means a declared compile-time subset, not full API parity. A registered component and accepted property names do not prove every expression, slot or interaction is supported.',
        'Parcial significa um subconjunto declarado em compilação, não paridade integral da API. Registro e nomes de propriedades aceitos não comprovam suporte a toda expressão, slot ou interação.',
      ),
      note(
        'Shared Vue/TSX and TypeScript must pass the portability compiler. Unsupported expressions report file:line:column; raw HTML, DOM APIs and native view objects are not translated.',
        'Vue/TSX e TypeScript compartilhados precisam passar pelo compilador de portabilidade. Expressões não suportadas informam arquivo:linha:coluna; HTML puro, APIs do DOM e objetos de views nativas não são traduzidos.',
      ),
      note(
        'This inventory is derived from source, not from release availability or a successful runtime test. Check the project with create-mavis --check-portability before adopting it.',
        'Este inventário deriva do fonte, não da disponibilidade de uma release nem de um teste de runtime aprovado. Confira o projeto com create-mavis --check-portability antes da adoção.',
      ),
    ],
    components: Object.fromEntries(
      [...new Set(names)].sort().map((name) => {
        const definition = components[name],
          family = familyOf.get(name)
        if (definition && !family) throw new Error(`Assign a Mac capability family to ${name}.`)
        const written = definition ? spelling(name) : undefined
        const denied = definition?.macos?.rejectedProps ?? []
        const props = written
          ? [
              ...new Set([
                ...written.attributes.keys(),
                ...Object.values(written.source.flags ?? {}),
                ...(definition.children === 'text' ? ['text'] : []),
              ]),
            ]
              .filter((prop) => !denied.includes(prop))
              .sort()
          : []
        return [
          name,
          {
            status: definition ? 'partial' : 'unsupported',
            registered: Boolean(definition),
            issue: family?.issue ?? 338,
            family: family?.id ?? 'unregistered',
            familyLabel: family?.label ?? note('Unregistered', 'Sem registro'),
            props,
            events: written ? [...written.events.keys()].sort() : [],
            tsxProps: definition
              ? Object.keys(definition.props)
                  .filter((prop) => !denied.includes(prop))
                  .sort()
              : [],
            ignoredProps: definition?.macos?.ignoredProps ?? [],
            rejectedProps: [
              ...new Set([...denied, ...propsOf(name).filter((prop) => !props.includes(prop))]),
            ].sort(),
            slots: definition
              ? [
                  ...new Set([
                    ...(definition.children || written.source.slot ? ['default'] : []),
                    ...(definition.slots ?? []),
                  ]),
                ].sort()
              : [],
            limits: definition
              ? (notes[name] ?? [])
              : [
                  note(
                    'No Mac compiler renderer is registered.',
                    'Não há renderer registrado no compilador Mac.',
                  ),
                ],
          },
        ]
      }),
    ),
  }
}
