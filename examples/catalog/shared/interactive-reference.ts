import type { ComponentReference } from './reference'

export const interactiveReferences: Record<string, ComponentReference> = {
  'image-viewer': {
    usage:
      '<MImageViewer v-model="photo" v-model:open="open" :images="images" label="Postcards" />',
    properties: [
      {
        name: 'images',
        type: 'readonly ViewerImage[]',
        defaultValue: '—',
        description:
          'Obrigatório. key única, src completo, alt descritivo; thumbnail, caption e aspectRatio opcionais.',
      },
      {
        name: 'modelValue / open',
        type: 'ChoiceValue / boolean',
        defaultValue: 'null / false',
        description: 'Seleção e apresentação controladas. Seleção removida usa a primeira imagem.',
      },
      {
        name: 'maxZoom / disabled',
        type: 'number / boolean',
        defaultValue: '4 / false',
        description: '4 / false. A escala de zoom começa em 1.',
      },
      {
        name: 'closeLabel / previousLabel / nextLabel / zoomInLabel / zoomOutLabel / resetLabel / errorLabel',
        type: 'string',
        defaultValue: '—',
        description: 'Controles e mensagem de falha traduzíveis.',
      },
    ],
    behavior:
      'Abra uma miniatura para acompanhá-la até a galeria. O shared layout do Jolt conecta as duas apresentações; o controlador de zoom cuida de pinça, arraste, toque duplo e fechamento vertical. Botões oferecem zoom, restauração e navegação sem exigir gestos. Ao fechar com zoom, a imagem retorna primeiro à escala de repouso.\n\nNa Web, o dialog modal contém o foco, fecha com Escape e devolve o foco ao acionador. Na escala inicial, setas na imagem trocam fotos. Com zoom, as setas movem a imagem e Escape primeiro restaura o zoom; outro Escape fecha. +/− ajustam o zoom e 0 restaura. No nativo, use dentro de `MScreen`: sua camada controla a apresentação e o botão Voltar do Android. A transição conectada exige imagens na mesma página/janela e tem fallback quando a origem está indisponível, recortada ou não pode ser capturada. Não é uma transição entre rotas ou células recicladas.\n\nOs eventos `update:modelValue`, `update:open`, `close` e `error` preservam o estado na aplicação. Zoom não modifica o arquivo da imagem.',
  },
  'sortable-list': {
    usage:
      '<MSortableList v-model="tracks" itemKey="id" :itemLabel="track => track.title" label="Playlist">\n  <template #default="{ item }"><MText :text="item.title" /></template>\n</MSortableList>',
    properties: [
      {
        name: 'modelValue / itemKey',
        type: 'readonly T[] / keyof T or function',
        defaultValue: 'required / id',
        description: 'Array controlado; chaves únicas e estáveis, padrão id.',
      },
      {
        name: 'itemLabel',
        type: '(item: T) => string',
        defaultValue: '—',
        description: 'Nome acessível da linha; usa a chave quando omitido.',
      },
      {
        name: 'height / disabled',
        type: 'number / boolean',
        defaultValue: '360 / false',
        description: '360 / false. Área rolável com altura limitada.',
      },
      {
        name: 'handleLabel / moveUpLabel / moveDownLabel / emptyLabel',
        type: 'string',
        defaultValue: '—',
        description: 'Controles traduzíveis.',
      },
    ],
    behavior:
      'Arraste pela alça dedicada. O Jolt cuida da elevação, deslocamento dos vizinhos, rolagem nas bordas e cancelamento; a aplicação aceita a ordem pelo `v-model`. Os botões de mover oferecem a mesma operação sem arraste. `reorder` emite `{ key, beforeKey, fromIndex, toIndex }`; identidades inexistentes e movimentos sem mudança não confirmam. O array recebido não é modificado.\n\nO slot padrão recebe `{ item, index, itemKey }`; filhos com estado mantêm sua identidade ao mover. O slot `empty` substitui a mensagem vazia. Mudanças nos dados ou desativação cancelam o gesto. As linhas ficam montadas: use para playlists, prioridades e etapas, não como lista virtualizada ou Kanban entre colunas.',
  },
  'swipe-actions': {
    usage:
      '<MSwipeActions v-model="side" label="Message" :start="favorites" :end="archive" @action="handleAction">\n  <MText text="Weekend plans" />\n</MSwipeActions>',
    properties: [
      {
        name: 'modelValue',
        type: "'start' | 'end' | null",
        defaultValue: 'null',
        description: 'Lado aberto; padrão null.',
      },
      {
        name: 'start / end',
        type: 'readonly SwipeAction[]',
        defaultValue: '[] / []',
        description:
          'Ações com value única, label visível e icon, disabled e destructive opcionais.',
      },
      {
        name: 'actionWidth / direction',
        type: "number / 'ltr' or 'rtl'",
        defaultValue: '96 / ltr',
        description: '96 / ltr. Largura por ação e direção lógica de leitura.',
      },
      {
        name: 'disabled / actionsLabel / closeLabel',
        type: 'boolean / string / string',
        defaultValue: '—',
        description: 'Desativa a interação e traduz os controles.',
      },
    ],
    behavior:
      'Arraste horizontalmente para revelar ações. O Jolt acompanha o gesto e acomoda a linha; a velocidade de soltura ajuda a escolher o lado. Deslizar nunca executa uma ação automaticamente. O menu Ações expõe todas as opções ao teclado e à navegação assistiva. Escape e Fechar ações retornam ao repouso. `direction="rtl"` inverte os lados lógicos.\n\nO evento `action` entrega a ação selecionada. A aplicação controla arquivamento, exclusão e desfazer; o componente fecha após uma ação. Use uma ou duas ações curtas por lado para preservar espaço em telas estreitas. Mantenha controles horizontais complexos fora da superfície de deslize.',
  },
  'number-flow': {
    usage:
      '<MNumberFlow :value="revenue" label="Revenue" locale="en-US" :format="{ style: \'currency\', currency: \'USD\' }" />',
    properties: [
      {
        name: 'value',
        type: 'number',
        defaultValue: '—',
        description: 'Valor canônico finito, obrigatório.',
      },
      {
        name: 'locale / format',
        type: 'string / NumberFlowFormat',
        defaultValue: 'en-US / decimal',
        description: 'en-US; formatação consistente no servidor e no cliente.',
      },
      {
        name: 'formatValue',
        type: '(value: number) => string',
        defaultValue: '—',
        description: 'Substitui a formatação por localidade.',
      },
      {
        name: 'duration / animated / announce',
        type: 'number / boolean / boolean',
        defaultValue: '650 / true / false',
        description: '650 / true / false. Anúncios educados são opcionais.',
      },
      {
        name: 'variant / tone / label',
        type: 'Text variant / tone / string',
        defaultValue: 'title / default / —',
        description: 'Tipografia e nome acessível. Variante padrão title.',
      },
    ],
    behavior:
      'O Jolt faz os dígitos rolarem enquanto o valor formatado atual continua disponível para tecnologias assistivas. Moeda, agrupamento, casas decimais e mudanças rápidas usam a mesma apresentação. O primeiro render SSR/cliente já mostra o valor final, sem contar a partir de zero. Redução de movimento assenta imediatamente. Desativar a animação interrompe o efeito. Use `formatValue` para um formatador próprio e mantenha a saída determinística no servidor e no cliente.',
  },
  'resizable-panels': {
    usage:
      '<MResizablePanels v-model="split" label="Notebook layout" collapsible>\n  <template #primary><Notes /></template>\n  <template #secondary><Editor /></template>\n</MResizablePanels>',
    properties: [
      {
        name: 'modelValue / min / max',
        type: 'number',
        defaultValue: '40 / 20 / 80',
        description: 'Percentual do primeiro painel: 40 / 20 / 80.',
      },
      {
        name: 'orientation / direction',
        type: "'horizontal' or 'vertical' / 'ltr' or 'rtl'",
        defaultValue: 'horizontal / ltr',
        description: 'horizontal / ltr.',
      },
      {
        name: 'height / step / snap',
        type: 'number / number / readonly number[]',
        defaultValue: '360 / 2 / [25,50,75]',
        description: '360 / 2 / [25,50,75]. Soltar a até 3 pontos percentuais faz o encaixe.',
      },
      {
        name: 'collapsible / disabled',
        type: 'boolean',
        defaultValue: 'false / false',
        description: 'Ambos false; o primeiro painel recolhido usa valor 0.',
      },
      {
        name: 'primaryLabel / secondaryLabel / collapseLabel / expandLabel',
        type: 'string',
        defaultValue: '—',
        description: 'Nomes dos painéis e controles traduzíveis.',
      },
    ],
    behavior:
      'Os slots `primary` e `secondary` continuam montados ao redimensionar, trocar orientação ou recolher. O arraste responde imediatamente; mudanças programáticas, recolhimento e encaixe usam uma mola Jolt. Cada painel tem sua própria rolagem. O modelo controlado permite persistir a preferência na aplicação.\n\nNa Web, o separador tem nome e limites acessíveis. Use setas, Shift+setas e Home/End; Enter alterna o recolhimento. Cancelamento do ponteiro/Escape restaura o valor anterior ao gesto. No nativo, um slider acessível e botões de ajuste complementam o arraste. Redução de movimento altera o layout imediatamente. São dois painéis; composições aninhadas devem manter tamanhos mínimos utilizáveis.',
  },
  'image-compare': {
    usage:
      '<MImageCompare v-model="position" :before="original" :after="edited" label="Photo comparison" beforeLabel="Original" afterLabel="Edited" />',
    properties: [
      {
        name: 'before / after',
        type: 'string',
        defaultValue: '—',
        description: 'Fontes de imagem obrigatórias.',
      },
      {
        name: 'label / beforeLabel / afterLabel',
        type: 'string',
        defaultValue: '—',
        description: 'Nome da comparação obrigatório; rótulos padrão Before / After.',
      },
      {
        name: 'modelValue / step',
        type: 'number',
        defaultValue: '50 / 1',
        description: '50 / 1, limitado a 0–100.',
      },
      {
        name: 'aspectRatio / orientation / disabled',
        type: "number / 'horizontal' or 'vertical' / boolean",
        defaultValue: '1.5 / horizontal / false',
        description: '1.5 / horizontal / false.',
      },
    ],
    behavior:
      'As imagens mantêm sua geometria completa: o divisor revela um recorte, sem espremer a imagem. Arrastar acompanha o gesto; botões ou mudanças externas do modelo animam a revelação por um valor numérico Jolt. Na Web, o slider aceita setas, Shift+setas, Home/End e PageUp/PageDown. No nativo, um slider acessível complementa o controle sobre a imagem. Cancelar restaura o valor inicial. Para antes/depois, use imagens com a mesma composição; imagens diferentes também permitem comparar alternativas. MImage fornece os estados de carregamento e erro.',
  },
}

