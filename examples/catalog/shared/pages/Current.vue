<script setup lang="ts">
import { computed, markRaw, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import {
  createMotionRegion,
  createMotionSurface,
  createMotionScrollSource,
  whenMotionAvailable,
  type MotionHeader,
  type MotionReorder,
} from '@getcortexlabs/mavis-core/experimental'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import { useCatalogLocale } from '../locale'

const { navigation } = useCatalog(),
  { locale } = useCatalogLocale(),
  { theme } = useMavisTheme()
const pt = computed(() => locale.value === 'pt')
const surface = () => markRaw(createMotionSurface())
const region = markRaw(createMotionRegion()),
  scroll = markRaw(createMotionScrollSource())
const header = surface(),
  artwork = surface(),
  title = surface(),
  toolbar = surface(),
  toolbarTitle = surface(),
  section = surface(),
  collection = surface()
const row = (key: string, index: number) => ({ key, index, target: surface(), handle: surface() })
const rows = ref(Array.from({ length: 18 }, (_, index) => row(`note-${index + 1}`, index + 1)))
const large = ref(false),
  loading = ref(false),
  failNext = ref(false),
  disabled = ref(false),
  mounted = ref(true)
const error = ref(''),
  commits = ref(0),
  refreshes = ref(0),
  ready = ref(false)
const headerHeight = computed(() => (large.value ? 310 : 240))
const overlayTop = { alignSelf: 'flex-start', verticalAlignment: 'top' }
const pointer = { pointerEvents: 'auto' }
let headerMotion: MotionHeader | undefined,
  sorting: MotionReorder | undefined,
  serial = 0,
  request = 0
const items = () =>
  rows.value
    .filter((item) => item.target.available && item.handle.available)
    .map((item) => ({ key: item.key, target: item.target, handle: item.handle }))
async function insert() {
  await headerMotion?.preserveAnchor(async () => {
    rows.value = [row(`new-${++serial}`, serial + 30), ...rows.value]
    await nextTick()
    sorting?.refresh()
  })
}
const stopPaint = artwork.use((motion) => {
  const paint = motion.gradient({ type: 'linear', colors: ['#173e56', '#a4c6ae'], angle: 125 })
  const stop = watch(
    () => theme.value.appearance,
    (dark) =>
      paint.animate(
        { colors: dark === 'dark' ? ['#102f45', '#537d71'] : ['#173e56', '#a4c6ae'] },
        { duration: 500 },
      ),
  )
  return stop
})
const stop = whenMotionAvailable(
  [region, scroll, header, artwork, title, toolbar, toolbarTitle, section, collection],
  () => {
    const order = region.reorder({
      container: collection,
      scroll,
      items,
      onCommit(move) {
        const moving = rows.value.find((item) => item.key === move.key)
        if (!moving) return
        const next = rows.value.filter((item) => item.key !== move.key)
        const index =
          move.beforeKey === null
            ? next.length
            : next.findIndex((item) => item.key === move.beforeKey)
        if (index < 0) return
        next.splice(index, 0, moving)
        rows.value = next
        commits.value++
        void nextTick().then(() => {
          if (!order.disposed) order.refresh()
        })
      },
      accessibility: {
        label: (key) => `${pt.value ? 'Nota' : 'Note'} ${key}`,
        moveUp: pt.value ? 'Mover para cima' : 'Move up',
        moveDown: pt.value ? 'Mover para baixo' : 'Move down',
        announcement: (key, position, total, phase) =>
          pt.value
            ? `${key}, posição ${position} de ${total}, ${phase}`
            : `${key}, position ${position} of ${total}, ${phase}`,
      },
    })
    sorting = order
    const headerControl = region.scrollHeader(scroll, {
      header,
      artwork,
      title,
      toolbar,
      toolbarTitle,
      section,
      items,
      minimum: 56,
      async onRefresh(context) {
        const id = ++request
        loading.value = true
        error.value = ''
        const fail = failNext.value
        failNext.value = false
        try {
          await new Promise((resolve) => setTimeout(resolve, 900))
          if (context.cancelled) return
          if (fail)
            throw new Error(
              pt.value
                ? 'Não foi possível atualizar. Tente novamente.'
                : 'Could not refresh. Try again.',
            )
          await context.commit(async () => {
            rows.value = [row(`fresh-${++serial}`, serial + 50), ...rows.value]
            refreshes.value++
            await nextTick()
            if (!context.cancelled && !order.disposed) order.refresh()
          })
        } finally {
          if (request === id) loading.value = false
        }
      },
      onRefreshError: (cause) => {
        error.value = String((cause as Error).message ?? cause)
      },
    })
    headerMotion = headerControl
    ready.value = true
    const stopDisabled = watch(disabled, (value) => (value ? order.pause() : order.play()), {
      immediate: true,
    })
    void nextTick().then(() => {
      if (!headerControl.disposed) {
        void headerControl.remeasure()
        order.refresh()
      }
    })
    return () => {
      request++
      loading.value = ready.value = false
      stopDisabled()
      headerControl.dispose()
      order.dispose()
      sorting = undefined
      headerMotion = undefined
    }
  },
)
watch(large, async () => {
  await nextTick()
  await headerMotion?.remeasure()
  sorting?.refresh()
})
function remove() {
  rows.value = rows.value.slice(0, -1)
  void nextTick().then(() => {
    sorting?.refresh()
    void headerMotion?.remeasure()
  })
}
onBeforeUnmount(() => {
  stop()
  stopPaint()
})
</script>

<template>
  <m-screen id="current-screen" scroll :motionRegion="region" :motionScroll="scroll">
    <m-column padding="md" gap="md">
      <m-card gap="sm">
        <m-text variant="overline" tone="primary">{{
          pt ? 'SUA COLEÇÃO, NO SEU RITMO' : 'YOUR COLLECTION, AT YOUR PACE'
        }}</m-text>
        <m-text tone="muted">{{
          pt
            ? 'Segure a alça para reorganizar. As notas têm espaço para crescer.'
            : 'Hold a handle to reorder. Each note has room to grow.'
        }}</m-text>
        <m-row wrap gap="sm">
          <m-button id="current-large" size="sm" variant="secondary" @click="large = !large">{{
            pt ? 'Outro tamanho' : 'Resize heading'
          }}</m-button>
          <m-button id="current-disable" size="sm" variant="ghost" @click="disabled = !disabled">{{
            disabled
              ? pt
                ? 'Permitir movimento'
                : 'Enable moves'
              : pt
                ? 'Pausar movimento'
                : 'Pause moves'
          }}</m-button>
          <m-button id="current-fail" size="sm" variant="ghost" @click="failNext = !failNext">{{
            failNext
              ? pt
                ? 'Falha preparada'
                : 'Failure armed'
              : pt
                ? 'Simular falha'
                : 'Simulate failure'
          }}</m-button>
          <m-button id="current-remove" size="sm" variant="ghost" @click="remove">{{
            pt ? 'Remover última' : 'Remove last'
          }}</m-button>
          <m-button id="current-mount" size="sm" variant="ghost" @click="mounted = !mounted">{{
            mounted
              ? pt
                ? 'Guardar coleção'
                : 'Put collection away'
              : pt
                ? 'Abrir coleção'
                : 'Open collection'
          }}</m-button>
        </m-row>
        <m-text id="current-status" variant="caption" tone="muted"
          >{{ ready ? 'ready' : 'waiting' }} · {{ commits }} {{ pt ? 'movimentos' : 'moves' }} ·
          {{ refreshes }} {{ pt ? 'atualizações' : 'refreshes' }}</m-text
        >
        <m-text v-if="error" id="current-error" tone="danger">{{ error }}</m-text>
        <m-button
          v-if="loading"
          id="current-cancel"
          size="sm"
          variant="ghost"
          @click="headerMotion?.cancelRefresh()"
          >{{ pt ? 'Cancelar atualização' : 'Cancel refresh' }}</m-button
        >
      </m-card>
      <m-box v-if="mounted" id="current-collection" :motionSurface="collection">
        <m-column gap="md">
          <m-card
            v-for="item in rows"
            :id="`current-${item.key}`"
            :key="item.key"
            :motionSurface="item.target"
            gap="sm"
            :padding="item.index % 3 === 0 ? 'lg' : 'md'"
          >
            <m-row align="center" justify="between" gap="sm">
              <m-column :grow="1" gap="xs">
                <m-text variant="overline" tone="primary"
                  >{{ String(item.index).padStart(2, '0') }} / CURRENT</m-text
                >
                <m-text variant="heading">{{
                  pt ? 'Um lugar para novas ideias.' : 'A place for new ideas.'
                }}</m-text>
              </m-column>
              <m-button
                :id="`current-handle-${item.key}`"
                :motionSurface="item.handle"
                reorderHandle
                text="≡"
                :accessibilityLabel="`${pt ? 'Reordenar nota' : 'Reorder note'} ${item.key}`"
                :disabled="disabled"
                size="sm"
                variant="ghost"
              />
            </m-row>
            <m-text v-if="item.index % 3 === 0" tone="muted">{{
              pt
                ? 'Algumas histórias precisam de mais linhas. O movimento acompanha o conteúdo.'
                : 'Some stories need a few more lines. Movement follows the content.'
            }}</m-text>
            <m-row gap="sm">
              <m-button
                :id="`current-up-${item.key}`"
                size="sm"
                variant="ghost"
                :disabled="disabled"
                @click="sorting?.moveUp(item.key)"
                >↑ {{ pt ? 'Acima' : 'Up' }}</m-button
              >
              <m-button
                :id="`current-down-${item.key}`"
                size="sm"
                variant="ghost"
                :disabled="disabled"
                @click="sorting?.moveDown(item.key)"
                >↓ {{ pt ? 'Abaixo' : 'Down' }}</m-button
              >
            </m-row>
          </m-card>
        </m-column>
      </m-box>
    </m-column>
    <template #overlay>
      <m-box id="current-header" :motionSurface="header" :height="headerHeight" :style="overlayTop">
        <m-box
          id="current-artwork"
          :motionSurface="artwork"
          :height="headerHeight"
          backgroundColor="#173e56"
        />
        <m-column padding="lg" justify="end" gap="xs">
          <m-text variant="overline" :style="{ color: '#e4f2e9' }">17 / CURRENT</m-text>
          <m-text
            id="current-title"
            :motionSurface="title"
            :text="pt ? 'Ideias que\nencontram seu lugar.' : 'Ideas that\nfind their place.'"
            :variant="large ? 'display' : 'title'"
            :style="{ color: '#ffffff' }"
          />
        </m-column>
      </m-box>
      <m-box
        id="current-toolbar"
        :motionSurface="toolbar"
        :height="56"
        :backgroundColor="theme.colors.surface"
        :style="overlayTop"
      >
        <m-row align="center" paddingX="sm" gap="sm" justify="between">
          <m-button
            id="current-back"
            :style="pointer"
            size="sm"
            variant="ghost"
            @click="navigation.back('/showcase')"
            >←</m-button
          >
          <m-text
            id="current-compact-title"
            :motionSurface="toolbarTitle"
            text="CURRENT"
            variant="overline"
          />
          <m-button
            id="current-top"
            :style="pointer"
            size="sm"
            variant="ghost"
            @click="headerMotion?.scrollToTop()"
            >↑ {{ pt ? 'Topo' : 'Top' }}</m-button
          >
        </m-row>
      </m-box>
      <m-box
        id="current-section"
        :motionSurface="section"
        :height="60"
        :backgroundColor="theme.colors.surface"
        :style="overlayTop"
      >
        <m-row align="center" justify="between" paddingX="sm" gap="xs">
          <m-text variant="overline" tone="muted">{{ pt ? 'NOTAS' : 'NOTES' }}</m-text>
          <m-button
            id="current-insert"
            :style="pointer"
            size="sm"
            variant="ghost"
            :disabled="!ready"
            @click="insert"
            >＋ {{ pt ? 'Inserir' : 'Insert' }}</m-button
          >
          <m-button
            id="current-jump"
            :style="pointer"
            size="sm"
            variant="ghost"
            :disabled="!ready"
            @click="headerMotion?.scrollToItem('note-8', false)"
            >08 ↓</m-button
          >
          <m-button
            id="current-refresh"
            :style="pointer"
            size="sm"
            variant="ghost"
            :loading="loading"
            loadingIndicator="ring"
            loadingText="…"
            :disabled="!ready"
            @click="headerMotion?.refresh()"
            >↻</m-button
          >
        </m-row>
      </m-box>
    </template>
  </m-screen>
</template>
