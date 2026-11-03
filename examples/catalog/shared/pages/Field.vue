<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref } from 'vue'
import {
  createMotionSurface,
  type MotionControlledPlayback,
  type MotionSensor,
  type MotionSurface,
} from '@getcortexlabs/mavis-core/experimental'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalogLocale } from '../locale'
import { useCatalog } from '../context'
const { theme } = useMavisTheme()
const { locale } = useCatalogLocale(),
  { navigation } = useCatalog()
const pt = computed(() => locale.value === 'pt')
const falling = markRaw(createMotionSurface()),
  compass = markRaw(createMotionSurface())
const edition = ref(0),
  ready = ref(false),
  feedback = ref(false),
  paused = ref(false),
  status = ref('idle')
const sensorStatus = ref('idle'),
  permission = ref(''),
  sensorPaused = ref(false)
let motion: MotionSurface | undefined, playback: MotionControlledPlayback | undefined
let rotation: MotionSensor | undefined, gravity: MotionSensor | undefined
let operation = 0
const stops = [
  falling.use((value) => {
    motion = value
    ready.value = true
    return () => {
      operation++
      motion = playback = undefined
      ready.value = paused.value = false
    }
  }),
  compass.use((value) => {
    const input = value.sensor('rotation', {
      onStatus: (next) => {
        sensorStatus.value = next
      },
    })
    const pull = value.sensor('gravity')
    rotation = input
    gravity = pull
    value.bind({
      rotate: input.z.to([-Math.PI, Math.PI], [-180, 180]),
      x: pull.x.to([-10, 10], [-48, 48]),
    })
    sensorPaused.value = false
    return () => {
      rotation = gravity = undefined
      permission.value = ''
      sensorStatus.value = 'idle'
    }
  }),
]
onBeforeUnmount(() => stops.forEach((stop) => stop()))
function drop(toss = false) {
  if (!motion) return
  const current = ++operation
  if (!toss) motion.set({ y: 0 })
  playback = motion.animate(
    { y: 160 },
    {
      type: 'gravity',
      acceleration: 1800,
      restitution: 0.55,
      ...(toss ? { velocity: -600 } : {}),
      haptic: feedback.value ? 'light' : false,
    },
  )
  status.value = 'running'
  paused.value = false
  void playback.finished.then((completed) => {
    if (current === operation) status.value = completed ? 'completed' : 'cancelled'
  })
}
function pause() {
  if (!playback) return
  paused.value ? playback.resume() : playback.pause()
  paused.value = playback.paused
}
async function enable() {
  const input = rotation,
    pull = gravity
  if (!input || !pull) return
  // Call both APIs before yielding so browser permission retains user activation.
  const requests = [input.requestPermission(), pull.requestPermission()]
  const result = await Promise.all(requests)
  if (rotation === input) permission.value = result.join(' / ')
}
function pauseSensors() {
  if (!rotation || !gravity) return
  sensorPaused.value = !sensorPaused.value
  for (const input of [rotation, gravity]) sensorPaused.value ? input.pause() : input.resume()
}
</script>
<template>
  <m-screen scroll
    ><m-column padding="lg" gap="lg">
      <m-button variant="ghost" @click="navigation.back('/showcase')">← Showcase</m-button>
      <m-text variant="overline" tone="accent">21 / FIELD</m-text>
      <m-text variant="display">{{ pt ? 'Em movimento.' : 'In motion.' }}</m-text>
      <m-text>{{
        pt ? 'Solte, lance de novo e mude de direção.' : 'Drop, toss again and change direction.'
      }}</m-text>
      <m-column :height="260" padding="md" :backgroundColor="theme.colors.elevated" radius="lg">
        <m-button :key="edition" id="field-ball" :motionSurface="falling" @click="drop(true)">{{
          pt ? 'Lançar' : 'Toss'
        }}</m-button>
      </m-column>
      <m-row gap="sm" wrap>
        <m-button id="field-drop" :disabled="!ready" @click="drop()">{{
          pt ? 'Soltar' : 'Drop'
        }}</m-button>
        <m-button id="field-toss" :disabled="!ready" @click="drop(true)">{{
          pt ? 'Relançar' : 'Toss again'
        }}</m-button>
        <m-button id="field-pause" variant="secondary" @click="pause">{{
          paused ? (pt ? 'Continuar' : 'Resume') : pt ? 'Pausar' : 'Pause'
        }}</m-button>
        <m-button id="field-seek" variant="secondary" @click="playback && (playback.progress = 0.5)"
          >50%</m-button
        >
        <m-button id="field-remount" variant="ghost" @click="edition++">{{
          pt ? 'Recriar' : 'Remount'
        }}</m-button>
        <m-button id="field-feedback" variant="ghost" @click="feedback = !feedback"
          >{{ pt ? 'Resposta tátil' : 'Haptics' }}: {{ feedback ? 'on' : 'off' }}</m-button
        >
      </m-row>
      <m-text id="field-status" variant="caption">{{ status }}</m-text>
      <m-text variant="title">{{
        pt ? 'Siga sua orientação.' : 'Follow your orientation.'
      }}</m-text>
      <m-box :height="120" padding="lg" :backgroundColor="theme.colors.elevated" radius="lg">
        <m-box
          :key="edition"
          id="field-compass"
          :motionSurface="compass"
          :width="64"
          :height="64"
          :backgroundColor="theme.colors.accent"
          radius="lg"
        />
      </m-box>
      <m-text>{{
        pt
          ? 'O movimento depende dos sensores e da permissão do dispositivo.'
          : 'Motion depends on device sensors and permission.'
      }}</m-text>
      <m-row gap="sm" wrap>
        <m-button id="field-enable" @click="enable">{{
          pt ? 'Ativar sensores' : 'Enable sensors'
        }}</m-button>
        <m-button id="field-sensor-pause" variant="secondary" @click="pauseSensors">{{
          sensorPaused ? (pt ? 'Continuar' : 'Resume') : pt ? 'Pausar' : 'Pause'
        }}</m-button>
        <m-button id="field-recenter" variant="ghost" @click="rotation?.recenter()">{{
          pt ? 'Centralizar' : 'Recenter'
        }}</m-button>
      </m-row>
      <m-text id="field-sensor-status" variant="caption">{{ sensorStatus }}</m-text>
      <m-text id="field-permission" variant="caption">{{ permission }}</m-text>
    </m-column></m-screen
  >
</template>
