<script setup lang="ts">
import { computed, markRaw, onScopeDispose, ref } from 'vue'
import type {
  ChoiceValue,
  CivilDate,
  DateRange,
  ChartSeries,
  DataSort,
  CommandItem,
} from '@getcortexlabs/mavis-core'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import type { AppearanceMode } from '@getcortexlabs/mavis-core/vue'
import { atlas, atlasNight, atlasPhoto } from '../atlas/theme'
import { mountains, lake, coast } from '../atlas/photos'
import { useCatalog } from '../context'

const { navigation } = useCatalog()
const appearance = ref<AppearanceMode>('light')
const colors = computed(() => (appearance.value === 'dark' ? atlasNight : atlas).colors)
const section = ref<ChoiceValue>('discover')
const current = ref<ChoiceValue>('mountains')
const title = ref('Uma semana fora do óbvio')
const editor = ref(false)
const commands = ref(false)
const dates = ref<CivilDate | DateRange | null>({ start: '2026-11-12', end: '2026-11-18' })
const budgetMode = ref<ChoiceValue>('planned')
const sort = ref<DataSort | null>(null)
const query = ref('')
const saved = ref<ChoiceValue[]>(['lake'])
const destinations = [
  {
    id: 'mountains',
    number: '01',
    name: 'Onde o mundo respira.',
    short: 'Ganhe outra perspectiva.',
    location: 'PASSAGENS / MONTANHAS',
    coordinates: 'CADERNO 01 · AR LIVRE',
    days: '06 dias',
    photo: mountains,
    kind: 'Altitude',
    note: 'Para quem precisa ver as coisas de outro ângulo.',
    description:
      'Acordar acima das nuvens. Caminhar sem contar os passos. Encontrar um silêncio que a cidade esqueceu.',
  },
  {
    id: 'lake',
    number: '02',
    name: 'Um pouco mais devagar.',
    short: 'Encontre o seu silêncio.',
    location: 'PASSAGENS / LAGOS',
    coordinates: 'CADERNO 02 · SEM PRESSA',
    days: '04 dias',
    photo: lake,
    kind: 'Calmaria',
    note: 'Uma pausa longa o bastante para ouvir seus próprios pensamentos.',
    description:
      'Água parada. Café demorado. Uma pequena casa e a rara sensação de não precisar estar em outro lugar.',
  },
  {
    id: 'coast',
    number: '03',
    name: 'Deixe a maré decidir.',
    short: 'Vá onde o dia levar.',
    location: 'PASSAGENS / LITORAL',
    coordinates: 'HORIZONTE ABERTO',
    days: '05 dias',
    photo: coast,
    kind: 'Liberdade',
    note: 'Um caminho sem muitos horários. E com um bom final de tarde.',
    description:
      'Pés na areia, uma estrada nova e nenhum motivo para olhar o relógio. Alguns planos ficam melhores em aberto.',
  },
]
const destination = computed(
  () => destinations.find((item) => item.id === current.value) ?? destinations[0]!,
)
const commandItems: CommandItem[] = [
  { value: 'discover', label: 'Encontrar meu próximo destino', icon: 'compass', group: 'Explorar' },
  { value: 'itinerary', label: 'Abrir meu roteiro', icon: 'map', group: 'Planejar' },
  { value: 'budget', label: 'Rever o orçamento', icon: 'wallet', group: 'Planejar' },
  { value: 'edit', label: 'Dar um nome à viagem', icon: 'pencil', group: 'Criar' },
]
const stops = ref([
  { id: 'arrival', name: 'Chegada e um café sem pressa', category: 'Essenciais', cost: 120 },
  { id: 'trail', name: 'A trilha que vale a manhã', category: 'Ao ar livre', cost: 80 },
  { id: 'stay', name: 'Um refúgio para chamar de seu', category: 'Hospedagem', cost: 640 },
  { id: 'table', name: 'Sabores que ficam na memória', category: 'Gastronomia', cost: 240 },
])
const visibleStops = computed(() => {
  const items = stops.value.filter((item) =>
    item.name.toLocaleLowerCase().includes(query.value.toLocaleLowerCase()),
  )
  if (sort.value) {
    const { key, direction } = sort.value
    items.sort(
      (a, b) =>
        (key === 'cost' ? a.cost - b.cost : a.name.localeCompare(b.name)) *
        (direction === 'ascending' ? 1 : -1),
    )
  }
  return items
})
const chartSeries = computed<ChartSeries[]>(() => [
  {
    key: 'trip',
    label: budgetMode.value === 'planned' ? 'Seu plano' : 'Com mais conforto',
    values:
      budgetMode.value === 'planned'
        ? [240, 420, 180, 560, 320, 220]
        : [320, 540, 240, 720, 460, 300],
  },
])
const budgetTotal = computed(() => (budgetMode.value === 'planned' ? '1.940' : '2.580'))
const surface = () => markRaw(createMotionSurface())
const heading = surface(),
  photo = surface(),
  shade = surface(),
  signature = surface()
