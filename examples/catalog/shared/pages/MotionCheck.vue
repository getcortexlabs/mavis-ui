<script setup lang="ts">
import { ref, onBeforeUnmount, markRaw } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { animateStudioSurface } from '../studio-motion'
import { defineTheme, mavis, midnight } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const surface = markRaw(createMotionSurface())
const result = ref('App base + component press')
let timer: ReturnType<typeof setTimeout> | undefined
let generation = 0
const animateApp = () => {
  const current = ++generation
  result.value = 'Animating to 1.20 · hold the button'
  const handle = animateStudioSurface(surface)
  void handle.finished.then((finished) => {
    if (current === generation)
      result.value = finished ? 'Finished · base 1.20' : 'Cancelled · finished: false'
  })
}
const arm = () => {
  clearTimeout(timer)
  surface.set({ scale: 1.1 })
  result.value = 'Hold now · animation starts in 1 second'
  timer = setTimeout(() => {
    if (surface.available) animateApp()
  }, 1000)
}
onBeforeUnmount(() => {
  clearTimeout(timer)
  generation++
})
const { setTheme } = useMavisTheme()
const dark = ref(false)
const disabled = ref(false)
const mounted = ref(true)
const visible = ref(false)
const clicks = ref(0)
setTheme(defineTheme({ name: 'motion-light', motion: { pressScale: 0.96 } }, mavis))
const changeTheme = () => {
  dark.value = !dark.value
  setTheme(
    defineTheme(
      {
        name: dark.value ? 'motion-dark' : 'motion-light',
        motion: { pressScale: dark.value ? 0.9 : 0.96 },
      },
      dark.value ? midnight : mavis,
    ),
  )
}
</script>

<template>
  <m-screen>
    <m-column padding="lg" gap="md">
      <m-text variant="overline">MAVIS · MOTION CHECK</m-text>
      <m-text as="h1" variant="heading">Press and reveal</m-text>
      <m-text tone="muted">{{ dark ? 'Midnight · scale 0.90' : 'Mavis · scale 0.96' }}</m-text>
      <m-column v-if="mounted" gap="md">
        <m-button
          id="motion-button"
          :style="{ width: '80%', alignSelf: 'center' }"
          :motionSurface="surface"
          :disabled="disabled"
          @click="clicks++"
          >Hold the button</m-button
        >
        <m-card
          id="motion-card"
          interactive
          :disabled="disabled"
          accessibilityLabel="Hold the card"
          @click="clicks++"
        >
          <m-text variant="heading">Hold the card</m-text>
          <m-text tone="muted">The whole surface responds.</m-text>
        </m-card>
        <m-reveal id="motion-content" :show="visible">
          <m-card gap="sm">
            <m-text variant="heading">A little more context.</m-text>
            <m-button variant="secondary" @click="clicks++">Inside the reveal</m-button>
          </m-card>
        </m-reveal>
      </m-column>
      <m-text id="motion-result" variant="caption" tone="muted">{{ result }}</m-text>
      <m-row gap="sm" wrap>
        <m-button variant="secondary" :disabled="!mounted" @click="surface.set({ scale: 1.1 })"
          >Base 1.10</m-button
        >
        <m-button variant="secondary" :disabled="!mounted" @click="surface.set({ scale: 1.2 })"
          >Base 1.20</m-button
        >
        <m-button variant="secondary" :disabled="!mounted" @click="arm">Animate and hold</m-button>
      </m-row>
      <m-text id="motion-count">{{ clicks }} activations</m-text>
      <m-row gap="sm">
        <m-button :grow="1" variant="secondary" @click="visible = !visible">{{
          visible ? 'Hide content' : 'Show content'
        }}</m-button>
        <m-button :grow="1" variant="secondary" @click="changeTheme">Change theme</m-button>
      </m-row>
      <m-row gap="sm">
        <m-button :grow="1" variant="ghost" @click="disabled = !disabled">{{
          disabled ? 'Enable feedback' : 'Disable feedback'
        }}</m-button>
        <m-button :grow="1" variant="ghost" @click="mounted = !mounted">{{
          mounted ? 'Unmount' : 'Mount'
        }}</m-button>
      </m-row>
    </m-column>
  </m-screen>
</template>
