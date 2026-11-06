import type { ComponentReference } from './reference'
export const creativeEnglishReferences: Record<string, ComponentReference> = {
  'color-picker': {
    usage: '<MColorPicker v-model="color" label="Signature color" alpha />',
    properties: [
      {
        name: 'modelValue',
        type: 'string',
        defaultValue: '#9C5270',
        description: 'HEX or RGB(A) input; updates emit uppercase #RRGGBB or #RRGGBBAA.',
      },
      {
        name: 'alpha / animated',
        type: 'boolean',
        defaultValue: 'false / true',
        description: 'Alpha channel and optional Jolt preview transition.',
      },
      {
        name: 'palette',
        type: 'readonly string[]',
        defaultValue: 'six colors',
        description: 'Valid HEX/RGB colors presented as selectable buttons.',
      },
      {
        name: 'disabled / readonly',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevent changes through every input and palette action.',
      },
      {
        name: 'colorLabel / hueLabel / saturationLabel / brightnessLabel / alphaLabel / paletteLabel / invalidLabel',
        type: 'string',
        defaultValue: 'English',
        description: 'Labels and validation text can be localized.',
      },
    ],
    behavior:
      'Invalid editor drafts stay visible without changing the model. Sliders operate on HSV and opacity; a remembered hue allows choosing a hue while saturation is zero. The large preview animates an opaque decorative gradient; the canonical color retains its alpha. Colors are not inferred from arbitrary CSS variables.',
  },
  'swipe-deck': {
    usage:
      '<MSwipeDeck v-model="currentId" :items="cards" label="Discover"\n  :canUndo="history.length > 0" @decide="history.push($event)" @undo="undo" />',
    properties: [
      {
        name: 'items',
        type: 'readonly SwipeCard[]',
        defaultValue: 'required',
        description: 'Unique id, title, optional description/image.',
      },
      {
        name: 'modelValue',
        type: 'string | number | null',
        defaultValue: 'null',
        description: 'Current card identity. null or a missing id displays the empty state.',
      },
      {
        name: 'threshold / height',
        type: 'number',
        defaultValue: '90 / 340',
        description: 'Swipe decision distance and card height in px/DIP.',
      },
      {
        name: 'animated / disabled',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Exit/return motion and input availability.',
      },
      {
        name: 'canUndo',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Enables the undo action; the application owns history.',
      },
      {
        name: 'acceptLabel / rejectLabel / undoLabel / emptyLabel',
        type: 'string',
        defaultValue: 'English',
        description: 'Localized actions and empty state.',
      },
    ],
    behavior:
      'Jolt owns dragging, spring return and the rotated exit. Buttons provide the same decisions without a gesture. decide({item, decision}) emits accept/reject; update:modelValue proposes the next item. Undo only emits undo; restore the previous id in your application. Rejected updates settle the same card. The item slot receives {item, index}; keep actions outside the drag surface.',
  },
  gauge: {
    usage: '<MGauge :value="balance" label="Weekly balance" suffix="%" semi animateNumber />',
    properties: [
      {
        name: 'value / min / max',
        type: 'number',
        defaultValue: 'required / 0 / 100',
        description: 'Finite range; value is clamped for visual and semantic output.',
      },
      {
        name: 'semi',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Use a half circle instead of a full ring.',
      },
      {
        name: 'size / strokeWidth',
        type: 'number',
        defaultValue: '220 / 7',
        description: 'Size >= 80 px/DIP; stroke width in viewBox units, (0,18].',
      },
      {
        name: 'animated / animateNumber',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Jolt arc interpolation; optional NumberFlow presentation.',
      },
      {
        name: 'color / suffix / formatValue',
        type: 'string / string / function',
        defaultValue: 'theme / empty / default',
        description: 'Color, suffix and canonical value formatting.',
      },
    ],
    behavior:
      'The meter exposes its final value immediately while Jolt animates strokeEnd. The shared shape backend paints native arcs and Web SVG; server HTML includes a static SVG fallback. A textual value remains available independently of the decorative drawing. This component measures a value; use Progress for task completion.',
  },
  tour: {
    usage:
      '<MTour v-model="step" :steps="steps" label="Getting started">\n  <MTourTarget name="editor"><MInput v-model="name" label="Name" /></MTourTarget>\n</MTour>',
    properties: [
      {
        name: 'steps',
        type: 'readonly TourStep[]',
        defaultValue: 'required',
        description: 'Unique id, title and description. id matches MTourTarget.name.',
      },
      {
        name: 'modelValue',
        type: 'string | null',
        defaultValue: 'null',
        description: 'Current step id; null closes the tour.',
      },
      {
        name: 'animated',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Optional target instruction feedback, alongside Popover motion.',
      },
      {
        name: 'nextLabel / backLabel / skipLabel / finishLabel',
        type: 'string',
        defaultValue: 'English',
        description: 'Localized navigation actions.',
      },
      {
        name: 'MTourTarget.name',
        type: 'string',
        defaultValue: 'required',
        description: 'A unique target within the enclosing tour.',
      },
    ],
    behavior:
      'Wrap existing content in MTourTarget; it remains mounted throughout the tour. Targets are explicit shared components, without document selectors. The active target gets an outline, is revealed in its scroll container and owns an anchored Popover. Missing targets emit missing(id) and propose the next registered step. finish(reason) distinguishes complete, skip, missing and Popover dismissal. Closing restores prior focus where the platform permits. Web is non-modal; native Popover uses its native overlay. No dimmed spotlight mask is implied.',
  },
  'transfer-list': {
    usage: '<MTransferList v-model="selectedIds" :options="options" label="Expedition kit" />',
    properties: [
      {
        name: 'options',
        type: 'readonly ChoiceOption[]',
        defaultValue: 'required',
        description: 'Unique value, label and optional disabled.',
      },
      {
        name: 'modelValue',
        type: 'readonly ChoiceValue[]',
        defaultValue: '[]',
        description: 'Selected identities; application owns acceptance of changes.',
      },
      {
        name: 'animated / disabled',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Jolt list layout and input availability.',
      },
      {
        name: 'availableLabel / selectedLabel / searchLabel / addLabel / removeLabel / emptyLabel',
        type: 'string',
        defaultValue: 'English',
        description: 'Panel names, filtering and movement actions.',
      },
    ],
    behavior:
      'Checkboxes work with Tab/Space; movement has explicit buttons, so no dragging is required. Filtering preserves checked items: the action transfers all checked, enabled items on that side, including those hidden by the filter. Disabled items cannot move. Unknown selected ids are preserved for application-owned asynchronous catalogs. Both lists become columns below 620px/DIP.',
  },
  marquee: {
    usage:
      '<MMarquee :items="reminders" label="Small reminders"\n  v-model:paused="paused" :speed="35" />',
    properties: [
      {
        name: 'items',
        type: 'readonly MarqueeItem[]',
        defaultValue: 'required',
        description: 'Unique id, label and optional image; content is noninteractive.',
      },
      {
        name: 'autoplay / paused',
        type: 'boolean',
        defaultValue: 'false / false',
        description: 'Autoplay is opt-in. paused can be controlled with v-model:paused.',
      },
      {
        name: 'speed / direction',
        type: 'number / left | right',
        defaultValue: '35 / left',
        description: 'Pixels/DIPs per second, in (0,500].',
      },
      {
        name: 'itemWidth / gap',
        type: 'number',
        defaultValue: '180 / 16',
        description: 'Fixed item width >=80 and nonnegative spacing.',
      },
      {
        name: 'playLabel / pauseLabel',
        type: 'string',
        defaultValue: 'English',
        description: 'Always-visible motion control labels.',
      },
    ],
    behavior:
      'Jolt owns linear playback and pause/resume. Decorative repeated copies are hidden from accessibility. Motion starts only on request; reduced motion always produces a static wrapping list. Web pauses on hover/focus, page hiding and leaving the viewport; native pauses on application suspension and unload. KeepAlive/disposal releases observers and playback. No links or interactive slots are duplicated.',
  },
}
export const creativeReferences: Record<string, ComponentReference> = {
  'color-picker': {
    usage: '<MColorPicker v-model="color" label="Signature color" alpha />',
    properties: [
      {
        name: 'modelValue',
        type: 'string',
        defaultValue: '#9C5270',
        description: 'Entrada HEX ou RGB(A); eventos emitem #RRGGBB ou #RRGGBBAA em maiúsculas.',
      },
      {
        name: 'alpha / animated',
        type: 'boolean',
        defaultValue: 'false / true',
        description: 'Canal alfa e transição opcional da prévia com Jolt.',
      },
      {
        name: 'palette',
        type: 'readonly string[]',
        defaultValue: 'six colors',
        description: 'Cores HEX/RGB válidas, oferecidas como botões.',
      },
      {
        name: 'disabled / readonly',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Impedem mudanças por campos, controles e paleta.',
      },
      {
        name: 'colorLabel / hueLabel / saturationLabel / brightnessLabel / alphaLabel / paletteLabel / invalidLabel',
        type: 'string',
        defaultValue: 'English',
        description: 'Rótulos e validação podem ser traduzidos.',
      },
    ],
    behavior:
      'Rascunhos inválidos ficam visíveis sem alterar o modelo. Sliders controlam HSV e opacidade; a matiz é preservada quando a saturação está zerada. A prévia grande anima um gradiente decorativo opaco; a cor canônica preserva o alfa. Não interpreta variáveis CSS arbitrárias.',
  },
  'swipe-deck': {
    usage:
      '<MSwipeDeck v-model="currentId" :items="cards" label="Discover"\n  :canUndo="history.length > 0" @decide="history.push($event)" @undo="undo" />',
    properties: [
      {
        name: 'items',
        type: 'readonly SwipeCard[]',
        defaultValue: 'required',
        description: 'Id único, título e descrição/imagem opcionais.',
      },
      {
        name: 'modelValue',
        type: 'string | number | null',
        defaultValue: 'null',
        description: 'Identidade do card atual. null ou id ausente exibe o estado vazio.',
      },
      {
        name: 'threshold / height',
        type: 'number',
        defaultValue: '90 / 340',
        description: 'Distância para decidir e altura do card em px/DIP.',
      },
      {
        name: 'animated / disabled',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Movimento de saída/retorno e disponibilidade.',
      },
      {
        name: 'canUndo',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Habilita desfazer; o histórico pertence à aplicação.',
      },
      {
        name: 'acceptLabel / rejectLabel / undoLabel / emptyLabel',
        type: 'string',
        defaultValue: 'English',
        description: 'Ações e estado vazio traduzíveis.',
      },
    ],
    behavior:
      'Jolt controla arraste, retorno com mola e saída rotacionada. Botões oferecem as mesmas decisões sem gesto. decide({item, decision}) emite accept/reject; update:modelValue propõe o próximo item. Desfazer só emite undo; restaure o id anterior na aplicação. Atualizações rejeitadas acomodam o mesmo card. O slot item recebe {item, index}; mantenha ações fora da superfície de arraste.',
  },
  gauge: {
    usage: '<MGauge :value="balance" label="Weekly balance" suffix="%" semi animateNumber />',
    properties: [
      {
        name: 'value / min / max',
        type: 'number',
        defaultValue: 'required / 0 / 100',
        description: 'Intervalo finito; valor limitado tanto visualmente quanto na semântica.',
      },
      {
        name: 'semi',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Usa semicírculo em vez de anel completo.',
      },
      {
        name: 'size / strokeWidth',
        type: 'number',
        defaultValue: '220 / 7',
        description: 'Tamanho >= 80 px/DIP; espessura em unidades do viewBox, (0,18].',
      },
      {
        name: 'animated / animateNumber',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Interpolação do arco com Jolt; NumberFlow opcional.',
      },
      {
        name: 'color / suffix / formatValue',
        type: 'string / string / function',
        defaultValue: 'theme / empty / default',
        description: 'Cor, sufixo e formatação do valor canônico.',
      },
    ],
    behavior:
      'O medidor expõe o valor final imediatamente enquanto Jolt anima strokeEnd. O backend compartilhado desenha arcos nativos e SVG na Web; o HTML do servidor inclui SVG estático. O valor textual permanece disponível independentemente do desenho decorativo. O componente mede um valor; use Progress para conclusão de tarefas.',
  },
  tour: {
    usage:
      '<MTour v-model="step" :steps="steps" label="Getting started">\n  <MTourTarget name="editor"><MInput v-model="name" label="Name" /></MTourTarget>\n</MTour>',
    properties: [
      {
        name: 'steps',
        type: 'readonly TourStep[]',
        defaultValue: 'required',
        description: 'Id único, título e descrição. id corresponde a MTourTarget.name.',
      },
      {
        name: 'modelValue',
        type: 'string | null',
        defaultValue: 'null',
        description: 'Id do passo atual; null encerra o tour.',
      },
      {
        name: 'animated',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Feedback opcional das instruções, junto ao movimento do Popover.',
      },
      {
        name: 'nextLabel / backLabel / skipLabel / finishLabel',
        type: 'string',
        defaultValue: 'English',
        description: 'Ações de navegação traduzíveis.',
      },
      {
        name: 'MTourTarget.name',
        type: 'string',
        defaultValue: 'required',
        description: 'Alvo único dentro do tour que o contém.',
      },
    ],
    behavior:
      'Envolva conteúdo existente em MTourTarget; ele permanece montado durante todo o tour. Os alvos são componentes compartilhados explícitos, sem seletores do document. O alvo ativo recebe contorno, é revelado na rolagem e ancora um Popover. Alvos ausentes emitem missing(id) e propõem o próximo passo registrado. finish(reason) distingue complete, skip, missing e o fechamento do Popover. Ao encerrar, restaura o foco anterior quando a plataforma permite. Na Web não é modal; o Popover nativo usa sua camada nativa. Não inclui máscara escura com recorte.',
  },
  'transfer-list': {
    usage: '<MTransferList v-model="selectedIds" :options="options" label="Expedition kit" />',
    properties: [
      {
        name: 'options',
        type: 'readonly ChoiceOption[]',
        defaultValue: 'required',
        description: 'Value único, label e disabled opcional.',
      },
      {
        name: 'modelValue',
        type: 'readonly ChoiceValue[]',
        defaultValue: '[]',
        description: 'Identidades selecionadas; a aplicação aceita as mudanças.',
      },
      {
        name: 'animated / disabled',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Layout de lista com Jolt e disponibilidade.',
      },
      {
        name: 'availableLabel / selectedLabel / searchLabel / addLabel / removeLabel / emptyLabel',
        type: 'string',
        defaultValue: 'English',
        description: 'Nomes dos painéis, filtros e ações de transferência.',
      },
    ],
    behavior:
      'Checkboxes usam Tab/Espaço; ações têm botões explícitos e não exigem arraste. Filtrar preserva marcações: a ação transfere todos os itens marcados e habilitados daquele lado, inclusive os ocultos pelo filtro. Itens desabilitados não se movem. Ids selecionados desconhecidos são preservados para catálogos assíncronos da aplicação. Abaixo de 620px/DIP, os painéis se empilham.',
  },
  marquee: {
    usage:
      '<MMarquee :items="reminders" label="Small reminders"\n  v-model:paused="paused" :speed="35" />',
    properties: [
      {
        name: 'items',
        type: 'readonly MarqueeItem[]',
        defaultValue: 'required',
        description: 'Id único, label e imagem opcional; conteúdo não interativo.',
      },
      {
        name: 'autoplay / paused',
        type: 'boolean',
        defaultValue: 'false / false',
        description: 'Início automático é opcional. paused pode usar v-model:paused.',
      },
      {
        name: 'speed / direction',
        type: 'number / left | right',
        defaultValue: '35 / left',
        description: 'Pixels/DIPs por segundo, em (0,500].',
      },
      {
        name: 'itemWidth / gap',
        type: 'number',
        defaultValue: '180 / 16',
        description: 'Largura fixa >=80 e espaçamento não negativo.',
      },
      {
        name: 'playLabel / pauseLabel',
        type: 'string',
        defaultValue: 'English',
        description: 'Rótulos do controle de movimento sempre visível.',
      },
    ],
    behavior:
      'Jolt controla a reprodução linear e pausa/retomada. Cópias decorativas ficam ocultas da acessibilidade. Movimento inicia somente por escolha; movimento reduzido sempre produz uma lista estática com quebra de linha. Na Web pausa ao passar o cursor, focar, ocultar a página ou sair da área visível; no nativo pausa ao suspender o app ou descarregar a view. KeepAlive/descarte liberam observadores e reprodução. Não duplica links nem slots interativos.',
  },
}
