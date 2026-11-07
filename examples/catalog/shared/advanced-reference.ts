import type { ComponentReference } from './reference'
export const advancedReferences: Record<string, ComponentReference> = {
  'tree-select': {
    usage:
      '<MTreeSelect v-model="selected" v-model:expanded="expanded" :nodes="nodes" multiple label="Disciplines" />',
    properties: [
      {
        name: 'nodes',
        type: 'readonly TreeSelectNode[]',
        defaultValue: 'required',
        description:
          'ID único, label, children/disabled/selectable opcionais; até 2000 nós e 32 níveis.',
      },
      {
        name: 'modelValue / expanded',
        type: 'readonly string[]',
        defaultValue: '[] / []',
        description:
          'IDs selecionados e expandidos, ambos controlados. Seleção simples aceita no máximo um ID.',
      },
      {
        name: 'multiple / disabled / animated',
        type: 'boolean',
        defaultValue: 'false / false / true',
        description: 'Seleção múltipla, bloqueio de edição e layout Jolt.',
      },
      {
        name: 'label / id',
        type: 'string',
        defaultValue: 'required / optional',
        description: 'Nome acessível do componente e ID estável opcional.',
      },
    ],
    behavior:
      'A busca revela descendentes correspondentes e seus ancestrais sem alterar a expansão controlada. Pais desabilitados desabilitam seus descendentes. A seleção é explícita por nó, sem cascata nem estados parciais implícitos. IDs selecionados desconhecidos são preservados. Limpar remove apenas IDs habilitados e selecionáveis. Botões e checkboxes usam Tab, Enter e Espaço; Escape fecha o popover e devolve o foco ao acionador. Os rótulos dos controles são traduzíveis. Não inclui virtualização nem carregamento assíncrono da árvore. `update:modelValue` → `string[]`; `update:expanded` → `string[]`.',
  },
  masonry: {
    usage:
      '<MMasonry :items="items" label="Inspiration" :columns="3"><template #item="{ item }"><MCard><MText :text="item.id" /></MCard></template></MMasonry>',
    properties: [
      {
        name: 'items',
        type: 'readonly MasonryItem[]',
        defaultValue: 'required',
        description:
          'ID único e estável e estimatedHeight opcional. Até 500 itens; metadados da aplicação são preservados.',
      },
      {
        name: 'columns / minColumnWidth',
        type: 'number',
        defaultValue: '4 / 220',
        description:
          'Máximo de 1–12 colunas e largura mínima >=40 pixels/DIP. Usa a largura disponível do contêiner.',
      },
      {
        name: 'gap / animated',
        type: 'Spacing / boolean',
        defaultValue: 'md / true',
        description: 'Espaçamento por token ou número e mudanças de layout com Jolt.',
      },
      {
        name: 'label / id',
        type: 'string',
        defaultValue: 'required / optional',
        description: 'Nome acessível do componente e ID estável opcional.',
      },
    ],
    behavior:
      'O slot item recebe { item, index, width }. Cada item é medido e colocado na coluna mais curta, preservando a ordem lógica do DOM/nativo e a identidade estável. Leitura e teclado seguem a coleção original. Medidas tardias de imagens/fontes atualizam o layout. O SSR começa com uma coluna estimada, ajustada após a medição. Defina altura ou proporção das imagens para reduzir o movimento inicial. É uma coleção limitada e não virtualizada; use MVirtualList para listas longas. Mudanças de altura, filtros, reordenação e redimensionamento usam Jolt quando animated=true. Os observadores param ao desativar/desmontar. `item` slot → `{ item, index, width }`.',
  },
  heatmap: {
    usage:
      '<MHeatmap v-model="selected" :start="start" :end="end" :values="values" label="Practice" />',
    properties: [
      {
        name: 'start / end',
        type: 'CivilDate',
        defaultValue: 'required',
        description: 'Datas civis ISO inclusivas; intervalo de 1–366 dias. Sem conversão de fuso.',
      },
      {
        name: 'values',
        type: 'readonly HeatmapValue[]',
        defaultValue: 'required',
        description:
          'Data única, valor finito não negativo ou null; label e disabled opcionais. Ausente difere de zero.',
      },
      {
        name: 'modelValue',
        type: 'CivilDate | null',
        defaultValue: 'null',
        description: 'Dia selecionado controlado.',
      },
      {
        name: 'colors / cellSize / weekStartsOn',
        type: 'string[] / number / 0|1',
        defaultValue: '5 colors / 40 / 1',
        description:
          '2–8 cores HEX de seis dígitos, células de 28–80px/DIP, domingo ou segunda primeiro.',
      },
      {
        name: 'animated / disabled / formatValue',
        type: 'boolean / boolean / function',
        defaultValue: 'true / false / String',
        description: 'Interpolação de cor Jolt, bloqueio de seleção e formatação do valor.',
      },
      {
        name: 'label / id',
        type: 'string',
        defaultValue: 'required / optional',
        description: 'Nome acessível do componente e ID estável opcional.',
      },
    ],
    behavior:
      'As datas formam colunas semanais. Cada dia é um controle nomeado com seu valor exato; Ver dados expõe uma alternativa textual linear. As setas navegam por dia/semana, Home/End ao primeiro/último dia. A paleta inclui zero na primeira cor; valores ausentes ou null ficam sem preenchimento. Jolt interpola a cor enquanto os valores acessíveis são atualizados imediatamente. Movimento reduzido assenta imediatamente. Períodos longos rolam horizontalmente dentro do componente. `update:modelValue` → `CivilDate`.',
  },
  'image-cropper': {
    usage:
      '<MImageCropper v-model="crop" :src="image" label="Cover" :aspectRatio="1" @export="saveExport" />',
    properties: [
      {
        name: 'src / modelValue',
        type: 'string / ImageCrop | null',
        defaultValue: 'required / null',
        description:
          'Imagem decodificada e recorte controlado {x,y,width,height,rotation}; coordenadas em pixels após rotação de um quarto de volta.',
      },
      {
        name: 'aspectRatio / output',
        type: 'number / CropExportOptions',
        defaultValue: '1 / PNG, quality .92',
        description:
          'Proporção 0.1–10; mimeType PNG/JPEG, quality 0–1 e width opcional. Dimensões de saída entre 1–4096px.',
      },
      {
        name: 'animated / disabled',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Acomodação Jolt e bloqueio de edição/exportação.',
      },
      {
        name: 'label / id',
        type: 'string',
        defaultValue: 'required / optional',
        description: 'Nome acessível do componente e ID estável opcional.',
      },
    ],
    behavior:
      'Arraste para deslocar, faça pinça para ampliar ou use os botões direcionais, o slider de zoom e a rotação de 90°. Escape/cancelamento do ponteiro restaura o recorte não confirmado na Web. O modelo é canônico; a aplicação precisa aceitar as atualizações emitidas. Um modelo null encaixa a imagem na proporção solicitada. Limpe modelValue ao trocar para uma imagem/proporção incompatível. A Web exporta data URI PNG/JPEG via Canvas; imagens remotas precisam permitir CORS. iOS/Android desenham nativamente e exportam um arquivo temporário. O objeto exportado inclui uri, width, height, mimeType e dispose() assíncrono; o consumidor é dono do resultado e deve chamar dispose() após usar o arquivo temporário nativo. Limite de 40 megapixels decodificados. Recorte raster, sem filtros, ângulos arbitrários ou edição SVG. Falhas emitem error; carregamentos e exportações obsoletos são liberados ao trocar a origem/desativar. Botões explícitos oferecem alternativas aos gestos nativos. `update:modelValue` → `ImageCrop`; `export` → `CropExport`; `load` → `{width,height}`; `error` → `{stage,message}`. Exposed `export()` returns `Promise<CropExport | undefined>`.',
  },
  scheduler: {
    usage:
      '<MScheduler v-model="events" v-model:date="date" timeZone="America/Sao_Paulo" label="Studio" :days="7" />',
    properties: [
      {
        name: 'modelValue / date / timeZone',
        type: 'SchedulerEvent[] / CivilDate / string',
        defaultValue: 'required',
        description:
          'ID/title estáveis e start/end em milissegundos de época; fuso IANA explícito. Até 500 eventos, duração máxima de 31 dias.',
      },
      {
        name: 'days / startHour / endHour',
        type: '1|7 / number / number',
        defaultValue: '7 / 8 / 19',
        description: 'Vista diária/semanal e limites inteiros ordenados de 0–24 horas.',
      },
      {
        name: 'slotMinutes / hourHeight / dayWidth',
        type: 'number',
        defaultValue: '15 / 80 / 180',
        description: 'Divisor de uma hora de 5–60 minutos; altura 48–180 e largura 140–500px/DIP.',
      },
      {
        name: 'disambiguation',
        type: 'reject | earlier | later',
        defaultValue: 'reject',
        description:
          'Horários locais repetidos exigem escolha explícita; horários inexistentes são rejeitados.',
      },
      {
        name: 'animated / disabled',
        type: 'boolean',
        defaultValue: 'true / false',
        description:
          'Layout Jolt e bloqueio de edição. Eventos podem ser bloqueados individualmente.',
      },
      {
        name: 'label / id',
        type: 'string',
        defaultValue: 'required / optional',
        description: 'Nome acessível do componente e ID estável opcional.',
      },
    ],
    behavior:
      'Eventos sobrepostos ocupam faixas separadas; eventos de vários dias são divididos em segmentos diários. Uma lista textual expõe todos os eventos, inclusive curtos/recortados, com deslocamentos de fuso para distinguir horários repetidos. Selecione um evento para mover por intervalo/dia ou redimensionar com botões explícitos. Segmentos grandes de um único dia oferecem alças de movimento/redimensionamento; segmentos curtos usam os mesmos controles explícitos. O arraste fica limitado aos dias/horários visíveis e segue slotMinutes. Alterações externas de modelo/data/fuso cancelam rascunhos. Mover preserva a duração transcorrida; redimensionar resolve o horário local no fuso escolhido. Usa Intl na Web e formatadores nativos em iOS/Android. Movimento reduzido desliga a acomodação decorativa. Não inclui recorrência, recursos, persistência remota, sincronização de calendários ou resolução automática de conflitos. `update:modelValue` → `SchedulerEvent[]`; `update:date` → `CivilDate`; `change` → `{id,start,end,kind}`; `select` → event ID; `error` → message.',
  },
  'notification-center': {
    usage:
      '<MNotificationCenter v-model="notifications" v-model:filter="filter" label="Inbox" @action="openNotification" />',
    properties: [
      {
        name: 'modelValue',
        type: 'readonly MavisNotification[]',
        defaultValue: 'required',
        description:
          'ID/title únicos, description/group/time/read/disabled/dismissible/actionLabel opcionais. Até 1000.',
      },
      {
        name: 'filter',
        type: 'all | unread',
        defaultValue: 'all',
        description: 'Filtro controlado; notificações ocultas permanecem no modelo.',
      },
      {
        name: 'animated / disabled',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Layout Jolt da coleção e bloqueio de edição.',
      },
      {
        name: 'label / id',
        type: 'string',
        defaultValue: 'required / optional',
        description: 'Nome acessível do componente e ID estável opcional.',
      },
    ],
    behavior:
      'Mensagens agrupadas, contagem de não lidas, leitura, marcar todas como lidas, dispensa e ação da aplicação compartilham um modelo controlado. Metadados desconhecidos são preservados. Entradas desabilitadas ficam intactas; dismissible=false impede remoção. Quando uma ação remove a mensagem em foco, o foco volta ao filtro. Títulos, descrições e horários opcionais são texto, nunca HTML. Rótulos da barra e ações são traduzíveis. A aplicação cuida do transporte, autorização, persistência e ações; o componente não solicita permissões de push do sistema, não assina serviços nem busca notificações. `update:modelValue` → `MavisNotification[]`; `update:filter` → `all | unread`; `action` → notification ID.',
  },
}
export const advancedEnglishReferences: Record<string, ComponentReference> = {
  'tree-select': {
    usage:
      '<MTreeSelect v-model="selected" v-model:expanded="expanded" :nodes="nodes" multiple label="Disciplines" />',
    properties: [
      {
        name: 'nodes',
        type: 'readonly TreeSelectNode[]',
        defaultValue: 'required',
        description:
          'Unique id, label, optional children/disabled/selectable; up to 2000 nodes and 32 levels.',
      },
      {
        name: 'modelValue / expanded',
        type: 'readonly string[]',
        defaultValue: '[] / []',
        description:
          'Selected IDs and expanded IDs, both controlled. Single mode accepts at most one ID.',
      },
      {
        name: 'multiple / disabled / animated',
        type: 'boolean',
        defaultValue: 'false / false / true',
        description: 'Multiple choice, editing lock and Jolt layout.',
      },
      {
        name: 'label / id',
        type: 'string',
        defaultValue: 'required / optional',
        description: 'Accessible component name and optional stable ID.',
      },
    ],
    behavior:
      'Search reveals matching descendants with their ancestors, without changing the controlled expansion. Disabled parents disable their descendants. Selection is explicit per node, without cascading or implicit partial states. Unknown selected IDs are retained. Clearing removes only selectable, enabled IDs. Standard buttons and checkboxes support Tab, Enter and Space; Escape closes the popover and restores its trigger. All control labels are localizable. No virtualization or asynchronous tree loading is included. `update:modelValue` → `string[]`; `update:expanded` → `string[]`.',
  },
  masonry: {
    usage:
      '<MMasonry :items="items" label="Inspiration" :columns="3"><template #item="{ item }"><MCard><MText :text="item.id" /></MCard></template></MMasonry>',
    properties: [
      {
        name: 'items',
        type: 'readonly MasonryItem[]',
        defaultValue: 'required',
        description:
          'Unique stable id and optional estimatedHeight. Up to 500 items; app metadata is preserved.',
      },
      {
        name: 'columns / minColumnWidth',
        type: 'number',
        defaultValue: '4 / 220',
        description:
          'Maximum 1–12 columns and minimum width >=40 pixels/DIP. Uses available container width.',
      },
      {
        name: 'gap / animated',
        type: 'Spacing / boolean',
        defaultValue: 'md / true',
        description: 'Token or numeric spacing and Jolt layout changes.',
      },
      {
        name: 'label / id',
        type: 'string',
        defaultValue: 'required / optional',
        description: 'Accessible component name and optional stable ID.',
      },
    ],
    behavior:
      'The item slot receives { item, index, width }. Each item is measured and placed in the shortest column while preserving logical DOM/native order and stable identity. Reading and keyboard order follow the original collection. Late image/font measurements update the layout. Initial SSR uses one estimated column and is enhanced after measurement. Give images a height or aspect ratio to reduce initial movement. This is a bounded, non-virtualized collection; use MVirtualList for long feeds. Height changes, filtering, reordering and container resizing use Jolt when animated=true. Observers stop on deactivation/unmount. `item` slot → `{ item, index, width }`.',
  },
  heatmap: {
    usage:
      '<MHeatmap v-model="selected" :start="start" :end="end" :values="values" label="Practice" />',
    properties: [
      {
        name: 'start / end',
        type: 'CivilDate',
        defaultValue: 'required',
        description: 'Inclusive ISO civil dates; range 1–366 days. No time zone conversion.',
      },
      {
        name: 'values',
        type: 'readonly HeatmapValue[]',
        defaultValue: 'required',
        description:
          'Unique date, nonnegative finite value or null; optional label and disabled. Missing differs from zero.',
      },
      {
        name: 'modelValue',
        type: 'CivilDate | null',
        defaultValue: 'null',
        description: 'Controlled selected day.',
      },
      {
        name: 'colors / cellSize / weekStartsOn',
        type: 'string[] / number / 0|1',
        defaultValue: '5 colors / 40 / 1',
        description: '2–8 six-digit HEX colors, 28–80px/DIP cells, Sunday or Monday first.',
      },
      {
        name: 'animated / disabled / formatValue',
        type: 'boolean / boolean / function',
        defaultValue: 'true / false / String',
        description: 'Jolt color interpolation, selection lock and value formatting.',
      },
      {
        name: 'label / id',
        type: 'string',
        defaultValue: 'required / optional',
        description: 'Accessible component name and optional stable ID.',
      },
    ],
    behavior:
      'Dates are laid out in week columns. Each day is a named control with its exact value; View data exposes a linear text alternative. Arrow keys move by day/week, Home/End to the first/last day. The palette includes zero at its lowest stop; absent or null values remain unpainted. Jolt interpolates the cell paint while accessible values update immediately. Reduced motion settles immediately. Long periods scroll horizontally inside the component. `update:modelValue` → `CivilDate`.',
  },
  'image-cropper': {
    usage:
      '<MImageCropper v-model="crop" :src="image" label="Cover" :aspectRatio="1" @export="saveExport" />',
    properties: [
      {
        name: 'src / modelValue',
        type: 'string / ImageCrop | null',
        defaultValue: 'required / null',
        description:
          'Decoded image and controlled crop {x,y,width,height,rotation}; coordinates are pixels after quarter rotation.',
      },
      {
        name: 'aspectRatio / output',
        type: 'number / CropExportOptions',
        defaultValue: '1 / PNG, quality .92',
        description:
          'Aspect 0.1–10; output mimeType PNG/JPEG, quality 0–1 and optional width. Output dimensions 1–4096px.',
      },
      {
        name: 'animated / disabled',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Jolt settling and editing/export lock.',
      },
      {
        name: 'label / id',
        type: 'string',
        defaultValue: 'required / optional',
        description: 'Accessible component name and optional stable ID.',
      },
    ],
    behavior:
      'Drag to pan, pinch to zoom, or use the named direction buttons, zoom slider and 90° rotation button. Escape/pointer cancellation restores the uncommitted crop on Web. The model remains canonical; the app must accept emitted updates. A null model fits the source to the requested aspect. Clear modelValue when changing to an incompatible image/aspect. Web exports a PNG/JPEG data URI through Canvas; remote images must permit CORS. iOS/Android use native image drawing and export a temporary file. The export object includes uri, width, height, mimeType and async dispose(); the consumer owns the result and must call dispose() after using a native temporary file. At most 40 decoded megapixels. This is raster cropping, without filters, arbitrary angles or SVG editing. Loading/export failures emit error; stale loads and exports are released on source changes/deactivation. Native accessibility uses explicit buttons as gesture alternatives. `update:modelValue` → `ImageCrop`; `export` → `CropExport`; `load` → `{width,height}`; `error` → `{stage,message}`. Exposed `export()` returns `Promise<CropExport | undefined>`.',
  },
  scheduler: {
    usage:
      '<MScheduler v-model="events" v-model:date="date" timeZone="America/Sao_Paulo" label="Studio" :days="7" />',
    properties: [
      {
        name: 'modelValue / date / timeZone',
        type: 'SchedulerEvent[] / CivilDate / string',
        defaultValue: 'required',
        description:
          'Stable id/title and start/end epoch milliseconds; explicit IANA zone. Up to 500 events, maximum duration 31 days.',
      },
      {
        name: 'days / startHour / endHour',
        type: '1|7 / number / number',
        defaultValue: '7 / 8 / 19',
        description: 'Day/week view and ordered whole-hour bounds 0–24.',
      },
      {
        name: 'slotMinutes / hourHeight / dayWidth',
        type: 'number',
        defaultValue: '15 / 80 / 180',
        description: 'A 5–60 minute divisor of one hour; height 48–180 and width 140–500px/DIP.',
      },
      {
        name: 'disambiguation',
        type: 'reject | earlier | later',
        defaultValue: 'reject',
        description:
          'Repeated local times require explicit choice; nonexistent times are rejected.',
      },
      {
        name: 'animated / disabled',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Jolt layout and editing lock. Events may be disabled individually.',
      },
      {
        name: 'label / id',
        type: 'string',
        defaultValue: 'required / optional',
        description: 'Accessible component name and optional stable ID.',
      },
    ],
    behavior:
      'Overlapping events occupy separate lanes; multi-day events are clipped into daily segments. A text list exposes every event, including short/clipped entries, with zone offsets to distinguish repeated times. Select an event to move it by a slot/day or resize using explicit buttons. Large single-day segments expose move/resize gesture handles; short segments use the same explicit controls. Dragging is bounded to the visible day/hour range and snaps to slotMinutes. External model/date/zone changes cancel drafts. Moving preserves elapsed duration; resizing resolves the new wall time in the chosen zone. Intl is used on Web; native formatters on iOS/Android. Reduced motion disables decorative settling. No recurrence, resources, remote persistence, calendar sync or automatic conflict resolution is included. `update:modelValue` → `SchedulerEvent[]`; `update:date` → `CivilDate`; `change` → `{id,start,end,kind}`; `select` → event ID; `error` → message.',
  },
  'notification-center': {
    usage:
      '<MNotificationCenter v-model="notifications" v-model:filter="filter" label="Inbox" @action="openNotification" />',
    properties: [
      {
        name: 'modelValue',
        type: 'readonly MavisNotification[]',
        defaultValue: 'required',
        description:
          'Unique id/title, optional description/group/time/read/disabled/dismissible/actionLabel. Up to 1000.',
      },
      {
        name: 'filter',
        type: 'all | unread',
        defaultValue: 'all',
        description: 'Controlled filter; hidden notifications remain in the model.',
      },
      {
        name: 'animated / disabled',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Jolt collection layout and editing lock.',
      },
      {
        name: 'label / id',
        type: 'string',
        defaultValue: 'required / optional',
        description: 'Accessible component name and optional stable ID.',
      },
    ],
    behavior:
      'Grouped messages, unread count, read/unread, mark-all-read, dismissal and an application action share one controlled model. Unknown metadata is preserved. Disabled entries are untouched; dismissible=false prevents removal. When an action removes the focused message, focus returns to the filter. Titles, descriptions and optional time strings are text, never HTML. All toolbar/action labels are localizable. The app owns transport, authorization, persistence and action handling; this component does not request OS push permissions, subscribe to a service or fetch notifications. `update:modelValue` → `MavisNotification[]`; `update:filter` → `all | unread`; `action` → notification ID.',
  },
}
