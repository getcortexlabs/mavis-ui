<script setup lang="ts">
import { ref, markRaw, onBeforeUnmount } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { createKineticMotion } from '../kinetic-motion'
import { useCatalog } from '../context'

const { theme } = useMavisTheme()
const { navigation } = useCatalog()
const surface = markRaw(createMotionSurface())
const mounted = ref(true)
const disabled = ref(false)
const paused = ref(false)
const clicks = ref(0)
const scale = ref(1)
const sheet = ref(false)
const status = ref('Drag. Catch. Let go.')
let motion: ReturnType<typeof createKineticMotion> | undefined
let timer: ReturnType<typeof setTimeout> | undefined
const remove = surface.onAvailable(() => {
  motion = createKineticMotion(surface)
  scale.value = 1
  paused.value = false
  return () => {
    motion = undefined
    clearTimeout(timer)
  }
})
const retarget = (value: number) => {
  scale.value = value
  motion?.scale.set(value)
}
const hold = () => {
  clearTimeout(timer)
  retarget(1)
  status.value = 'Hold the card · scale changes in one second'
  timer = setTimeout(() => {
    retarget(1.08)
    status.value = 'A new scale. The same press.'
  }, 1000)
}
const pause = () => {
  paused.value = !paused.value
  if (paused.value) motion?.follower.pause()
  else motion?.follower.resume()
}
onBeforeUnmount(() => {
  remove()
  clearTimeout(timer)
})
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="md">
      <m-row justify="between">
        <m-button variant="ghost" size="sm" @click="navigation.back('/showcase')"
          >← Showcase</m-button
        >
        <m-text variant="overline" tone="primary">09 / KINETIC</m-text>
      </m-row>
      <m-column gap="xs">
        <m-text as="h1" variant="display">Made to move.</m-text>
        <m-text tone="muted">One idea. Three places to land.</m-text>
      </m-column>
      <m-column
        :height="300"
        justify="center"
        align="center"
        radius="lg"
        :backgroundColor="theme.colors.primarySoft"
      >
        <m-card
          v-if="mounted"
          id="kinetic-card"
          :motionSurface="surface"
          interactive
          :disabled="disabled"
          :width="220"
          :height="240"
          padding="lg"
          gap="md"
          accessibilityLabel="Field notes"
          @click="clicks++"
        >
          <m-row justify="between">
            <m-text variant="overline" tone="primary">FIELD NOTES</m-text>
            <m-icon name="sparkles" :size="28" tone="primary" />
          </m-row>
          <m-text variant="title">Stay curious.</m-text>
          <m-row justify="between">
            <m-text variant="caption" tone="muted">VOL. 01 / 2026</m-text>
            <m-text variant="caption" tone="primary">↔</m-text>
          </m-row>
        </m-card>
        <m-text v-else tone="primary">A little room to begin again.</m-text>
      </m-column>
      <m-row justify="center" gap="sm">
        <m-button
          size="sm"
          variant="secondary"
          :disabled="!mounted || disabled"
          @click="motion?.move(-40)"
          >Left</m-button
        >
        <m-button
          size="sm"
          variant="secondary"
          :disabled="!mounted || disabled"
          @click="motion?.move(0)"
          >Center</m-button
        >
        <m-button
          size="sm"
          variant="secondary"
          :disabled="!mounted || disabled"
          @click="motion?.move(40)"
          >Right</m-button
        >
      </m-row>
      <m-text id="kinetic-status" variant="caption" tone="muted">{{ status }}</m-text>
      <m-text id="kinetic-count" variant="caption"
        >{{ clicks }} activations · base {{ scale.toFixed(2) }}</m-text
      >
      <m-row gap="sm" wrap>
        <m-button
          variant="secondary"
          size="sm"
          :disabled="!mounted"
          @click="retarget(scale === 1.08 ? 0.94 : 1.08)"
          >Retarget spring</m-button
        >
        <m-button variant="secondary" size="sm" :disabled="!mounted" @click="pause">{{
          paused ? 'Resume spring' : 'Pause spring'
        }}</m-button>
        <m-button variant="secondary" size="sm" :disabled="!mounted" @click="hold"
          >Retarget while held</m-button
        >
      </m-row>
      <m-row gap="sm" wrap>
        <m-button variant="ghost" size="sm" @click="disabled = !disabled">{{
          disabled ? 'Enable card' : 'Disable card'
        }}</m-button>
        <m-button variant="ghost" size="sm" @click="mounted = !mounted">{{
          mounted ? 'Remove card' : 'Mount card'
        }}</m-button>
        <m-button variant="ghost" size="sm" @click="sheet = true">Open notes</m-button>
      </m-row>
      <m-sheet v-model:open="sheet" title="A note to keep" closeLabel="Close notes" gap="md">
        <m-text variant="title">Good things take a little motion.</m-text>
        <m-text tone="muted"
          >Pull the handle to close, or use the close button. Your place stays here.</m-text
        >
        <m-input label="Your note" placeholder="Something worth remembering" />
        <m-button @click="sheet = false">Keep this thought</m-button>
      </m-sheet>
    </m-column>
  </m-screen>
</template>