onScopeDispose(
  heading.use((motion) => {
    motion.animateText({ by: 'word', y: 24, stagger: 45 })
  }),
)
onScopeDispose(
  photo.use((motion) => {
    motion.animate({ scale: [1.055, 1], opacity: [0.6, 1] }, { duration: 1200, ease: 'easeOut' })
  }),
)
onScopeDispose(
  shade.use((motion) => {
    motion.gradient({
      type: 'linear',
      colors: ['#101D25AA', '#14252400', '#101D25ED'],
      stops: [0, 0.38, 1],
      angle: 180,
    })
  }),
)
onScopeDispose(
  signature.use((motion) => {
    motion.animate(
      { rotate: [-35, 0], scale: [0.6, 1] },
      { type: 'spring', duration: 900, bounce: 0.12 },
    )
  }),
)
function favorite() {
  saved.value = saved.value.includes(current.value)
    ? saved.value.filter((key) => key !== current.value)
    : [...saved.value, current.value]
}
function chooseCommand(value: ChoiceValue) {
  if (value === 'edit') editor.value = true
  else section.value = value
}
</script>

<template>
  <MThemeProvider :theme="atlas" :darkTheme="atlasNight" v-model:appearance="appearance">
    <MScreen scroll class="atlas-screen" :class="{ 'atlas-screen--night': appearance === 'dark' }">
      <MColumn class="atlas-paper" gap="none">
        <MRow class="atlas-masthead" justify="between" gap="md" wrap>
          <MRow gap="sm">
            <MText text="atlas" class="atlas-wordmark" variant="title" />
            <MIcon name="asterisk" :size="38" tone="primary" :motionSurface="signature" />
          </MRow>
          <MPlatform only="web"
            ><MColumn class="atlas-edition" gap="xs" align="center">
              <MText variant="overline" text="UM CADERNO DE OUTROS ARES" />
              <MText
                variant="caption"
                tone="muted"
                text="Lugares que mudam o jeito de olhar."
              /> </MColumn
          ></MPlatform>
          <MRow gap="xs">
            <MButton
              icon="search"
              variant="ghost"
              accessibilityLabel="Buscar no Atlas"
              @click="commands = true"
            />
            <MButton
              :icon="appearance === 'light' ? 'moon' : 'sun'"
              variant="ghost"
              accessibilityLabel="Mudar aparência"
              @click="appearance = appearance === 'light' ? 'dark' : 'light'"
            />
            <MButton
              class="atlas-exit"
              text="Mavis ↗"
              variant="ghost"
              size="sm"
              @click="navigation.back('/showcase')"
            />
          </MRow>
        </MRow>
        <MSeparator />
        <MRow class="atlas-byline" justify="between" gap="sm" wrap>
          <MRow gap="sm"
            ><MBox :width="6" :height="6" radius="full" :backgroundColor="colors.primary" /><MText
              variant="overline"
              :text="title"
          /></MRow>
          <MPopover
            triggerLabel="Sua viagem"
            label="Pequenos detalhes"
            :open="editor"
            @update:open="editor = $event"
            variant="ghost"
          >
            <MColumn gap="md"
              ><MText variant="title" text="Todo caminho começa com uma ideia." /><MInput
                v-model="title"
                label="Nome da viagem" /><MButton
                text="Ficou a minha cara"
                icon="check"
                @click="editor = false"
            /></MColumn>
          </MPopover>
        </MRow>
        <MTabs
          class="atlas-tabs"
          v-model="section"
          :tabs="[
            { value: 'discover', label: 'Inspiração' },
            { value: 'itinerary', label: 'Meu roteiro' },
            { value: 'budget', label: 'Orçamento' },
          ]"
          label="Seu planejamento"
          keepAlive
        >
          <template #default="{ value }">
            <MColumn v-if="value === 'discover'" gap="none">
              <MStack
                class="atlas-discovery-layout"
                direction="column"
                :responsive="{ at: 1100, direction: 'row', align: 'start', gap: 'xl' }"
                gap="lg"
              >
                <MColumn class="atlas-primary-story" :grow="3" :shrink="1" gap="none">
                  <MCarousel
                    class="atlas-destinations"
                    v-model="current"
                    :items="destinations"
                    label="ESCOLHA O SEU PRÓXIMO CAPÍTULO"
                    previousLabel="Destino anterior"
                    nextLabel="Próximo destino"
                    slideLabel="Destino"
                  >
                    <template #default="{ item }">
                      <MBox class="atlas-photograph" :height="620" backgroundColor="#233D43">
                        <MImage
                          :src="item.photo"
                          :alt="item.kind + ': uma paisagem para inspirar a próxima viagem'"
                          :height="620"
                          :aspectRatio="1.9"
                          :radius="0"
                          :motionSurface="photo"
                          class="atlas-hero-image"
                        />
                        <MBox
                          class="atlas-photo-shade"
                          :motionSurface="shade"
                          backgroundColor="#14252444"
                          accessibilityHidden
                        />
                        <MThemeProvider :theme="atlasPhoto">
                          <MColumn
                            class="atlas-photo-content"
                            padding="lg"
                            justify="between"
                            gap="xl"
                          >
                            <MRow justify="between" gap="sm" wrap>
                              <MRow gap="sm"
                                ><MIcon name="map-pin" :size="14" /><MText
                                  variant="overline"
                                  :text="item.location"
                              /></MRow>
                              <MText
                                variant="overline"
                                :text="item.coordinates"
                                class="atlas-coordinates"
                              />
                            </MRow>
                            <MColumn gap="lg">
                              <MRow gap="md" align="end"
                                ><MText
                                  :text="item.number"
                                  class="atlas-issue-number"
                                  variant="overline" /><MText
                                  variant="overline"
                                  :text="`${item.kind} / ${item.days}`"
                              /></MRow>
                              <MText
                                as="h1"
                                :text="item.name"
                                class="atlas-hero-title"
                                variant="display"
                                :motionSurface="heading"
                              />
                              <MRow
                                class="atlas-photo-bottom"
                                justify="between"
                                gap="lg"
                                wrap
                                align="end"
                              >
                                <MText
                                  :text="item.description"
                                  class="atlas-hero-description"
                                  :shrink="1"
                                />
                                <MButton
                                  class="atlas-plan-button"
                                  text="Quero estar aqui"
                                  trailingIcon="arrow-up-right"
                                  @click="section = 'itinerary'"
                                />
                              </MRow>
                            </MColumn>
                          </MColumn>
                        </MThemeProvider>
                      </MBox>
                    </template>
                  </MCarousel>
                  <MRow class="atlas-caption" justify="between" gap="md" wrap>
                    <MRow gap="sm"
                      ><MIcon name="move-horizontal" :size="16" tone="muted" /><MText
                        variant="caption"
                        tone="muted"
                        text="Arraste a paisagem. Mude de perspectiva."
                    /></MRow>
                    <MButton
                      :icon="saved.includes(current) ? 'bookmark-check' : 'bookmark'"
                      :text="saved.includes(current) ? 'Na sua coleção' : 'Guardar este lugar'"
                      variant="ghost"
                      size="sm"
                      @click="favorite"
                    />
                  </MRow>
                </MColumn>
                <MColumn
                  class="atlas-field-notes"
                  :grow="1"
                  :shrink="1"
                  gap="lg"
                  padding="lg"
                  :backgroundColor="colors.elevated"
                >
                  <MRow justify="between" gap="sm"
                    ><MText variant="overline" text="PÁGINA EM BRANCO" /><MIcon
                      name="pencil-line"
                      :size="18"
                      tone="primary"
                  /></MRow>
                  <MText
                    variant="title"
                    class="atlas-notebook-title"
                    text="Alguns planos merecem sair do papel."
                  />
                  <MText tone="muted" :text="destination.note" />
                  <MSeparator />
                  <MRow justify="between" gap="md"
                    ><MText variant="caption" tone="muted" text="Seu ponto de partida" /><MText
                      variant="caption"
                      :text="destination.kind"
                  /></MRow>
                  <MRow justify="between" gap="md"
                    ><MText variant="caption" tone="muted" text="Tempo para viver" /><MText
                      variant="caption"
                      :text="destination.days"
                  /></MRow>
                  <MRow justify="between" gap="md"
                    ><MText variant="caption" tone="muted" text="Ideias guardadas" /><MText
                      variant="caption"
                      :text="String(saved.length).padStart(2, '0')"
                  /></MRow>
                  <MButton
                    text="Montar meu roteiro"
                    trailingIcon="arrow-up-right"
                    @click="section = 'itinerary'"
                  />
                  <MText
                    variant="caption"
                    tone="muted"
                    text="Um calendário, algumas boas ideias e espaço para o que aparecer."
                  />
                  <MSeparator />
                  <MRow gap="md" align="start"
                    ><MText variant="title" tone="primary" text="↗" /><MText
                      variant="caption"
                      text="Comece por um lugar. O caminho você descobre depois."
                      :shrink="1"
                  /></MRow>
                </MColumn>
              </MStack>
              <MStack
                class="atlas-editorial"
                direction="column"
                :responsive="{ at: 800, direction: 'row', align: 'start', gap: '2xl' }"
                gap="lg"
              >
                <MColumn :grow="1" :shrink="1" gap="md"
                  ><MText variant="overline" tone="primary" text="MENOS PILOTO AUTOMÁTICO" /><MText
                    variant="title"
                    class="atlas-manifesto"
                    text="Você não precisa de mais um destino. Precisa de outro ritmo."
                /></MColumn>
                <MColumn class="atlas-editor-note" :grow="1" :shrink="1" gap="lg"
                  ><MText
                    tone="muted"
                    text="Um caminho alto. Uma margem tranquila. Um horizonte sem pressa. Três maneiras de sair um pouco da rotina — e voltar com alguma coisa diferente." /><MRow
                    gap="md"
                    ><MBox :width="32" :height="1" :backgroundColor="colors.primary" /><MText
                      variant="caption"
                      text="Escolhas da redação / Caderno 001" /></MRow
                ></MColumn>
              </MStack>
              <MGrid :columns="3" :minColumnWidth="240" gap="lg" class="atlas-contact-sheet">
                <MCard
                  v-for="item in destinations"
                  :key="item.id"
                  interactive
                  padding="none"
                  gap="sm"
                  :radius="0"
                  backgroundColor="transparent"
                  class="atlas-destination-card"
                  :class="{ 'atlas-destination-card--selected': current === item.id }"
                  :accessibilityLabel="`${item.number} / ${item.kind.toUpperCase()} ${item.short} ${item.note}`"
                  @click="current = item.id"
                >
                  <MImage :src="item.photo" :alt="''" :aspectRatio="1.6" :radius="0" />
                  <MRow justify="between" gap="sm" paddingY="sm"
                    ><MText
                      :text="`${item.number} / ${item.kind.toUpperCase()}`"
                      variant="overline" /><MIcon name="arrow-up-right" :size="18" tone="primary"
                  /></MRow>
                  <MText :text="item.short" variant="heading" />
                  <MText :text="item.note" variant="caption" tone="muted" />
                </MCard>
              </MGrid>
            </MColumn>
            <MColumn v-else-if="value === 'itinerary'" gap="xl" class="atlas-workspace">
              <MRow class="atlas-section-heading" justify="between" gap="lg" wrap align="end">
                <MColumn gap="md"
                  ><MText variant="overline" tone="primary" text="CADERNO DE CAMPO / 02" /><MText
                    variant="display"
                    class="atlas-page-title"
                    as="h1"
                    text="O plano é ter espaço."
                /></MColumn>
                <MColumn gap="sm" class="atlas-preparation"
                  ><MText
                    variant="caption"
                    tone="muted"
                    text="3 de 5 detalhes no lugar. O resto é caminho." /><MProgress
                    :value="3"
                    :max="5"
                    label="Preparação da viagem"
                /></MColumn>
              </MRow>
              <MStack
                direction="column"
                :responsive="{ at: 820, direction: 'row', align: 'start', gap: '2xl' }"
                gap="xl"
              >
                <MColumn :grow="1" :shrink="1" gap="lg" class="atlas-calendar-page"
                  ><MRow gap="sm"
                    ><MIcon name="calendar-days" :size="18" tone="primary" /><MText
                      variant="overline"
                      text="RESERVE ALGUNS DIAS PARA VOCÊ" /></MRow
                  ><MCalendar
                    v-model="dates"
                    mode="range"
                    initialMonth="2026-11"
                    label="Quando o mundo pode esperar?"
                    locale="pt-BR"
                /></MColumn>
                <MColumn :grow="1" :shrink="1" gap="lg"
                  ><MText variant="overline" text="UM PRIMEIRO DIA POSSÍVEL" /><MTimeline
                    label="O seu primeiro dia"
                    :items="[
                      {
                        key: 'coffee',
                        title: 'Café com vista',
                        time: '08:30',
                        status: 'complete',
                        description: 'O começo não precisa de pressa.',
                      },
                      {
                        key: 'walk',
                        title: 'Uma trilha, muitas descobertas',
                        time: '10:00',
                        status: 'current',
                        description: 'Leve água. E espaço na câmera.',
                      },
                      {
                        key: 'sunset',
                        title: 'Encontre o pôr do sol',
                        time: '17:40',
                        status: 'upcoming',
                        description: 'O melhor compromisso do dia.',
                      },
                    ]"
                /></MColumn>
              </MStack>
              <MSeparator />
              <MRow justify="between" gap="md" wrap
                ><MText variant="title" text="As pequenas partes da viagem." /><MButton
                  icon="shuffle"
                  text="Outra ordem"
                  variant="secondary"
                  @click="stops = [...stops].reverse()"
              /></MRow>
              <MInput v-model="query" label="Encontrar uma ideia no roteiro" />
              <MDataTable
                :items="visibleStops"
                :columns="[
                  { key: 'name', label: 'Experiência', sortable: true, width: 280 },
                  { key: 'category', label: 'Categoria', width: 160 },
                  { key: 'cost', label: 'Estimativa', sortable: true, align: 'end', width: 140 },
                ]"
                v-model:sort="sort"
                label="Seu roteiro, do seu jeito"
              >
                <template #cell="{ column, value: cell }"
                  ><MText
                    :text="column.key === 'cost' ? `R$ ${cell}` : String(cell)"
                    :tone="column.key === 'category' ? 'muted' : 'text'"
                /></template>
              </MDataTable>
            </MColumn>
            <MColumn v-else gap="xl" class="atlas-workspace">
              <MRow class="atlas-section-heading" justify="between" gap="lg" wrap align="end"
                ><MColumn gap="md"
                  ><MText variant="overline" tone="primary" text="UM POUCO DE CHÃO / 03" /><MText
                    variant="display"
                    class="atlas-page-title"
                    as="h1"
                    text="Sonhe alto. Planeje leve." /></MColumn
                ><MTooltip
                  text="Valores ilustrativos para experimentar o planejamento. Você decide o orçamento real."
                  triggerLabel="Sobre as estimativas"
              /></MRow>
              <MStack
                direction="column"
                :responsive="{ at: 800, direction: 'row', align: 'start', gap: '2xl' }"
                gap="xl"
              >
                <MColumn class="atlas-budget-note" gap="lg" :grow="1" :shrink="1"
                  ><MText variant="overline" text="SEIS DIAS. MUITAS HISTÓRIAS." /><MRow
                    gap="sm"
                    align="end"
                    ><MText text="R$" variant="heading" /><MText
                      :text="budgetTotal"
                      variant="display"
                      class="atlas-total" /></MRow
                  ><MText
                    tone="muted"
                    text="Uma estimativa para colocar o plano no mundo. Escolha o seu ritmo e veja cada dia encontrar seu lugar." /><MSeparator /><MText
                    variant="caption"
                    tone="muted"
                    :text="`${destination.location} / ${destination.days}`"
                /></MColumn>
                <MColumn :grow="2" :shrink="1" gap="xl"
                  ><MSegmentedControl
                    v-model="budgetMode"
                    :options="[
                      { value: 'planned', label: 'Essencial' },
                      { value: 'comfort', label: 'Um pouco mais de conforto' },
                    ]"
                    label="Estilo da viagem" /><MChart
                    type="bar"
                    :categories="
                      ['Dia 1', 'Dia 2', 'Dia 3', 'Dia 4', 'Dia 5', 'Dia 6'].map((label, key) => ({
                        key,
                        label,
                      }))
                    "
                    :series="chartSeries"
                    :domain="[0, 800]"
                    :height="240"
                    label="Cada dia, uma possibilidade."
                    :formatValue="(n) => `R$ ${n}`"
                    categoryLabel="Dia"
                    seriesLabel="Plano"
                    showDataLabel="Ver os valores"
                    hideDataLabel="Recolher valores"
                /></MColumn>
              </MStack>
              <MText
                variant="caption"
                tone="muted"
                text="Um exercício de imaginação: valores de exemplo, sem reservas ou cobranças."
              />
            </MColumn>
          </template>
        </MTabs>
        <MRow class="atlas-footer" justify="between" gap="lg" wrap align="end"
          ><MColumn gap="sm"
            ><MText variant="title" class="atlas-footer-brand" text="Vá. Depois, conte." /><MText
              variant="caption"
              tone="muted"
              text="ATLAS / Um caderno que ainda tem muitas páginas em branco." /></MColumn
          ><MButton
            text="Feito com Mavis"
            trailingIcon="arrow-up-right"
            variant="ghost"
            size="sm"
            @click="navigation.back('/showcase')"
        /></MRow>
      </MColumn>
      <MCommandPalette
        v-model:open="commands"
        :items="commandItems"
        label="Para onde vamos?"
        searchLabel="Encontre um caminho"
        placeholder="Destino, roteiro, orçamento…"
        closeLabel="Fechar busca"
        @select="chooseCommand"
      />
    </MScreen>
  </MThemeProvider>
