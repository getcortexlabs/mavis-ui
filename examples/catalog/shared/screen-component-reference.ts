import type { ComponentReference } from './reference'
export const screenComponentReferences: Record<string, ComponentReference> = {
  'collapsible-header': {
    usage:
      '<MCollapsibleHeader title="Field notes" :image="cover" :height="540">\n  <MColumn padding="lg"><Stories /></MColumn>\n</MCollapsibleHeader>',
    properties: [
      {
        name: 'title / subtitle / image',
        type: 'string',
        defaultValue: '—',
        description: 'Título, texto de apoio e imagem decorativa opcional.',
      },
      {
        name: 'height / expandedHeight / collapsedHeight',
        type: 'number',
        defaultValue: '540 / 240 / 64',
        description: 'Altura finita; expanded deve superar collapsed, que deve ser positivo.',
      },
      {
        name: 'parallax / sectionHeight',
        type: 'number',
        defaultValue: '0.35 / 0',
        description: 'Fração de parallax entre 0 e 1 e altura da seção fixa.',
      },
      {
        name: 'back / backLabel / topLabel',
        type: 'boolean / string',
        defaultValue: 'false / Go back / Back to top',
        description: 'Ação de retorno opcional e controles traduzíveis.',
      },
    ],
    behavior:
      'Cabeçalho com imagem e duas apresentações do título. O conteúdo rola em uma região com altura definida; o componente não cria uma Page nativa. Use dentro de MScreen, evitando dar a esta região e ao pai a mesma responsabilidade de rolagem. Jolt controla colapso, parallax e limpeza. Slots: default, artwork, leading, actions e section. Ao usar section, defina sectionHeight com a altura da composição. O evento back pertence à aplicação; o botão de topo retorna esta região ao início.',
  },
  'refresh-control': {
    usage:
      '<MRefreshControl label="Your morning edition" :refresh="refreshStories">\n  <Stories :items="stories" />\n</MRefreshControl>',
    properties: [
      {
        name: 'label / refresh',
        type: 'string / RefreshAction',
        defaultValue: 'required',
        description: 'Nome acessível e operação da aplicação.',
      },
      {
        name: 'height / threshold',
        type: 'number',
        defaultValue: '480 / 80',
        description: 'Altura e distância do gesto em px/DIP.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Cancela trabalho pendente e pausa a interação.',
      },
      {
        name: 'refreshLabel / refreshingLabel / successLabel / errorLabel / retryLabel / cancelLabel',
        type: 'string',
        defaultValue: 'English labels',
        description: 'Traduza cada estado e ação.',
      },
    ],
    behavior:
      'Puxe no topo ou use o botão Atualizar. Forneça refresh(context) assíncrono. context.signal permite cancelamento e context.commit(() => atualizarEstado()) protege a atualização contra respostas antigas. Aplique resultados dentro de commit; escritas arbitrárias da aplicação não podem ser desfeitas. Uma solicitação por vez. Cancelamento, desabilitação, desativação por KeepAlive e desmontagem invalidam a solicitação atual. Rótulos de erro e sucesso são configuráveis. Métodos expostos: refresh() e cancel(). O componente possui região rolável com altura definida e cabeçalho de estado; não cria uma Page nativa.',
  },
  composer: {
    usage:
      '<MComposer v-model="draft" v-model:attachments="attachments"\n  label="Your message" @attach="chooseFiles" @submit="send" />',
    properties: [
      {
        name: 'modelValue / attachments',
        type: 'string / ComposerAttachment[]',
        defaultValue: 'empty / []',
        description: 'Rascunho e anexos controlados com ids únicos e nomes.',
      },
      {
        name: 'label / placeholder / error',
        type: 'string',
        defaultValue: '—',
        description: 'Nome, placeholder e mensagem de validação.',
      },
      {
        name: 'rows / maxLength',
        type: 'number',
        defaultValue: '2 / unlimited',
        description: 'Linhas iniciais e limite opcional.',
      },
      {
        name: 'loading / disabled / readonly',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Estados de edição e envio.',
      },
      {
        name: 'followKeyboard / keyboardOffset / shortcut',
        type: 'boolean / number / boolean',
        defaultValue: 'false / 0 / true',
        description: 'Acompanhamento de teclado e Ctrl/Cmd+Enter Web.',
      },
      {
        name: 'attachable / attachLabel / removeLabel / sendLabel / sendingLabel',
        type: 'boolean / string',
        defaultValue: 'true / English labels',
        description: 'Ação de anexo e controles traduzíveis.',
      },
    ],
    behavior:
      'Editor multilinha controlado com nomes de anexos removíveis. A aplicação seleciona arquivos, envia mensagens e limpa o rascunho após sucesso; o componente não envia nem limpa automaticamente. submit recebe { text, attachments }. Ctrl/Cmd+Enter envia na Web; Enter mantém a quebra de linha e a composição IME é preservada. loading bloqueia edição e ações. followKeyboard é opcional para uma camada própria; deixe desativado dentro de Screen ou Sheet que já redimensiona para evitar ajustes duplicados. A geometria Web é estimada; no nativo, Jolt fornece o acompanhamento. Slot default para conteúdo complementar. focus()/blur() atuam no editor.',
  },
  'speed-dial': {
    usage:
      '<MSpeedDial v-model:open="open" label="Create something"\n  :actions="actions" @select="handleAction" />',
    properties: [
      {
        name: 'label / actions',
        type: 'string / SpeedDialAction[]',
        defaultValue: 'required',
        description: 'Acionador visível e ações nomeadas.',
      },
      {
        name: 'open',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Controlado por v-model:open.',
      },
      {
        name: 'direction',
        type: 'up | down',
        defaultValue: 'up',
        description: 'Direção preferencial.',
      },
      {
        name: 'disabled / icon / closeLabel',
        type: 'boolean / IconName / string',
        defaultValue: 'false / plus / Close actions',
        description: 'Disponibilidade, ícone e ação explícita de fechar.',
      },
    ],
    behavior:
      'Ações rápidas controladas usando o ciclo de vida de Popover. Cada ação tem value único, label, icon e disabled opcionais. A seleção emite select(value, action) e solicita fechamento. A operação pertence à aplicação. Jolt anima o painel e a entrada sequencial; teclado e foco continuam sob responsabilidade de Popover. Escape, clique externo e Voltar nativo seguem as regras da camada existente. direction escolhe abertura preferencial para cima/baixo; na Web, ajusta ao viewport. No nativo, usa a camada de popover existente.',
  },
  'pin-input': {
    usage:
      '<MPinInput v-model="code" label="Verification code"\n  :length="6" autocomplete="one-time-code" @complete="checkCode" />',
    properties: [
      {
        name: 'modelValue / label',
        type: 'string',
        defaultValue: 'empty / required',
        description: 'Código numérico e nome acessível.',
      },
      {
        name: 'length',
        type: 'number',
        defaultValue: '6',
        description: 'Inteiro entre 2 e 12.',
      },
      {
        name: 'disabled / readonly / required',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Disponibilidade e validação de formulário Web.',
      },
      {
        name: 'id / name / form',
        type: 'string',
        defaultValue: '—',
        description: 'Id do editor e associação ao formulário Web.',
      },
      {
        name: 'error / helperText',
        type: 'string',
        defaultValue: '—',
        description: 'Mensagem de validação/ajuda associada.',
      },
    ],
    behavior:
      'Um editor real sob células decorativas preserva seleção, colagem e preenchimento automático. Strings numéricas mantêm zeros à esquerda; dígitos de largura completa e separadores colados são normalizados. complete(value) ocorre quando uma edição do usuário completa o código, não após uma atualização programática. O componente não verifica códigos nem autentica. O preenchimento nativo depende do sistema e da configuração do aplicativo. Na Web, usa one-time-code, um campo de formulário nomeado e validação pattern; focus()/blur() atuam no editor.',
  },
  'animated-text': {
    usage: '<MAnimatedText :text="headline" by="word"\n  :replayKey="take" variant="display" />',
    properties: [
      {
        name: 'text / variant / tone',
        type: 'string / typography / palette',
        defaultValue: 'required / title / default',
        description: 'Texto canônico e tipografia compartilhada.',
      },
      {
        name: 'by',
        type: 'word | letter',
        defaultValue: 'word',
        description: 'Segmentação da animação.',
      },
      {
        name: 'duration / stagger / distance',
        type: 'number',
        defaultValue: '650 / 35 / 16',
        description: 'Milissegundos e distância px/DIP; duração positiva, intervalo não negativo.',
      },
      {
        name: 'animated / appear / replayKey',
        type: 'boolean / boolean / string or number',
        defaultValue: 'true / true / 0',
        description: 'Ativar animação, entrada e repetição explícita.',
      },
    ],
    behavior:
      'Jolt controla a entrada por palavras/letras e a substituição da animação. O texto é explícito, sem marcação rica por slot. O servidor entrega texto canônico legível; a animação só começa quando o renderer está pronto. Alterar text ou replayKey repete o efeito; replay() faz o mesmo. animated=false interrompe a animação. Movimento reduzido segue a política do runtime. Não há temporizador automático de frases nem animação infinita.',
  },
}
export const screenComponentEnglishReferences: Record<string, ComponentReference> = {
  'collapsible-header': {
    usage:
      '<MCollapsibleHeader title="Field notes" :image="cover" :height="540">\n  <MColumn padding="lg"><Stories /></MColumn>\n</MCollapsibleHeader>',
    properties: [
      {
        name: 'title / subtitle / image',
        type: 'string',
        defaultValue: '—',
        description: 'Heading, supporting text and optional decorative artwork.',
      },
      {
        name: 'height / expandedHeight / collapsedHeight',
        type: 'number',
        defaultValue: '540 / 240 / 64',
        description:
          'Finite region height; expanded must exceed collapsed, which must be positive.',
      },
      {
        name: 'parallax / sectionHeight',
        type: 'number',
        defaultValue: '0.35 / 0',
        description: 'Parallax fraction 0–1 and pinned section height.',
      },
      {
        name: 'back / backLabel / topLabel',
        type: 'boolean / string',
        defaultValue: 'false / Go back / Back to top',
        description: 'Opt-in back action and translatable controls.',
      },
    ],
    behavior:
      'A retained scroll header with artwork and two title presentations. The content scrolls inside a bounded region; this component does not create a native Page. Use inside MScreen, and avoid giving this region and its parent the same scrolling responsibility. Jolt owns collapse, parallax and cleanup. Slots: default, artwork, leading, actions and section. When using section, set sectionHeight to its measured design height. The back event belongs to the application; the top button returns this region to its beginning.',
  },
  'refresh-control': {
    usage:
      '<MRefreshControl label="Your morning edition" :refresh="refreshStories">\n  <Stories :items="stories" />\n</MRefreshControl>',
    properties: [
      {
        name: 'label / refresh',
        type: 'string / RefreshAction',
        defaultValue: 'required',
        description: 'Accessible region name and application-owned operation.',
      },
      {
        name: 'height / threshold',
        type: 'number',
        defaultValue: '480 / 80',
        description: 'Viewport height and pull threshold in px/DIP.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Cancel pending work and pause refresh interaction.',
      },
      {
        name: 'refreshLabel / refreshingLabel / successLabel / errorLabel / retryLabel / cancelLabel',
        type: 'string',
        defaultValue: 'English labels',
        description: 'Translate every state and action.',
      },
    ],
    behavior:
      'Pull down at the top, or use the Refresh button. Supply an async refresh(context) callback. context.signal supports cancellation, and context.commit(() => updateState()) guards application updates against stale requests. Apply results inside commit; arbitrary writes performed by the application cannot be undone. Only one request runs at a time. Cancel, disabling, KeepAlive deactivation and teardown invalidate the active request. Error and success labels are configurable. Exposed methods: refresh() and cancel(). RefreshControl owns a bounded scroll region with a compact status header, not a native Page.',
  },
  composer: {
    usage:
      '<MComposer v-model="draft" v-model:attachments="attachments"\n  label="Your message" @attach="chooseFiles" @submit="send" />',
    properties: [
      {
        name: 'modelValue / attachments',
        type: 'string / ComposerAttachment[]',
        defaultValue: 'empty / []',
        description: 'Controlled draft and unique attachment ids/names.',
      },
      {
        name: 'label / placeholder / error',
        type: 'string',
        defaultValue: '—',
        description: 'Editor name, hint and validation message.',
      },
      {
        name: 'rows / maxLength',
        type: 'number',
        defaultValue: '2 / unlimited',
        description: 'Initial editor lines and optional character limit.',
      },
      {
        name: 'loading / disabled / readonly',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Explicit editing and submission states.',
      },
      {
        name: 'followKeyboard / keyboardOffset / shortcut',
        type: 'boolean / number / boolean',
        defaultValue: 'false / 0 / true',
        description: 'Overlay keyboard following and Web Ctrl/Cmd+Enter.',
      },
      {
        name: 'attachable / attachLabel / removeLabel / sendLabel / sendingLabel',
        type: 'boolean / string',
        defaultValue: 'true / English labels',
        description: 'Attachment affordance and translatable controls.',
      },
    ],
    behavior:
      'A controlled multiline editor with removable attachment names. The application chooses files, sends messages and clears the draft after success; the component never uploads or clears it automatically. The submit event receives { text, attachments }. Ctrl/Cmd+Enter submits on Web while Enter keeps its newline and IME composition is preserved. loading locks editing and actions. followKeyboard is opt-in for a dedicated overlay; leave it off inside a resizing Screen or Sheet to avoid duplicate adjustments. Web keyboard geometry is estimated; native timing is supplied by Jolt. Slots: default for supporting content. focus()/blur() target the editor.',
  },
  'speed-dial': {
    usage:
      '<MSpeedDial v-model:open="open" label="Create something"\n  :actions="actions" @select="handleAction" />',
    properties: [
      {
        name: 'label / actions',
        type: 'string / SpeedDialAction[]',
        defaultValue: 'required',
        description: 'Visible trigger and named actions.',
      },
      {
        name: 'open',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Controlled via v-model:open.',
      },
      {
        name: 'direction',
        type: 'up | down',
        defaultValue: 'up',
        description: 'Preferred opening direction.',
      },
      {
        name: 'disabled / icon / closeLabel',
        type: 'boolean / IconName / string',
        defaultValue: 'false / plus / Close actions',
        description: 'Trigger availability, artwork and explicit close action.',
      },
    ],
    behavior:
      'A controlled quick-action launcher using the existing Popover lifecycle. Actions have unique value, label, optional icon and disabled. Selection emits select(value, action) and requests closing. The application owns the action itself. Jolt animates the panel and sequential action entry; keyboard and focus behavior remain with Popover. Escape, outside dismissal and native back preserve the existing overlay rules. Direction chooses upward/downward preferred placement; Web fits the viewport. Native presentation uses the existing popover layer.',
  },
  'pin-input': {
    usage:
      '<MPinInput v-model="code" label="Verification code"\n  :length="6" autocomplete="one-time-code" @complete="checkCode" />',
    properties: [
      {
        name: 'modelValue / label',
        type: 'string',
        defaultValue: 'empty / required',
        description: 'Canonical numeric code and accessible editor name.',
      },
      {
        name: 'length',
        type: 'number',
        defaultValue: '6',
        description: 'Integer between 2 and 12.',
      },
      {
        name: 'disabled / readonly / required',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Input availability and Web form validation.',
      },
      {
        name: 'id / name / form',
        type: 'string',
        defaultValue: '—',
        description: 'Editor id and Web form association.',
      },
      {
        name: 'error / helperText',
        type: 'string',
        defaultValue: '—',
        description: 'Associated validation/help message.',
      },
    ],
    behavior:
      'One real editor beneath decorative cells preserves selection, paste and autofill. Numeric strings retain leading zeros; full-width digits and pasted separators are normalized. complete(value) fires after a user edit fills the code, not after a programmatic model update. It does not verify the code or perform authentication. Native autofill availability depends on the operating system and application setup. Web uses one-time-code, a single named form field and native pattern validation; focus()/blur() target that editor.',
  },
  'animated-text': {
    usage: '<MAnimatedText :text="headline" by="word"\n  :replayKey="take" variant="display" />',
    properties: [
      {
        name: 'text / variant / tone',
        type: 'string / typography / palette',
        defaultValue: 'required / title / default',
        description: 'Canonical text and shared typography.',
      },
      {
        name: 'by',
        type: 'word | letter',
        defaultValue: 'word',
        description: 'Animation segmentation.',
      },
      {
        name: 'duration / stagger / distance',
        type: 'number',
        defaultValue: '650 / 35 / 16',
        description: 'Milliseconds and vertical px/DIP; positive duration, nonnegative stagger.',
      },
      {
        name: 'animated / appear / replayKey',
        type: 'boolean / boolean / string or number',
        defaultValue: 'true / true / 0',
        description: 'Enable playback, entrance on attach and explicit replay.',
      },
    ],
    behavior:
      'Jolt owns word/letter entrance and replacement playback. Text is explicit, not rich slotted markup. The server renders readable canonical text; animation starts only after the renderer is ready. Updating text or replayKey replays the effect; replay() does the same. animated=false stops playback. Reduced motion follows the runtime policy. There is no automatic phrase timer or endless animation.',
  },
}