export const interactiveEnglishReferences: Record<string, ComponentReference> = {
  'image-viewer': {
    usage:
      '<MImageViewer v-model="photo" v-model:open="open" :images="images" label="Postcards" />',
    properties: [
      {
        name: 'images',
        type: 'readonly ViewerImage[]',
        defaultValue: '—',
        description:
          'Required. Unique `key`, full `src`, descriptive `alt`; optional `thumbnail`, `caption`, `aspectRatio`.',
      },
      {
        name: 'modelValue / open',
        type: 'ChoiceValue / boolean',
        defaultValue: 'null / false',
        description:
          'Controlled selection and presentation. Removed selection falls back to the first image.',
      },
      {
        name: 'maxZoom / disabled',
        type: 'number / boolean',
        defaultValue: '4 / false',
        description: '4 / false. Zoom range starts at 1.',
      },
      {
        name: 'closeLabel / previousLabel / nextLabel / zoomInLabel / zoomOutLabel / resetLabel / errorLabel',
        type: 'string',
        defaultValue: '—',
        description: 'Localizable controls and failure message.',
      },
    ],
    behavior:
      'Open a thumbnail to follow it into the viewer. Jolt shared layout connects the two presentations; its zoom controller owns pinch, pan, double tap and vertical dismissal. Buttons provide zoom/reset/navigation without requiring a gesture. At zoom greater than 1, closing first returns to the resting scale. Rapid selection, interrupted closing and unloading release the previous controller.\n\nWeb uses a modal dialog with Escape, contained Tab navigation and return focus. At base scale, arrow keys on the image area change photos. While zoomed, Jolt uses arrows to pan and Escape first resets the zoom; another Escape closes. +/− zoom and 0 resets. Native uses the `MScreen` layer host and handles Android back. Keep the viewer inside an `MScreen` on NativeScript. Images must fit in one page/window for the connected transition; Jolt safely falls back when the source is unavailable, clipped or cannot be captured. No cross-route or recycled-cell return is claimed.\n\n`update:modelValue`, `update:open`, `close` and `error` let the app own state and respond to unavailable images. Source values never change as a side effect of zoom.',
  },
  'sortable-list': {
    usage:
      '<MSortableList v-model="tracks" itemKey="id" :itemLabel="track => track.title" label="Playlist">\n  <template #default="{ item }"><MText :text="item.title" /></template>\n</MSortableList>',
    properties: [
      {
        name: 'modelValue / itemKey',
        type: 'readonly T[] / keyof T or function',
        defaultValue: 'required / id',
        description: 'Controlled array; unique stable keys, default `id`.',
      },
      {
        name: 'itemLabel',
        type: '(item: T) => string',
        defaultValue: '—',
        description: 'Accessible row name; defaults to its key.',
      },
      {
        name: 'height / disabled',
        type: 'number / boolean',
        defaultValue: '360 / false',
        description: '360 / false. Bounded scrolling viewport.',
      },
      {
        name: 'handleLabel / moveUpLabel / moveDownLabel / emptyLabel',
        type: 'string',
        defaultValue: '—',
        description: 'Localizable controls.',
      },
    ],
    behavior:
      'Drag the dedicated handle. Jolt owns lifting, neighboring item placement, edge scrolling and cancellation; the app accepts the new order through `v-model`. Move buttons provide the same operation without dragging. `reorder` emits `{ key, beforeKey, fromIndex, toIndex }` after a valid move. Unknown identities and unchanged moves do not commit. The input array is never mutated.\n\nThe default slot receives `{ item, index, itemKey }`; stateful children stay keyed while moving. An `empty` slot replaces the empty message. Changing data or disabling cancels the current gesture. All rows are mounted: this is intended for editable playlists, priorities and steps, not a virtualized large dataset or cross-column Kanban.',
  },
  'swipe-actions': {
    usage:
      '<MSwipeActions v-model="side" label="Message" :start="favorites" :end="archive" @action="handleAction">\n  <MText text="Weekend plans" />\n</MSwipeActions>',
    properties: [
      {
        name: 'modelValue',
        type: "'start' | 'end' | null",
        defaultValue: 'null',
        description: 'Open side; default `null`.',
      },
      {
        name: 'start / end',
        type: 'readonly SwipeAction[]',
        defaultValue: '[] / []',
        description:
          'Actions with unique `value`, visible `label`, optional `icon`, `disabled`, `destructive`.',
      },
      {
        name: 'actionWidth / direction',
        type: "number / 'ltr' or 'rtl'",
        defaultValue: '96 / ltr',
        description: '96 / ltr. Width per action and logical reading direction.',
      },
      {
        name: 'disabled / actionsLabel / closeLabel',
        type: 'boolean / string / string',
        defaultValue: '—',
        description: 'Disable input and localize controls.',
      },
    ],
    behavior:
      'Drag horizontally to reveal actions. Jolt follows the gesture and settles the row; release velocity contributes to choosing a side. Swiping never executes an action automatically. The Actions menu exposes every action to keyboard and assistive input. Escape and Close actions return the row to rest. Supply `direction="rtl"` to mirror logical start/end.\n\nThe `action` event supplies the selected action. The application owns archiving/deletion and undo; the component closes after an action. Place one or two short actions per side so the row remains usable on narrow screens. Keep complex horizontal controls outside the swipe surface.',
  },
  'number-flow': {
    usage:
      '<MNumberFlow :value="revenue" label="Revenue" locale="en-US" :format="{ style: \'currency\', currency: \'USD\' }" />',
    properties: [
      {
        name: 'value',
        type: 'number',
        defaultValue: '—',
        description: 'Required finite canonical value.',
      },
      {
        name: 'locale / format',
        type: 'string / NumberFlowFormat',
        defaultValue: 'en-US / decimal',
        description: 'en-US; consistent server/client formatting.',
      },
      {
        name: 'formatValue',
        type: '(value: number) => string',
        defaultValue: '—',
        description: 'Overrides locale formatting.',
      },
      {
        name: 'duration / animated / announce',
        type: 'number / boolean / boolean',
        defaultValue: '650 / true / false',
        description: '650 / true / false. Polite announcements are opt-in.',
      },
      {
        name: 'variant / tone / label',
        type: 'Text variant / tone / string',
        defaultValue: 'title / default / —',
        description: 'Typography and accessible label. Default variant `title`.',
      },
    ],
    behavior:
      'Jolt rolls the changing digits while the canonical formatted value remains available to assistive technology. Currency, grouping, decimal changes and rapidly replaced values use the same presentation. The first SSR/client paint is the final value, with no entrance from zero. Reduced motion settles immediately. Disabling animation stops the active effect. Use `formatValue` for an application-specific formatter, and keep its output deterministic between server and client.',
  },
  'resizable-panels': {
    usage:
      '<MResizablePanels v-model="split" label="Notebook layout" collapsible>\n  <template #primary><Notes /></template>\n  <template #secondary><Editor /></template>\n</MResizablePanels>',
    properties: [
      {
        name: 'modelValue / min / max',
        type: 'number',
        defaultValue: '40 / 20 / 80',
        description: 'First panel percentage: `40 / 20 / 80`.',
      },
      {
        name: 'orientation / direction',
        type: "'horizontal' or 'vertical' / 'ltr' or 'rtl'",
        defaultValue: 'horizontal / ltr',
        description: 'horizontal / ltr.',
      },
      {
        name: 'height / step / snap',
        type: 'number / number / readonly number[]',
        defaultValue: '360 / 2 / [25,50,75]',
        description: '360 / 2 / [25,50,75]. Release within 3 percentage points snaps.',
      },
      {
        name: 'collapsible / disabled',
        type: 'boolean',
        defaultValue: 'false / false',
        description: 'Both `false`; collapsed first panel uses value `0`.',
      },
      {
        name: 'primaryLabel / secondaryLabel / collapseLabel / expandLabel',
        type: 'string',
        defaultValue: '—',
        description: 'Localizable panel names and controls.',
      },
    ],
    behavior:
      "The primary and secondary slots remain mounted when resizing, switching orientation or collapsing. Dragging updates immediately; programmatic changes, collapse and snap use a Jolt spring. Each panel scrolls independently. The controlled model owns persistence.\n\nWeb exposes a named separator with current bounds. Use arrows, Shift+arrows, Home/End; Enter toggles collapse when enabled. Pointer cancellation/Escape restores the gesture's original value. Native adds an accessible slider and explicit adjustment buttons alongside direct dragging. Reduced motion changes layout immediately. Two panels are supported; nested panel systems must manage their own minimum usable sizes.",
  },
  'image-compare': {
    usage:
      '<MImageCompare v-model="position" :before="original" :after="edited" label="Photo comparison" beforeLabel="Original" afterLabel="Edited" />',
    properties: [
      {
        name: 'before / after',
        type: 'string',
        defaultValue: '—',
        description: 'Required image sources.',
      },
      {
        name: 'label / beforeLabel / afterLabel',
        type: 'string',
        defaultValue: '—',
        description: 'Required comparison name; default side labels `Before / After`.',
      },
      {
        name: 'modelValue / step',
        type: 'number',
        defaultValue: '50 / 1',
        description: '50 / 1, clamped to 0–100.',
      },
      {
        name: 'aspectRatio / orientation / disabled',
        type: "number / 'horizontal' or 'vertical' / boolean",
        defaultValue: '1.5 / horizontal / false',
        description: '1.5 / horizontal / false.',
      },
    ],
    behavior:
      'Both images keep their full geometry: the divider reveals a clipped image instead of squeezing it. Direct dragging follows input; buttons or external model changes animate the reveal through a Jolt numeric value. The Web slider supports arrows, Shift+arrows, Home/End and PageUp/PageDown. Native provides an accessible slider in addition to the on-image handle. Cancellation restores the starting value. Use images with matching composition for before/after comparisons; different images work for comparing alternatives. Image loading/error placeholders come from MImage.',
  },
}
