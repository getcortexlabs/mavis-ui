<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref, watch } from 'vue'
import {
  createMotionSurface,
  type MotionGradient,
  type MotionCircular,
  type MotionLoadingEffect,
} from '@getcortexlabs/mavis-core/experimental'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import { useCatalogLocale } from '../locale'
import ThemeSwitch from '../ThemeSwitch.vue'

const { navigation } = useCatalog()
const { locale } = useCatalogLocale()
const { theme } = useMavisTheme()
const pt = computed(() => locale.value === 'pt')
const surface = () => markRaw(createMotionSurface())
const paintSurface = surface(),
  heading = surface(),
  amount = surface(),
  panel = surface(),
  loader = surface()
const mounted = ref(true),
  edition = ref(0),
  geometry = ref(false),
  paused = ref(false),
  loading = ref(true)
const count = ref(1298),
  presses = ref(0),
  concealed = ref(false),
  circularSupported = ref(false),
  loadingSupported = ref(false)
const gradientType = ref<'linear' | 'radial' | 'conic'>('linear')
const loaderStyle = ref<'dots' | 'bars' | 'ring'>('dots')
// This integer-only example does not depend on optional native Intl locale data.
const formatCount = (value: number) =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, pt.value ? '.' : ',')
const countText = computed(() => formatCount(count.value))
let paint: MotionGradient | undefined, circle: MotionCircular | undefined
let movePaint: (() => void) | undefined
const stops = [
  paintSurface.use((motion) => {
    const x = motion.motionValue(0.25)
    motion.set({ scale: 1 })
    const stopType = watch(
      gradientType,
      (type) => {
        paint?.dispose()
        paint = motion.gradient({
          type,
          colors: ['#214b80', '#d78eae'],
          angle: 125,
          center: { x: 0.25, y: 0.4 },
          radius: 1,
        })
        paint.bind({ center: { x } })
        paused.value = false
      },
      { immediate: true },
    )
    const stopTheme = watch(
      () => theme.value.appearance,
      (appearance) => {
        paint?.animate(
          { colors: appearance === 'dark' ? ['#231b63', '#c975a1'] : ['#214b80', '#d78eae'] },
          { duration: 650 },
        )
      },
    )
    movePaint = () => {
      geometry.value = !geometry.value
      motion.animateValue(x, geometry.value ? 0.8 : 0.25, {
        type: 'spring',
        duration: 850,
        bounce: 0.15,
      })
      paint?.animate(
        { angle: geometry.value ? 300 : 125, radius: geometry.value ? 0.65 : 1 },
        { type: 'spring', duration: 850, bounce: 0.15 },
      )
    }
    return () => {
      stopType()
      stopTheme()
      paint = undefined
      movePaint = undefined
    }
  }),
  panel.use((motion) => {
    circle = motion.circular()
    circularSupported.value = circle.supported
    concealed.value = false
    return () => {
      circle = undefined
      circularSupported.value = false
    }
  }),
  loader.use((motion) => {
    loadingSupported.value = motion.supports('loader')
    let effect: MotionLoadingEffect | undefined
    const stop = watch(
      [loading, loaderStyle, () => theme.value.colors.primary],
      () => {
        effect?.dispose()
        effect = loading.value
          ? motion.loader({ style: loaderStyle.value, color: theme.value.colors.primary, size: 46 })
          : undefined
      },
      { immediate: true },
    )
    return () => {
      stop()
      effect?.dispose()
      loadingSupported.value = false
    }
  }),
]
function roll() {
  count.value += count.value < 10000 ? 4287 : -9000
  amount.rollTo(count.value, {
    format: formatCount,
    duration: 850,
    stagger: 35,
  })
}
function toggleCircle() {
  if (!circle?.supported) return
  concealed.value = !concealed.value
  if (concealed.value) circle.conceal({ origin: { x: 28, y: 28 }, duration: 750 })
  else circle.reveal({ origin: { x: 28, y: 28 }, duration: 750 })
}
function pausePaint() {
  paused.value = !paused.value
  if (paused.value) paint?.suspend()
  else paint?.resume()
}
onBeforeUnmount(() => stops.forEach((stop) => stop()))
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-row justify="between" gap="sm">
        <m-button id="lustre-back" size="sm" variant="ghost" @click="navigation.back('/showcase')"
          >← Showcase</m-button
        >
        <ThemeSwitch />
      </m-row>
      <m-column gap="xs">
        <m-text variant="overline" tone="primary">16 / LUSTRE</m-text>
        <m-text
          id="lustre-heading"
          :motionSurface="heading"
          :text="pt ? 'Uma luz diferente.' : 'A different light.'"
          as="h1"
          variant="display"
        />
        <m-text tone="muted">{{
          pt ? 'Cor, palavras e pequenos instantes.' : 'Colour, words and small moments.'
        }}</m-text>
        <m-button
          id="lustre-text"
          size="sm"
          variant="secondary"
          @click="heading.animateText({ by: 'word', duration: 650, stagger: 100, y: 14 })"
          >{{ pt ? 'Rever o título' : 'Replay the title' }}</m-button
        >
      </m-column>
      <m-card
        v-if="mounted"
        :key="edition"
        id="lustre-paint"
        :motionSurface="paintSurface"
        interactive
        :height="220"
        padding="lg"
        radius="lg"
        backgroundColor="#214b80"
        @click="presses++"
      >
        <m-column :grow="1" justify="between">
          <m-text variant="overline" :style="{ color: '#ffffff' }"
            >LUSTRE / {{ gradientType.toUpperCase() }}</m-text
          >
          <m-text variant="display" :style="{ color: '#ffffff' }">{{
            pt ? 'Deixe\na luz entrar.' : 'Let the\nlight in.'
          }}</m-text>
        </m-column>
      </m-card>
      <m-row wrap gap="sm">
        <m-button
          v-for="kind in ['linear', 'radial', 'conic'] as const"
          :id="`lustre-${kind}`"
          :key="kind"
          size="sm"
          :variant="gradientType === kind ? 'primary' : 'secondary'"
          @click="gradientType = kind"
          >{{ kind }}</m-button
        >
        <m-button id="lustre-shift" size="sm" :disabled="!mounted" @click="movePaint?.()">{{
          pt ? 'Mudar a luz' : 'Shift the light'
        }}</m-button>
        <m-button
          id="lustre-pause"
          size="sm"
          variant="ghost"
          :disabled="!mounted"
          @click="pausePaint"
          >{{ paused ? (pt ? 'Continuar' : 'Resume') : pt ? 'Pausar' : 'Pause' }}</m-button
        >
      </m-row>
      <m-row wrap gap="sm">
        <m-button id="lustre-replace" size="sm" variant="ghost" @click="edition++">{{
          pt ? 'Nova edição' : 'New edition'
        }}</m-button>
        <m-button id="lustre-mount" size="sm" variant="ghost" @click="mounted = !mounted">{{
          mounted ? (pt ? 'Remover' : 'Remove') : pt ? 'Restaurar' : 'Restore'
        }}</m-button>
        <m-text id="lustre-presses" variant="caption"
          >{{ presses }} {{ pt ? 'toques' : 'presses' }}</m-text
        >
      </m-row>
      <m-card gap="md">
        <m-row justify="between" align="center" gap="md">
          <m-column :grow="1" gap="sm">
            <m-skeleton id="lustre-shimmer" effect="shimmer" :animated="loading" :height="18" />
            <m-skeleton effect="shimmer" :animated="loading" width="72%" :height="12" />
          </m-column>
          <m-box id="lustre-loader" :motionSurface="loader" :width="56" :height="56" />
        </m-row>
        <m-text v-if="!loadingSupported" id="lustre-loading-limit" variant="caption" tone="muted">{{
          pt
            ? 'Neste renderizador, o placeholder permanece estático.'
            : 'This renderer keeps the placeholder static.'
        }}</m-text>
        <m-row gap="sm" wrap>
          <m-button
            v-for="kind in ['dots', 'bars', 'ring'] as const"
            :key="kind"
            :id="`lustre-loader-${kind}`"
            size="sm"
            variant="secondary"
            @click="loaderStyle = kind"
            >{{ kind }}</m-button
          >
          <m-button
            id="lustre-loading-toggle"
            size="sm"
            variant="ghost"
            @click="loading = !loading"
            >{{ loading ? (pt ? 'Pronto' : 'Ready') : pt ? 'Carregar' : 'Load' }}</m-button
          >
        </m-row>
        <m-button
          id="lustre-busy"
          :loading="loading"
          loadingIndicator="ring"
          :loadingText="pt ? 'Preparando sua edição…' : 'Preparing your edition…'"
          >{{ pt ? 'Edição pronta' : 'Edition ready' }}</m-button
        >
      </m-card>
      <m-card gap="sm">
        <m-text variant="overline" tone="muted">{{
          pt ? 'CORES DESCOBERTAS' : 'COLOURS DISCOVERED'
        }}</m-text>
        <m-text
          id="lustre-amount"
          :motionSurface="amount"
          :text="countText"
          variant="display"
          :style="{ fontVariantNumeric: 'tabular-nums' }"
        />
        <m-row wrap gap="sm">
          <m-button id="lustre-roll" size="sm" @click="roll">{{
            pt ? 'Outra perspectiva' : 'Another perspective'
          }}</m-button>
        </m-row>
      </m-card>
      <m-button
        id="lustre-circle-toggle"
        :disabled="!circularSupported"
        variant="secondary"
        @click="toggleCircle"
        >{{ concealed ? (pt ? 'Revelar' : 'Reveal') : pt ? 'Recolher' : 'Conceal' }}</m-button
      >
      <m-text v-if="!circularSupported" variant="caption" tone="muted">{{
        pt
          ? 'A revelação circular está disponível em Web e iOS.'
          : 'Circular reveal is available on Web and iOS.'
      }}</m-text>
      <m-box
        id="lustre-circle"
        :motionSurface="panel"
        radius="lg"
        :backgroundColor="theme.colors.primarySoft"
        :height="160"
      >
        <m-column padding="lg" gap="md" justify="center">
          <m-text variant="title">{{
            pt ? 'Um detalhe para guardar.' : 'A detail to keep.'
          }}</m-text>
          <m-button id="lustre-inside" size="sm" variant="ghost" @click="presses++">{{
            pt ? 'Guardar' : 'Keep this'
          }}</m-button>
        </m-column>
      </m-box>
      <m-button id="lustre-current" variant="ghost" @click="navigation.push('/showcase/current')">{{
        pt ? 'Explorar Current →' : 'Explore Current →'
      }}</m-button>
    </m-column>
  </m-screen>
</template>
