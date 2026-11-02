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
    'number | auto | %',
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
  chip: {
    usage:
      '<m-chip v-model="design" selectable label="Design" icon="palette" />\n<m-chip label="Vue" removable removeLabel="Remover Vue" @remove="removeTag" />',
    properties: [
      prop(
        'label',
        'string',
        'obrigatório',
        'Texto visível e nome da ação de seleção; não pode ser vazio.',
      ),
      prop('icon', 'IconName', '—', 'Ícone decorativo, substituído pelo check quando selecionado.'),
      prop(
        'selectable / modelValue',
        'boolean / boolean',
        'false / false',
        'Ativa seleção controlada por v-model. Sem selectable, o rótulo é estático.',
      ),
      prop(
        'removable / removeLabel',
        'boolean / string',
        'false / —',
        'Ação separada de remoção. Exige nome contextual não vazio, como Remover Vue.',
      ),
      prop('tone', 'primary | accent', 'primary', 'Cor da seleção e do foco.'),
      prop(
        'disabled',
        'boolean',
        'false',
        'Bloqueia seleção e remoção, preservando o valor recebido.',
      ),
      prop(
        'width / grow / shrink',
        'dimensão / number / number',
        'auto / 0 / contexto',
        'Participação no layout.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'boolean',
        description: 'Solicita alternar a seleção. O pai aceita ou rejeita a mudança.',
      },
      {
        name: 'remove',
        payload: '—',
        description: 'Solicita remoção. Não altera seleção nem remove o componente sozinho.',
      },
    ],
    behavior:
      'Seleção e remoção são alvos irmãos. Use Row com wrap para coleções. Na Web, Tab alcança cada ação; Enter/Espaço a ativam. O app cuida da coleção e do foco após remover um item. Press usa Jolt no nativo e CSS na Web, respeitando movimento reduzido.',
  },
  'empty-state': {
    usage:
      '<m-empty-state title="Nada salvo ainda."\n  description="Guarde uma leitura para depois." icon="bookmark">\n  <template #actions>\n    <m-button @click="explore">Explorar</m-button>\n  </template>\n</m-empty-state>',
    properties: [
      prop('title', 'string', 'obrigatório', 'Título não vazio; cresce com o conteúdo.'),
      prop('description', 'string', 'vazio', 'Contexto e orientação opcional.'),
      prop('icon', 'IconName', 'inbox', 'Símbolo da ilustração padrão.'),
      prop('tone', 'primary | accent', 'primary', 'Cor da ilustração.'),
      prop('compact', 'boolean', 'false', 'Reduz ilustração, título e espaços; sem altura fixa.'),
      prop(
        'titleAs',
        'h1 | h2 | h3 | h4 | h5 | h6',
        'h2',
        'Nível do título na Web; no nativo continua um cabeçalho.',
      ),
      prop(
        'width / grow / shrink',
        'dimensão / number / number',
        'auto / 0 / contexto',
        'Participação no layout.',
      ),
    ],
    behavior:
      'illustration substitui a arte padrão e é sempre decorativo; coloque ações no slot actions. O app decide quando mostrar, buscar ou recuperar. Não toma foco, anuncia mudanças ou inicia animação automaticamente. Sem eventos próprios.',
  },
  accordion: {
    usage:
      '<m-accordion v-model="expanded"\n  :items="questions" label="Ajuda"\n  expandedLabel="Expandido" collapsedLabel="Recolhido">\n  <template #default="{ item }">\n    <m-text>{{ answers[item.value] }}</m-text>\n  </template>\n</m-accordion>',
    properties: [
      prop(
        'items',
        'readonly AccordionItem[]',
        'obrigatório',
        'value único (string ou número), title, description?, icon? e disabled?.',
      ),
      prop(
        'modelValue',
        'readonly ChoiceValue[]',
        '[]',
        'Valores abertos. Sempre um array, inclusive no modo simples.',
      ),
      prop('multiple', 'boolean', 'false', 'Permite manter várias seções abertas.'),
      prop('label', 'string', 'obrigatório', 'Nome acessível do grupo.'),
      prop(
        'expandedLabel / collapsedLabel',
        'string',
        'Expanded / Collapsed',
        'Estado acessível nativo. Traduza no app.',
      ),
      prop(
        'disabled',
        'boolean',
        'false',
        'Bloqueia cabeçalhos; não desabilita os controles do conteúdo.',
      ),
      prop(
        'width / grow / shrink',
        'dimensão / number / number',
        'auto / 0 / contexto',
        'Participação no layout.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'ChoiceValue[]',
        description: 'Pede a nova lista de valores abertos, sem alterar o array recebido.',
      },
    ],
    behavior:
      'O slot padrão recebe { item }. O corpo monta ao abrir e desmonta após a saída do Reveal; guarde dados persistentes no pai. Não há animação de altura. No modo simples, mais de um valor aberto lança RangeError. Valores ausentes dos items não abrem um corpo nem alteram o model. Na Web, setas verticais, Home e End movem o foco entre cabeçalhos; Enter/Espaço alternam a seção.',
  },
  'segmented-control': {
    usage:
      "<m-segmented-control v-model=\"period\"\n  label=\"Período\" :options=\"[\n    { value: 'day', label: 'Dia' },\n    { value: 'week', label: 'Semana' },\n    { value: 'month', label: 'Mês' }\n  ]\" />",
    properties: [
      prop(
        'options',
        'readonly SegmentedOption[]',
        'obrigatório',
        'value único (string ou número), label e disabled? por opção.',
      ),
      prop(
        'modelValue',
        'ChoiceValue | null',
        'null',
        'Valor selecionado. null ou valor ausente deixa o grupo sem marcador.',
      ),
      prop(
        'label',
        'string',
        'obrigatório',
        'Nome acessível do grupo, sem rótulo visual automático.',
      ),
      prop('disabled', 'boolean', 'false', 'Bloqueia todas as opções.'),
      prop(
        'width / grow / shrink',
        'dimensão / number / number',
        'auto / 0 / contexto',
        'Participação no layout.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'ChoiceValue',
        description: 'Pede uma opção habilitada diferente da atual.',
      },
    ],
    behavior:
      'Segmentos de largura igual, rótulos com quebra natural e indicador animado com Jolt no nativo/CSS na Web. Prefira 2–4 opções curtas. O app controla o valor e o conteúdo relacionado; não há painéis nem navegação embutida. Na Web, Tab entra uma vez e setas/Home/End focam e pedem seleção, pulando desabilitados. Respeita movimento reduzido.',
  },
  'list-item': {
    usage: `<m-list-item title="Marina Costa" description="Design · São Paulo" interactive @click="openMember">
  <template #leading><m-avatar name="Marina Costa" :accessibilityHidden="true" /></template>
</m-list-item>`,
    properties: [
      prop('title', 'string', 'obrigatório', 'Título não vazio; quebra linha.'),
      prop('description', 'string', "''", 'Texto secundário opcional.'),
      prop('interactive', 'boolean', 'false', 'Uma ação sobre a linha inteira.'),
      prop('disabled', 'boolean', 'false', 'Bloqueia somente a ação da linha interativa.'),
      prop(
        'width / grow / shrink',
        'dimension / number / number',
        'auto / 0 / contexto',
        'Participação no layout.',
      ),
      prop(
        'accessibilityLabel',
        'string',
        'título + descrição',
        'Nome interativo; inclua informação relevante dos slots.',
      ),
      prop('accessibilityHidden', 'boolean', 'false', 'Oculta conteúdo redundante.'),
      prop('id', 'string', '—', 'Identificador opcional.'),
    ],
    events: [
      { name: 'click', payload: 'none', description: 'Linha interativa habilitada ativada.' },
    ],
    behavior:
      'Slots leading e trailing para conteúdo compacto. Sem slot padrão. Linha interativa sem trailing mostra seta; não aninhe controles nesse modo. Linha informativa preserva seus filhos e aceita botão independente. Altura natural, superfície do tema, padding/radius md, sem borda. Sem coleção virtualizada, seleção ou navegação própria.',
  },
  separator: {
    usage: `<m-column>
  <m-list-item title="Design" />
  <m-separator inset="md" />
  <m-list-item title="Engenharia" />
</m-column>`,
    properties: [
      prop('orientation', 'horizontal | vertical', 'horizontal', 'Eixo da linha.'),
      prop('length', 'number', 'automático', 'Comprimento da linha em DIP/px, sem margens.'),
      prop('spacing', 'token | number', 'none', 'Margem de cada lado perpendicular à linha.'),
      prop('inset', 'token | number', 'none', 'Recuo de cada ponta da linha.'),
      prop('id', 'string', '—', 'Identificador opcional.'),
    ],
    behavior:
      'Linha decorativa de 1 DIP/px na cor border, sem conteúdo, foco, eventos ou semântica de grupo. Automática em Column horizontal ou Row vertical, sem wrap; fora desses contextos, forneça length. Length explícito é centralizado. Valores negativos ou não finitos são rejeitados.',
  },
  avatar: {
    usage: `<m-row gap="md">
  <m-avatar name="Marina Costa" size="lg" />
  <m-badge text="Criadora" tone="accent" />
</m-row>`,
    properties: [
      prop(
        'src',
        'string',
        "''",
        'Fonte de imagem conforme a plataforma; ausente ou inválida mantém o fallback.',
      ),
      prop(
        'name',
        'string',
        "''",
        'Primeira e última iniciais; nome acessível padrão. Sem nome, ícone user-round.',
      ),
      prop('size', 'sm | md | lg | xl', 'md', '32, 48, 64 ou 96 DIP/px.'),
      prop('shape', 'circle | square', 'circle', 'Círculo ou quadrado com cantos arredondados.'),
      prop('accessibilityLabel', 'string', 'name', 'Substitui o nome anunciado.'),
      prop(
        'accessibilityHidden',
        'boolean',
        'false',
        'Oculta identidade redundante com texto próximo.',
      ),
      prop('id', 'string', '—', 'Identificador opcional.'),
    ],
    behavior:
      'Imagem com recorte central, iniciais durante carregamento/erro e ícone sem nome. Trocar src restaura o fallback e ignora resultados antigos. Sem upload, ação ou retry automático. Dimensão e marca visual fixas; forneça o nome ao lado para texto ampliável.',
  },
  badge: {
    usage: `<m-row gap="sm" wrap>
  <m-badge text="Publicado" tone="success" />
  <m-badge :text="0" tone="accent" accessibilityLabel="0 mensagens não lidas" />
</m-row>`,
    properties: [
      prop('text', 'string | number', 'obrigatório', 'Conteúdo do badge, incluindo zero.'),
      prop(
        'tone',
        'neutral | primary | accent | success | warning | danger',
        'neutral',
        'Cores semânticas do tema.',
      ),
      prop('size', 'sm | md', 'md', 'Escala de texto e espaçamento; altura acompanha o conteúdo.'),
      prop('accessibilityLabel', 'string', '—', 'Descreve contadores no contexto.'),
      prop('accessibilityHidden', 'boolean', 'false', 'Oculta conteúdo redundante.'),
      prop('id', 'string', '—', 'Identificador opcional.'),
    ],
    behavior:
      'Informação sem ação, foco, slots ou anúncio automático. O app controla valores, tradução e formatação, como 99+. Texto longo quebra linha; use Row com wrap para grupos. Não dependa apenas da cor para transmitir significado.',
  },
  progress: {
    usage: `<m-progress :value="64" label="Download da coleção" tone="accent" />
<m-progress indeterminate label="Preparando coleção" indeterminateLabel="Preparando" />`,
    properties: [
      prop(
        'value / max',
        'number',
        '0 / 100',
        'Valor finito limitado entre zero e max. max precisa ser finito e positivo.',
      ),
      prop('label', 'string', 'obrigatório', 'Nome acessível; não desenha um rótulo visível.'),
      prop(
        'indeterminate',
        'boolean',
        'false',
        'Segmento em movimento para tarefas sem total conhecido.',
      ),
      prop(
        'indeterminateLabel',
        'string',
        'Loading',
        'Descrição acessível do estado indeterminado. Traduza no app.',
      ),
      prop('size', 'sm | md | lg', 'md', 'Espessuras de 4, 8 e 12 DIP/px.'),
      prop(
        'tone',
        'primary | accent | success | warning | danger',
        'primary',
        'Cor de preenchimento do tema.',
      ),
      prop(
        'width / grow / shrink',
        'dimension / number / number',
        'auto / 0 / contexto',
        'Participação no layout, como Box.',
      ),
      prop(
        'id / accessibilityHidden',
        'string / boolean',
        '— / false',
        'Identificador e exclusão da árvore acessível.',
      ),
    ],
    behavior:
      'Indicador linear sem slots ou eventos. O app fornece valor, mensagem e estado da tarefa. Valores conhecidos mudam diretamente; o segmento indeterminado usa Jolt no nativo e CSS na Web. Movimento reduzido mantém o segmento parado no centro. Pausa em segundo plano; libera animações e listeners no unload/unmount.',
  },
  alert: {
    usage: `<m-alert v-if="visible" title="Não foi possível baixar" description="Confira a conexão e tente novamente." tone="error" dismissible closeLabel="Fechar aviso" @close="visible = false">
  <template #actions><m-button @click="retry">Tentar novamente</m-button></template>
</m-alert>`,
    properties: [
      prop('title', 'string', 'obrigatório', 'Título não vazio do aviso.'),
      prop('description', 'string', "''", 'Texto complementar opcional.'),
      prop('tone', 'info | success | warning | error', 'info', 'Ícone e cor semântica do aviso.'),
      prop(
        'dismissible',
        'boolean',
        'false',
        'Mostra a ação de fechar. A remoção pertence ao app.',
      ),
      prop(
        'closeLabel',
        'string',
        'Dismiss message',
        'Nome acessível da ação de fechar. Traduza no app.',
      ),
      prop(
        'announce',
        'boolean',
        'false',
        'Anúncio opcional de mensagens dinâmicas, sem mover o foco.',
      ),
      prop(
        'width / grow / shrink',
        'dimension / number / number',
        'auto / 0 / contexto',
        'Participação no layout, como Column.',
      ),
      prop(
        'id / accessibilityHidden',
        'string / boolean',
        '— / false',
        'Identificador e exclusão da árvore acessível.',
      ),
    ],
    events: [
      {
        name: 'close',
        payload: '—',
        description: 'Solicita fechar. Use v-if ou o estado do app para remover o aviso.',
      },
    ],
    behavior:
      'Aviso persistente no fluxo da tela, sem timer, fila, overlay ou captura de foco. Slot actions para botões independentes; não há slot default. Título e descrição são lidos juntos no nativo. announce cria uma região status/alert na Web e solicita anúncio nativo quando carregado; a fala depende do leitor de tela.',
  },
  skeleton: {
    usage: `<m-column gap="md">
  <m-text>Carregando perfil…</m-text>
  <m-row gap="md">
    <m-skeleton :width="48" :height="48" radius="full" :shrink="0" />
    <m-column :width="0" :grow="1" gap="sm">
      <m-skeleton width="70%" />
      <m-skeleton width="45%" :height="12" />
    </m-column>
  </m-row>
</m-column>`,
    properties: [
      prop(
        'width',
        'number | % | auto',
        'auto',
        'Preenche a largura da Column por padrão. Use dimensões iguais com radius=full para um círculo.',
      ),
      prop(
        'height',
        'number | % | auto',
        '16',
        'Altura do bloco. Porcentagens precisam de um pai com altura definida.',
      ),
      prop('radius', 'token | number', 'sm', 'Arredondamento dos cantos.'),
      prop(
        'animated',
        'boolean',
        'true',
        'Pulso discreto. Movimento reduzido mantém o bloco estático.',
      ),
      prop('grow / shrink', 'number', '0 / contexto', 'Participação no layout, como Box.'),
      prop('id', 'string', '—', 'Identificador opcional.'),
    ],
    behavior:
      'Bloco decorativo, sem foco, eventos ou conteúdo. O app controla carregamento, dados e mensagem de estado. Cor border do tema; Jolt no nativo e CSS na Web. Animação suspensa em segundo plano e liberada no unload/unmount. Remova os placeholders quando a resposta chegar.',
  },
  tabs: {
    usage: `<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceValue } from '@getcortexlabs/mavis-core'
const active = ref<ChoiceValue | null>('profile')
const tabs = [
  { value: 'profile', label: 'Perfil' },
  { value: 'activity', label: 'Atividade' },
]
</script>
<template>
  <m-tabs v-model="active" :tabs="tabs" label="Seu espaço">
    <template #default="{ value }">
      <m-text v-if="value === 'profile'">Sobre você.</m-text>
      <m-text v-else>Suas últimas novidades.</m-text>
    </template>
  </m-tabs>
</template>`,
    properties: [
      prop(
        'modelValue',
        'string | number | null',
        'null',
        'Aba selecionada. Use v-model e inicialize o valor no app.',
      ),
      prop(
        'tabs',
        'readonly TabOption[]',
        'obrigatório',
        'Itens com value único, label não vazio e disabled opcional. Número e string são distintos.',
      ),
      prop('label', 'string', 'obrigatório', 'Nome não vazio do conjunto de abas.'),
      prop(
        'disabled',
        'boolean',
        'false',
        'Impede ativação pelo usuário; alterações externas ainda são aplicadas.',
      ),
      prop('id', 'string', 'omitido', 'Identificador do componente.'),
      prop(
        'width / grow / shrink',
        'Dimension / number',
        'auto / 0 / contexto',
        'Tamanho e participação no layout do contêiner.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'string | number',
        description: 'Uma ativação habilitada e diferente solicita mudança; o pai pode rejeitar.',
      },
    ],
    behavior:
      'Slot default recebe { value }. Só o painel ativo é montado; mudar de aba desmonta o anterior. Guarde no app os dados que precisam permanecer. Null ou valor removido deixa a barra sem painel e não escolhe outra aba. Barra horizontal rolável, indicador Jolt no nativo e CSS na Web. Na Web, setas/Home/End movem foco; Enter/Espaço ativam. Não altera rotas nem troca painéis por swipe.',
  },
  dialog: {
    usage: `<script setup lang="ts">
import { ref } from 'vue'
const open = ref(false)
function remove() {
  // Execute a ação e feche quando terminar.
  open.value = false
}
</script>
<template>
  <m-screen>
    <m-button @click="open = true">Excluir coleção</m-button>
    <m-dialog v-model:open="open" title="Excluir coleção?"
      description="Esta ação não pode ser desfeita." tone="danger"
      confirmLabel="Excluir" cancelLabel="Manter" @confirm="remove" />
  </m-screen>
</template>`,
    properties: [
      prop('open', 'boolean', 'false', 'Estado controlado por v-model:open.'),
      prop('title', 'string', 'obrigatório', 'Título não vazio, usado como nome acessível.'),
      prop('description', 'string', 'omitido', 'Consequência da ação, em texto simples.'),
      prop('tone', 'default | danger', 'default', 'Ênfase do ícone e da confirmação.'),
      prop(
        'confirmLabel / cancelLabel',
        'string',
        'Continue / Cancel',
        'Rótulos não vazios. Traduza no app.',
      ),
      prop(
        'loading',
        'boolean',
        'false',
        'Bloqueia ações e fechamento incidental durante o processamento.',
      ),
      prop('loadingLabel', 'string', 'Working…', 'Texto não vazio durante o processamento.'),
      prop(
        'dismissible',
        'boolean',
        'true',
        'Permite fundo, Escape e voltar. Cancelar continua disponível.',
      ),
      prop('id', 'string', 'omitido', 'Identificador da superfície modal.'),
    ],
    events: [
      {
        name: 'confirm',
        payload: 'nenhum',
        description: 'Solicita a ação. O app decide quando fechar.',
      },
      {
        name: 'update:open',
        payload: 'false',
        description: 'Solicita fechamento por cancelamento ou navegação.',
      },
      {
        name: 'close',
        payload: 'DialogCloseReason',
        description:
          'cancel, backdrop, escape, back, program ou navigation; emitido antes da saída terminar.',
      },
    ],
    behavior:
      'Declare dentro de MScreen no nativo. Uma decisão por vez, sem slots ou modais aninhados. A confirmação não fecha sozinha; loading permite processar e tentar novamente após erro. Web contém e devolve foco; Android trata voltar. Navegar libera a camada; segundo plano preserva o estado. Toast aguarda o modal. Texto longo rola dentro da superfície.',
  },
  toast: {
    usage: `<script setup lang="ts">
import { useToast } from '@getcortexlabs/mavis-core/vue'
const toast = useToast()
const saved = () => toast.show({
  title: 'Perfil salvo',
  message: 'Tudo no lugar.',
  tone: 'success',
})
</script>

<template>
  <MScreen>
    <MButton @click="saved">Salvar</MButton>
    <MToast :controller="toast" closeLabel="Fechar aviso" />
  </MScreen>
</template>`,
    properties: [
      prop(
        'controller',
        'ToastController',
        'obrigatório',
        'Fila criada por useToast(). Um host por fila, dentro da Screen nativa.',
      ),
      prop(
        'closeLabel',
        'string',
        'Dismiss notification',
        'Nome acessível do botão de fechar; traduza no app.',
      ),
      prop(
        'show({ message, title?, tone?, duration? })',
        'método do controller',
        '—',
        'Enfileira um aviso e retorna seu ID. message é obrigatório; title é opcional.',
      ),
      prop('tone', 'success | error | warning | info', 'info', 'Ícone e cor semântica do aviso.'),
      prop(
        'duration',
        'number',
        '5000',
        'Milissegundos depois da entrada. Zero mantém o aviso até fechar.',
      ),
      prop(
        'dismiss(id?) / clear()',
        'métodos do controller',
        '—',
        'Fecha o atual ou remove um ID; clear também descarta a fila pendente.',
      ),
    ],
    behavior:
      'Um aviso por vez, no topo, sem bloquear a tela ou roubar foco. A fila é local ao escopo Vue. Sheet tem prioridade e pausa o tempo; sair da página limpa os avisos. A Web pausa também em hover/foco e aba oculta. Sem ações, swipe ou mensagens globais nesta versão.',
  },
  select: {
    usage: `<MSelect
  v-model="interest"
  label="Seu universo"
  placeholder="Escolha um interesse"
  closeLabel="Fechar"
  :options="[
    { value: 'design', label: 'Design' },
    { value: 'photo', label: 'Fotografia' },
  ]"
/>`,
    properties: [
      prop(
        'modelValue / v-model',
        'string | number | null',
        'null',
        'Escolha controlada; null exibe o placeholder.',
      ),
      prop(
        'options',
        'readonly ChoiceOption[]',
        'obrigatório',
        'Mesmo contrato de Radio: value único, label, helperText e disabled opcionais.',
      ),
      prop('label', 'string', 'obrigatório', 'Rótulo visível do campo e título da lista.'),
      prop(
        'placeholder',
        'string',
        'Select an option',
        'Texto quando o valor não corresponde a uma opção.',
      ),
      prop(
        'helperText / error',
        'string',
        "''",
        'Mensagem abaixo do campo. error tem precedência e pinta a borda.',
      ),
      prop('disabled', 'boolean', 'false', 'Impede abertura e fecha a lista sem alterar o valor.'),
      prop(
        'closeLabel',
        'string',
        'Close',
        'Nome acessível do botão de fechar. Traduza com os rótulos.',
      ),
      prop('emptyText', 'string', 'No options available', 'Mensagem na lista vazia.'),
      prop(
        'width / grow / shrink',
        'dimension / number',
        'auto / 0 / contexto',
        'Dimensão e distribuição do campo.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'string | number',
        description:
          'Uma solicitação por escolha habilitada diferente. Abrir, cancelar, repetir e limpar externamente não emitem.',
      },
    ],
    behavior:
      'A seleção fecha a lista imediatamente; o pai mantém a decisão final. Para limpar, atribua null. Opções mudam ao vivo: remoção não escolhe um substituto, disabled não ativa. Web usa diálogo/listbox com setas, Home/End, letras, Enter/Espaço, Escape e retorno de foco. No nativo, declare dentro de MScreen e integre claimSystemBack com o router, como no Sheet. Lista local, sem busca ou virtualização.',
  },
  radio: {
    usage: `<MRadioGroup
  v-model="rhythm"
  label="Ritmo de leitura"
  :options="[
    { value: 'weekly', label: 'Sem pressa' },
    { value: 'daily', label: 'Um pouco por dia' },
  ]"
/>`,
    properties: [
      prop(
        'modelValue / v-model',
        'string | number | null',
        'null',
        'Escolha controlada. null representa nenhuma seleção.',
      ),
      prop(
        'options',
        'readonly ChoiceOption[]',
        'obrigatório',
        'Opções com value único, label, helperText e disabled opcionais.',
      ),
      prop('label', 'string', 'obrigatório', 'Rótulo visível do grupo.'),
      prop('helperText', 'string', "''", 'Explicação opcional do grupo.'),
      prop('disabled', 'boolean', 'false', 'Desabilita todas as opções sem mudar o valor.'),
      prop(
        'width / grow / shrink',
        'dimension / number',
        'auto / 0 / contexto',
        'Distribuição do grupo no layout.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'string | number',
        description:
          'Solicita uma opção habilitada diferente da atual. Não emite null nem repete a seleção.',
      },
    ],
    behavior:
      'O app mantém o valor. Remover a opção selecionada deixa todas desmarcadas; desabilitá-la preserva a marca. Nenhum desses casos emite ou escolhe outra opção. Na Web, Tab entra uma vez no grupo; setas percorrem opções habilitadas, Home/End vão à primeira/última e Espaço seleciona. Arrays, validação e envio pertencem ao app.',
  },
  checkbox: {
    usage:
      '<MCheckbox\n  v-model="selected"\n  v-model:indeterminate="mixed"\n  label="Todos os assuntos"\n  indeterminateLabel="Seleção parcial"\n/>',
    properties: [
      prop('modelValue / v-model', 'boolean', 'false', 'Valor marcado, controlado pelo app.'),
      prop(
        'indeterminate',
        'boolean',
        'false',
        'Estado visual parcial, com precedência sobre modelValue.',
      ),
      prop('label', 'string', 'obrigatório', 'Rótulo visível e nome acessível.'),
      prop('helperText', 'string', "''", 'Explicação opcional abaixo do rótulo.'),
      prop(
        'indeterminateLabel',
        'string',
        'Partially selected',
        'Descrição acessível do estado parcial. Traduza junto com o rótulo.',
      ),
      prop('disabled', 'boolean', 'false', 'Impede ativação pelo rótulo, marca e teclado.'),
      prop(
        'width / grow / shrink',
        'dimension / number',
        'auto / 0 / contexto',
        'Dimensão e distribuição de espaço da linha.',
      ),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'boolean',
        description: 'Uma proposta por ativação. Parcial solicita true; caso contrário, alterna.',
      },
      {
        name: 'update:indeterminate',
        payload: 'false',
        description: 'Solicita limpar o parcial antes de emitir o novo valor marcado.',
      },
    ],
    behavior:
      'A linha inteira ativa o controle. O app aceita os eventos ou mantém os valores anteriores. Mudanças externas não emitem. Arrays, selecionar todos e validação pertencem ao app. Na Web, Espaço alterna o checkbox; no nativo, a superfície usa um botão com semântica de checkbox e feedback Jolt na marca.',
  },
  switch: {
    usage:
      '<MSwitch\n  v-model="notifications"\n  label="Notificações"\n  helperText="Novidades de quem você acompanha."\n/>',
    properties: [
      prop('modelValue / v-model', 'boolean', 'false', 'Preferência controlada pela aplicação.'),
      prop('label', 'string', 'obrigatório', 'Rótulo visível e nome acessível do controle.'),
      prop('helperText', 'string', "''", 'Detalhe opcional abaixo do rótulo.'),
      prop('disabled', 'boolean', 'false', 'Impede ativação pelo rótulo e pelo controle.'),
      prop('width', 'number | auto | %', 'auto', 'Largura da linha completa.'),
      prop('grow / shrink', 'number', '0 / contexto', 'Distribuição de espaço no layout pai.'),
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'boolean',
        description: 'Uma mudança por ativação; alterações externas não emitem.',
      },
    ],
    behavior:
      'Toque no rótulo ou no controle. Na Web, Espaço e Enter alternam o valor. O app aceita a mudança atualizando o v-model; sem isso, o valor anterior é mantido. O controle nativo preserva os gestos e a animação do sistema; o rótulo tem feedback Jolt. Não coloque links ou outros controles dentro do rótulo.',
  },
  input: {
    usage:
      '<m-input\n  v-model="name"\n  label="Nome"\n  placeholder="Como podemos chamar você?"\n  helperText="Seu nome, do seu jeito."\n/>',
    properties: [
      prop(
        'trailingAction',
        'InputAction { icon, label, disabled? }',
        'nenhuma',
        'Ação com alvo de 48 pontos e nome obrigatório. Emite action; disabled/readonly bloqueiam a ação. Não combinar com trailingIcon.',
      ),
      prop(
        'modelValue / v-model',
        'string',
        "''",
        'Texto controlado pela aplicação, sem conversão numérica.',
      ),
      prop('label', 'string', 'obrigatório', 'Rótulo visível e nome acessível do editor.'),
      prop('placeholder', 'string', "''", 'Dica dentro do campo vazio. Não substitui o label.'),
      prop('helperText', 'string', "''", 'Orientação exibida abaixo do campo.'),
      prop(
        'error',
        'string',
        "''",
        'Mensagem de erro; substitui a ajuda e marca o campo como inválido.',
      ),
      prop(
        'type',
        'text | email | password | tel | url | search',
        'text',
        'Tipo de edição e sugestão de teclado. Na Web, email/URL participam da validação HTML.',
      ),
      prop(
        'name / autocomplete / form',
        'string',
        'não definido',
        'Somente Web: nome no envio, preenchimento e ID do formulário.',
      ),
      prop('required', 'boolean', 'false', 'Somente Web: validação HTML de campo obrigatório.'),
      prop(
        'inputmode',
        'none | text | decimal | numeric | tel | search | email | url',
        'não definido',
        'Somente Web: sugestão de teclado virtual.',
      ),
      prop(
        'disabled / readonly',
        'boolean',
        'false',
        'Impedem edição. Disabled também impede foco e interação.',
      ),
      prop(
        'multiline',
        'boolean',
        'false',
        'Permite novas linhas com type="text". Enter não emite submit.',
      ),
      prop(
        'rows',
        'number',
        '3',
        'Inteiro positivo. Define a altura mínima aproximada do campo multilinha, que cresce com o conteúdo.',
      ),
      prop(
        'maxLength',
        'number',
        'sem limite',
        'Inteiro não negativo. Limita novas edições em unidades UTF-16, sem cortar um modelo externo.',
      ),
      prop(
        'icon / trailingIcon',
        'IconName',
        'nenhum',
        'Ícones Lucide decorativos dentro da caixa do editor, em tom muted ou danger com erro.',
      ),
      prop(
        'autocapitalize',
        'none | sentences | words | characters',
        'sentences / none',
        'Sentences em text/search; none nos demais tipos. O teclado pode ignorar a sugestão.',
      ),
      prop(
        'autocorrect',
        'boolean',
        'true / false',
        'Ativo em text/search; desativado nos demais tipos.',
      ),
      prop(
        'returnKey',
        'done | next | go | search | send',
        'done',
        'Sugere a ação do teclado de uma linha. A aplicação trata submit e move ou remove o foco.',
      ),
      prop(
        'width / grow / shrink',
        'dimension / number',
        'auto / 0 / contexto',
        'Dimensionam o conjunto de rótulo, editor e mensagem.',
      ),
      prop(
        'id',
        'string',
        'automático na Web',
        'Identifica o editor. Class e style afetam o contêiner.',
      ),
    ],
    events: [
      {
        name: 'action',
        payload: 'nenhum',
        description:
          'Ativação da ação final; o app altera valor/tipo. Mantém o foco da edição e não envia formulários.',
      },
      {
        name: 'update:modelValue',
        payload: 'string',
        description: 'Texto completo da edição, incluindo valores intermediários do IME.',
      },
      {
        name: 'focus / blur',
        payload: 'nenhum',
        description: 'Entrada e saída do foco de edição.',
      },
      {
        name: 'submit',
        payload: 'string',
        description:
          'Ação do teclado em um campo de uma linha; não encerra o foco automaticamente.',
      },
    ],
    behavior:
      'Uma ref expõe focus() e blur(), com InputHandle, InstanceType ou useTemplateRef. Na Web, atributos ARIA e eventos de edição chegam ao editor; class/style ficam no contêiner. Sem @submit no Input, Enter segue o formulário HTML. Com @submit, o handler assume a ação. O modelo controla o reset: trate @reset.prevent no formulário. Validação da aplicação e persistência pertencem ao app. Não formate o v-model a cada tecla: isso pode interromper composição e seleção. No nativo, readonly não abre o teclado; seleção/cópia dependem da plataforma. Use dentro de Screen com scroll para acompanhar o teclado.',
  },
  button: {
    usage: '<m-button\n  variant="primary"\n  @click="save"\n>\n  Salvar\n</m-button>',
    properties: [
      prop(
        'motionSurface',
        'MotionSurface (experimental)',
        'não definido',
        'Referência criada por createMotionSurface(); disponível após montar/carregar. Compartilha animação do app e preserva a camada de press. Veja o guia de movimento.',
      ),
      prop(
        'type',
        'button | submit | reset',
        'button',
        'Somente Web: ação HTML. Loading e disabled bloqueiam envio e reset.',
      ),
      prop(
        'name / value / form',
        'string',
        'não definido',
        'Somente Web: nome/valor do botão de envio e ID do formulário.',
      ),
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
        'icon / trailingIcon',
        'IconName',
        'nenhum',
        'Ícone Lucide antes ou depois do texto, no tamanho do botão. Um botão só com ícone exige accessibilityLabel.',
      ),
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
      'O slot aceita texto simples ou interpolado. Declare save no seu componente. O Jolt anima a pressão nos dois renderizadores; na Web, Enter e Espaço ativam o botão e loading preserva o foco do teclado.',
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
      'Todos os números precisam ser finitos. O último passo alcança max mesmo quando a faixa não é divisível por step. VoiceOver e TalkBack usam os valores reais da faixa e avançam um passo por ajuste. Na Web, use as setas, Home e End.',
  },
  card: {
    usage:
      '<m-card\n  interactive\n  accessibilityLabel="Abrir coleção"\n  @click="openCollection"\n>\n  <m-text>Minha coleção</m-text>\n</m-card>',
    properties: [
      prop('gap', 'token | number', 'none', 'Espaço entre os elementos do cartão.'),
      prop('padding', 'token | number', 'tema (lg)', 'Espaço entre o conteúdo e a borda.'),
      prop(
        'elevation',
        'none | sm | md | lg',
        'tema (none)',
        'Sombra decorativa do tema, sem alterar o empilhamento.',
      ),
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
      'Um cartão comum agrupa conteúdo. Um cartão interativo com accessibilityLabel representa uma única ação; seus descendentes Mavis não criam paradas de leitura. Não coloque botões, links ou campos dentro dele. Declare openCollection no seu componente.',
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
      prop(
        'weight',
        'normal | bold | 100 … 900 (strings)',
        'tema',
        'Altera o peso sem mudar o tamanho da variante.',
      ),
      prop(
        'MSpan',
        'text / weight / tone / emphasis',
        'nenhum',
        'Trechos dentro do mesmo texto; emphasis strong ou em. Não aceita views nem eventos.',
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
      'Use as para títulos acessíveis e variant para sua aparência. O slot aceita texto e MSpan com ênfase, peso e tom. Os trechos preservam a leitura e escala do sistema dentro de um único texto. Outras views usam layouts.',
  },
  icon: {
    usage:
      '<m-row gap="sm" align="center">\n  <m-icon name="search" tone="muted" />\n  <m-text>Buscar</m-text>\n</m-row>\n<m-icon name="circle-check"\n  tone="success" label="Concluído" />',
    properties: [
      prop(
        'name',
        'IconName',
        'obrigatório',
        'Nome do ícone Lucide, como search ou circle-check. Nomes desconhecidos lançam RangeError.',
      ),
      prop('size', 'sm | md | lg | number', 'md', '16, 20 ou 24 pontos, ou um número positivo.'),
      prop('tone', 'cor do tema', 'text', 'Cor da paleta, como primary, muted ou danger.'),
      prop(
        'label',
        'string',
        'nenhum',
        'Nome acessível. Sem label, o ícone é decorativo e fica oculto para leitores de tela.',
      ),
      prop('id', 'string', 'nenhum', 'Identifica o ícone renderizado.'),
    ],
    behavior:
      'Renderiza um glifo da fonte Lucide embutida nos pacotes. No NativeScript, copie fonts/lucide.ttf do pacote para a pasta fonts do app; na Web, o style.css carrega a fonte. O ícone mantém o tamanho dentro de Rows e centraliza ao lado do texto. Combine com um texto que carregue o significado; use label só quando o ícone fica sozinho.',
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
        'number | auto | %',
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
    properties: [
      prop('scroll', 'boolean', 'false', 'Habilita a rolagem vertical do conteúdo.'),
      prop(
        'dismissKeyboard',
        'boolean',
        'true',
        'Fecha o teclado ao tocar fora do editor e, com scroll, ao arrastar o conteúdo em direção a ele.',
      ),
    ],
    behavior:
      'Use uma Screen por página. Com scroll, a área de rolagem nativa respeita as safe areas; no iOS, acomoda o teclado. No Android, o app usa adjustResize. Um toque fora do editor, inclusive em um botão, fecha o teclado; o toque chega ao controle normalmente. Na Web, acompanha a área visível e preserva o foco após redimensionamento. Navegação e estado pertencem ao app; não aninhe Screens.',
  },
  sheet: {
    usage:
      '<m-button @click="open = true">Filtros</m-button>\n<m-sheet v-model:open="open" title="Filtros"\n  closeLabel="Fechar" @close="registrar">\n  <m-text>Conteúdo da sheet.</m-text>\n  <m-button @click="open = false">Aplicar</m-button>\n</m-sheet>',
    properties: [
      prop('open', 'boolean', 'false', 'Apresenta ou recolhe a sheet. Use v-model:open.'),
      prop(
        'accessibilityLabel',
        'string',
        'nenhum',
        'Nome alternativo sem cabeçalho quando title está ausente ou em branco. Um nome válido é obrigatório mesmo com open=false.',
      ),
      prop(
        'title',
        'string',
        'nenhum',
        'Cabeçalho e nome acessível, sem espaços nas extremidades. Sem título não vazio, accessibilityLabel é obrigatório.',
      ),
      prop(
        'dismissible',
        'boolean',
        'true',
        'Permite fechar pelo fundo, Escape, voltar, arrasto e botão de fechar. Lido ao abrir.',
      ),
      prop('fullscreen', 'boolean', 'false', 'Ocupa a altura útil em vez da altura do conteúdo.'),
      prop('closeLabel', 'string', 'Close', 'Nome acessível do botão de fechar.'),
      prop('padding', 'token | number', 'lg', 'Espaço interno do painel.'),
      prop('gap', 'token | number', 'none', 'Espaço entre os filhos do conteúdo.'),
      prop(
        'align',
        'start | center | end | stretch',
        'stretch',
        'Alinhamento horizontal do conteúdo.',
      ),
      prop('id', 'string', 'nenhum', 'Identifica o painel renderizado.'),
    ],
    events: [
      { name: 'update:open', payload: 'boolean', description: 'Pedido para abrir ou fechar.' },
      {
        name: 'close',
        payload: 'button | backdrop | escape | back | swipe | program',
        description: 'Motivo de cada fechamento, emitido ao pedir o fechamento.',
      },
    ],
    behavior:
      'No NativeScript a sheet é um painel na própria página, acima do conteúdo da Screen, movido pelo bottom sheet do Jolt: alça arrastável, snap na altura do conteúdo ou 100%, fundo escurecido, acompanhamento do teclado e voltar do Android. Na Web usa <dialog> modal: Escape, clique no fundo, foco contido e devolvido ao abrir e fechar. O conteúdo é montado ao abrir e removido depois de recolher. Exige uma MScreen como ancestral no nativo. O nome é validado mesmo fechado e nas atualizações; título tem precedência sobre accessibilityLabel. Para títulos assíncronos, forneça um nome alternativo ou use v-if.',
  },
  reveal: {
    usage:
      '<m-reveal :show="visible">\n  <m-card>\n    <m-text>Mais detalhes.</m-text>\n  </m-card>\n</m-reveal>',
    properties: [
      prop('show', 'boolean', 'false', 'Controla a entrada e a saída do conteúdo.'),
      ...layoutProperties(true),
    ],
    layout: true,
    behavior:
      'Declare visible como estado booleano. A entrada anima opacidade e deslocamento; a saída anima opacidade. O conteúdo é removido ao final. A altura não é interpolada. Respeita movimento reduzido. Ao fechar com o foco dentro do conteúdo, devolve-o ao elemento que estava focado na abertura, se ele ainda estiver disponível.',
  },
}