</template>

<style>
.atlas-screen {
  --atlas-rule: #d1d0c5;
  --atlas-accent: #a73924;
}
.atlas-screen--night {
  --atlas-rule: #4c5144;
  --atlas-accent: #f5b395;
}
.atlas-paper {
  width: 100%;
  max-width: 1720px;
  margin-inline: auto;
  padding: 0 48px;
}
.atlas-masthead {
  min-height: 120px;
}
.atlas-wordmark {
  --m-text-font-size: 66px;
  --m-text-letter-spacing: -0.08em;
  --m-text-line-height: 1;
}
.atlas-edition {
  padding-top: 14px;
}
.atlas-byline {
  min-height: 62px;
}
.atlas-byline > :first-child {
  max-width: 70%;
}
.atlas-tabs {
  gap: 0 !important;
}
.atlas-primary-story {
  min-width: 0;
  flex-basis: 0 !important;
}
.atlas-field-notes {
  min-width: 0;
  max-width: 320px;
  flex-basis: 300px !important;
  margin-top: 36px;
}
.atlas-notebook-title {
  --m-text-font-size: 44px;
  --m-text-line-height: 1.1;
}
.atlas-tabs > .m-tabs-scroll {
  margin-bottom: 24px;
}
.atlas-tabs > .m-tabs-scroll .m-tabs-track {
  width: 100%;
  gap: 28px;
}
.atlas-tabs > .m-tabs-scroll .m-tab {
  padding: 16px 0;
  font-size: 13px;
  letter-spacing: 0.02em;
}
.atlas-tabs > .m-tabs-scroll .m-tab[aria-selected='true'] {
  background: transparent;
}
.atlas-destinations > :first-child .m-text:first-child {
  --m-text-font-size: 10px;
  --m-text-letter-spacing: 0.15em;
  --m-text-font-weight: 500;
}
.atlas-destinations > :first-child .m-text:last-child {
  font-variant-numeric: tabular-nums;
  --m-text-font-size: 11px;
}
.atlas-destinations > .m-box {
  border-radius: 0 !important;
}
.atlas-photograph {
  overflow: hidden;
  isolation: isolate;
}
.atlas-photo-shade {
  pointer-events: none;
}
.atlas-photo-content {
  padding: 34px 44px !important;
  min-height: 0;
  position: relative;
}
.atlas-hero-title {
  --m-text-font-size: clamp(64px, 7.8vw, 116px);
  --m-text-line-height: 1.02;
  max-width: 790px;
  text-wrap: balance;
  text-shadow: 0 2px 24px #101d2540;
}
.atlas-hero-description {
  max-width: 455px;
  --m-text-font-size: 15px;
  --m-text-line-height: 1.6;
}
.atlas-issue-number {
  --m-text-font-size: 36px;
  --m-text-letter-spacing: -0.06em;
  --m-text-line-height: 1;
}
.atlas-plan-button {
  --m-button-padding-x: 26px;
  --m-button-padding-y: 18px;
  --m-button-font-size: 14px;
}
.atlas-destinations > :last-child {
  padding-top: 3px;
}
.atlas-destinations > :last-child > :first-child,
.atlas-destinations > :last-child > :last-child {
  background: transparent !important;
  border: 1px solid var(--atlas-rule) !important;
}
.atlas-caption {
  padding-block: 8px 40px;
  border-bottom: 1px solid var(--atlas-rule);
}
.atlas-editorial {
  padding-block: 60px 40px;
}
.atlas-manifesto {
  max-width: 650px;
  --m-text-font-size: clamp(32px, 3.3vw, 48px);
  --m-text-line-height: 1.15;
}
.atlas-editor-note {
  max-width: 400px;
  padding-top: 28px;
}
.atlas-contact-sheet {
  padding-bottom: 64px;
}
.atlas-destination-card {
  --m-card-border: 0;
  padding-bottom: 18px !important;
  border-bottom: 2px solid transparent !important;
}
.atlas-destination-card--selected {
  border-bottom-color: var(--atlas-accent) !important;
}
.atlas-destination-card .m-image {
  filter: saturate(0.8);
}
.atlas-destination-card--selected .m-image {
  filter: none;
}
.atlas-workspace {
  padding-block: 18px 72px;
}
.atlas-section-heading {
  padding-bottom: 24px;
}
.atlas-page-title {
  max-width: 760px;
  --m-text-font-size: clamp(46px, 5.3vw, 78px);
}
.atlas-preparation {
  min-width: 240px;
  padding-bottom: 8px;
}
.atlas-calendar-page {
  padding-right: 32px;
  border-right: 1px solid var(--atlas-rule);
}
.atlas-budget-note {
  max-width: 360px;
  padding-right: 28px;
}
.atlas-total {
  --m-text-font-size: 90px;
  --m-text-letter-spacing: -0.06em;
}
.atlas-footer {
  padding-block: 38px 48px;
  border-top: 1px solid var(--atlas-rule);
}
.atlas-footer-brand {
  --m-text-font-size: 32px;
}
@media (min-width: 1600px) {
  .atlas-photograph,
  .atlas-hero-image {
    height: 680px !important;
  }
}
@media (max-width: 999px) {
  .atlas-paper {
    padding-inline: 28px;
  }
  .atlas-edition {
    display: none !important;
  }
  .atlas-photo-content {
    padding: 28px !important;
  }
  .atlas-hero-title {
    max-width: 600px;
  }
  .atlas-editor-note {
    max-width: none;
    padding-top: 0;
  }
  .atlas-calendar-page {
    padding-right: 0;
    border-right: 0;
  }
}
@media (max-width: 1199px) {
  .atlas-primary-story,
  .atlas-field-notes {
    flex-basis: auto !important;
    max-width: none;
  }
  .atlas-field-notes {
    margin-top: 0;
  }
}
@media (max-width: 599px) {
  .atlas-paper {
    padding-inline: 18px;
  }
  .atlas-masthead {
    min-height: 88px;
  }
  .atlas-wordmark {
    --m-text-font-size: 54px;
  }
  .atlas-exit {
    display: none !important;
  }
  .atlas-byline {
    padding-block: 12px;
  }
  .atlas-byline > :first-child {
    max-width: 56%;
  }
  .atlas-byline .m-text {
    --m-text-font-size: 9px;
    --m-text-letter-spacing: 0.08em;
  }
  .atlas-tabs > .m-tabs-scroll .m-tabs-track {
    gap: 22px;
  }
  .atlas-tabs > .m-tabs-scroll .m-tab {
    font-size: 12px;
  }
  .atlas-photograph,
  .atlas-hero-image {
    height: 590px !important;
  }
  .atlas-photo-content {
    padding: 22px !important;
  }
  .atlas-coordinates {
    display: none !important;
  }
  .atlas-hero-title {
    --m-text-font-size: 58px;
    --m-text-line-height: 1.04;
  }
  .atlas-hero-description {
    --m-text-font-size: 13px;
    max-width: none;
  }
  .atlas-photo-bottom {
    gap: 18px !important;
  }
  .atlas-plan-button {
    width: 100%;
  }
  .atlas-caption {
    padding-bottom: 24px;
  }
  .atlas-editorial {
    padding-top: 36px;
  }
  .atlas-manifesto {
    --m-text-font-size: 36px;
  }
  .atlas-contact-sheet {
    padding-bottom: 40px;
  }
  .atlas-budget-note {
    max-width: none;
    padding-right: 0;
  }
  .atlas-footer {
    padding-top: 28px;
  }
}
</style>
