<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref, watch } from 'vue'
import {
  createMotionSurface,
  type MotionSurface,
  type MotionBlur,
  type MotionShape,
  type MotionLiquid,
  type MotionImagePlayback,
  type MotionImageEffectName,
} from '@getcortexlabs/mavis-core/experimental'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import { useCatalogLocale } from '../locale'
import { formaImage } from '../assets/forma-image'
import { avatarImage } from '../assets/avatar-image'
import ThemeSwitch from '../ThemeSwitch.vue'

const { navigation } = useCatalog(),
  { locale } = useCatalogLocale(),
  { theme } = useMavisTheme()
const pt = computed(() => locale.value === 'pt')
const surface = () => markRaw(createMotionSurface())
const sky = surface(),
  glass = surface(),
  outline = surface(),
  photo = surface(),
  icon = surface()
const mounted = ref(true),
  edition = ref(0),
  snow = ref(true),
  softened = ref(false),
  diamond = ref(false)
const src = ref(formaImage),
  ready = ref(false),
  liquidSupported = ref(false),
  symbolSupported = ref(false)
const flowing = ref(false),
  paused = ref(false),
  controllable = ref(false),
  status = ref('ready'),
  error = ref('')
let blur: MotionBlur | undefined,
  shape: MotionShape | undefined,
  pixels: MotionSurface | undefined,
  liquid: MotionLiquid | undefined,
  animation: MotionImagePlayback | undefined,
  burst: (() => void) | undefined
const paths = ['M12 12 L88 12 L88 88 L12 88 Z', 'M50 0 L100 50 L50 100 L0 50 Z']
const stop = [
  sky.use((motion) => {
    // Each toggle releases its previous emitter; the presentation owns late button actions.
    const unwatch = watch(
      snow,
      (value, _, cleanup) => {
        if (value) {
          const emitter = motion.particles({
            source: 'top',
            angle: 90,
            rate: 24,
            size: 5,
            velocity: 28,
            spread: 25,
            colors: ['#f6dbed', '#c6d6ff', '#ffffff'],
          })
          cleanup(() => emitter.dispose())
        }
      },
      { immediate: true },
    )
    burst = () => {
      motion.confetti({ count: 60, colors: ['#B83670', '#4262C4', '#E9BF74'] })
    }
    return () => {
      unwatch()
      burst = undefined
    }
  }),
  glass.use((motion) => {
    blur = motion.blur({ amount: softened.value ? 0.7 : 0, radius: 18 })
    return () => {
      blur = undefined
    }
  }),
  outline.use((motion) => {
    shape = motion.shape({
      d: paths[diamond.value ? 1 : 0]!,
      viewBox: [0, 0, 100, 100],
      fill: '#4262C4',
      stroke: '#E9BF74',
      strokeWidth: 3,
    })
    return () => {
      shape = undefined
    }
  }),
  photo.use((motion) => {
    pixels = motion
    ready.value = true
    liquidSupported.value = motion.supports('liquid')
    return () => {
      pixels = undefined
      liquid = undefined
      animation = undefined
      ready.value = flowing.value = paused.value = controllable.value = false
    }
  }),
  icon.use((motion) => {
    symbolSupported.value = motion.supports('symbol')
  }),
]
function soften() {
  softened.value = !softened.value
  blur?.animate(softened.value ? 0.7 : 0, { type: 'spring', duration: 700, bounce: 0 })
}
function morph() {
  diamond.value = !diamond.value
  shape?.animate(
    { d: paths[diamond.value ? 1 : 0]! },
    { type: 'spring', duration: 800, bounce: 0.12 },
  )
}
function flow() {
  if (!pixels) return
  liquid?.dispose()
  liquid = undefined
  flowing.value = !flowing.value
  if (flowing.value) liquid = pixels.liquid({ intensity: 0.7, duration: 5000 })
}
async function effect(name: MotionImageEffectName, prepared = false) {
  const current = pixels
  if (!current) return
  error.value = ''
  status.value = 'preparing'
  liquid?.dispose()
  liquid = undefined
  flowing.value = false
  try {
    const operation = await current.imageEffect(name, {
      duration: 1600,
      paused: prepared,
      ...(name === 'dissolve' ? { to: src.value === formaImage ? avatarImage : formaImage } : {}),
    })
    if (!current.available) {
      operation.stop()
      return
    }
    animation = operation
    paused.value = operation.paused
    controllable.value = name !== 'distortion'
    status.value = prepared ? 'paused' : 'playing'
    const completed = await operation.finished
    if (animation === operation) {
      status.value = completed ? 'completed' : 'cancelled'
      paused.value = controllable.value = false
      animation = undefined
    }
  } catch (reason) {
    error.value = String(reason)
    status.value = 'failed'
  }
}
function playPause() {
  if (!animation) return
  if (paused.value) animation.resume()
  else animation.pause()
  paused.value = animation.paused
}
function seek(value: number) {
  if (animation && controllable.value) animation.progress = value
}
onBeforeUnmount(() => stop.forEach((off) => off()))
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-row justify="between"
        ><m-button variant="ghost" size="sm" @click="navigation.back('/showcase')"
          >← Showcase</m-button
        ><ThemeSwitch
      /></m-row>
      <m-text variant="overline" tone="accent">18 / PRISM</m-text>
      <m-text variant="display">{{ pt ? 'Outra forma de ver.' : 'Another way to see.' }}</m-text>
      <m-text tone="muted">{{
        pt ? 'Luz, matéria e pequenos movimentos.' : 'Light, texture and small movements.'
      }}</m-text>
      <m-row wrap gap="sm">
        <m-button id="prism-mount" variant="secondary" @click="mounted = !mounted">{{
          mounted ? (pt ? 'Retirar' : 'Remove') : pt ? 'Montar' : 'Mount'
        }}</m-button>
        <m-button id="prism-replace" variant="secondary" @click="edition++">{{
          pt ? 'Nova edição' : 'New edition'
        }}</m-button>
      </m-row>
      <m-column v-if="mounted" :key="edition" gap="lg">
        <m-box
          id="prism-sky"
          :motionSurface="sky"
          :height="200"
          radius="lg"
          backgroundColor="#231B40"
          :accessibilityHidden="true"
        >
          <m-column padding="lg" justify="center" :height="200"
            ><m-text variant="title" :style="{ color: '#ffffff' }">PRISM / 01</m-text
            ><m-text :style="{ color: '#D5CCE5' }">{{
              pt ? 'Um instante para celebrar.' : 'A moment to celebrate.'
            }}</m-text></m-column
          >
        </m-box>
        <m-row wrap gap="sm"
          ><m-button id="prism-confetti" @click="burst?.()">{{
            pt ? 'Celebrar' : 'Celebrate'
          }}</m-button
          ><m-button id="prism-particles" variant="secondary" @click="snow = !snow">{{
            snow
              ? pt
                ? 'Parar partículas'
                : 'Stop particles'
              : pt
                ? 'Mostrar partículas'
                : 'Show particles'
          }}</m-button></m-row
        >
        <m-card gap="md">
          <m-box
            id="prism-blur"
            :motionSurface="glass"
            :height="110"
            :backgroundColor="theme.colors.accentSoft"
            radius="md"
            ><m-column padding="md"
              ><m-text variant="title">{{ pt ? 'Perto e distante.' : 'Near and far.' }}</m-text
              ><m-text>PRISM / 02</m-text></m-column
            ></m-box
          >
          <m-button id="prism-soften" variant="secondary" @click="soften">{{
            softened ? (pt ? 'Revelar' : 'Reveal') : pt ? 'Suavizar' : 'Soften'
          }}</m-button>
        </m-card>
        <m-card gap="md">
          <m-box
            id="prism-shape"
            :motionSurface="outline"
            :width="160"
            :height="160"
            :accessibilityHidden="true"
          />
          <m-button id="prism-morph" @click="morph">{{
            pt ? 'Mudar a forma' : 'Change the shape'
          }}</m-button>
        </m-card>
        <m-card gap="md">
          <m-image
            id="prism-photo"
            v-model:src="src"
            :motionSurface="photo"
            :alt="pt ? 'Estudo de cor e retrato' : 'Color study and portrait'"
            :aspectRatio="4 / 3"
          />
          <m-text id="prism-ready" variant="caption">{{
            ready ? (pt ? 'Imagem pronta' : 'Image ready') : pt ? 'Carregando' : 'Loading'
          }}</m-text>
          <m-row wrap gap="sm">
            <m-button id="prism-ripple" :disabled="!ready" @click="effect('ripple')">{{
              pt ? 'Onda' : 'Ripple'
            }}</m-button>
            <m-button
              id="prism-distortion"
              :disabled="!ready"
              variant="secondary"
              @click="effect('distortion')"
              >{{ pt ? 'Distorcer ao tocar' : 'Distort on touch' }}</m-button
            >
            <m-button
              id="prism-dissolve"
              :disabled="!ready"
              variant="secondary"
              @click="effect('dissolve')"
              >{{ pt ? 'Trocar imagem' : 'Change image' }}</m-button
            >
            <m-button
              id="prism-prepare"
              :disabled="!ready"
              variant="secondary"
              @click="effect('dissolve', true)"
              >{{ pt ? 'Preparar transição' : 'Prepare transition' }}</m-button
            >
            <m-button
              id="prism-liquid"
              :disabled="!ready || !liquidSupported"
              variant="secondary"
              @click="flow"
              >{{ flowing ? (pt ? 'Parar fluxo' : 'Stop flow') : pt ? 'Fluir' : 'Flow' }}</m-button
            >
          </m-row>
          <m-row wrap gap="sm">
            <m-button
              id="prism-pause"
              :disabled="!controllable"
              size="sm"
              variant="ghost"
              @click="playPause"
              >{{ paused ? (pt ? 'Continuar' : 'Resume') : pt ? 'Pausar' : 'Pause' }}</m-button
            >
            <m-button
              id="prism-seek"
              :disabled="!controllable"
              size="sm"
              variant="ghost"
              @click="seek(0.5)"
              >50%</m-button
            >
            <m-button
              id="prism-reverse"
              :disabled="!controllable"
              size="sm"
              variant="ghost"
              @click="animation?.reverse()"
              >{{ pt ? 'Inverter' : 'Reverse' }}</m-button
            >
            <m-button
              id="prism-finish"
              :disabled="!controllable"
              size="sm"
              variant="ghost"
              @click="animation?.finish()"
              >{{ pt ? 'Concluir' : 'Finish' }}</m-button
            >
            <m-button id="prism-stop" size="sm" variant="ghost" @click="animation?.stop()">{{
              pt ? 'Cancelar' : 'Cancel'
            }}</m-button>
          </m-row>
          <m-text id="prism-status" variant="caption">{{ status }}</m-text>
          <m-text v-if="error" id="prism-error" tone="danger">{{ error }}</m-text>
        </m-card>
        <m-card gap="md">
          <m-icon
            id="prism-icon"
            name="heart"
            systemName="heart.fill"
            :motionSurface="icon"
            :size="48"
            tone="primary"
            :label="pt ? 'Favorito' : 'Favorite'"
          />
          <m-row wrap gap="sm"
            ><m-button
              id="prism-bounce"
              :disabled="!symbolSupported"
              @click="icon.symbolEffect('bounce')"
              >{{ pt ? 'Dar vida' : 'Bring to life' }}</m-button
            ><m-button
              id="prism-pulse"
              :disabled="!symbolSupported"
              variant="secondary"
              @click="icon.symbolEffect('pulse')"
              >{{ pt ? 'Pulsar' : 'Pulse' }}</m-button
            ></m-row
          >
        </m-card>
      </m-column>
    </m-column>
  </m-screen>
</template>
