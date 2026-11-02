<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { ref, markRaw, onBeforeUnmount } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { createKineticMotion } from '../kinetic-motion'
import { useCatalog } from '../context'

const { t } = useCatalogLocale()

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
        <m-button variant="ghost" size="sm" @click="navigation.back('/showcase')">{{
          t('← Showcase')
        }}</m-button>
        <m-text variant="overline" tone="primary">{{ t('09 / KINETIC') }}</m-text>
      </m-row>
      <m-column gap="xs">
        <m-text as="h1" variant="display">{{ t('Made to move.') }}</m-text>
        <m-text tone="muted">{{ t('One idea. Three places to land.') }}</m-text>
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
          :accessibilityLabel="t('Field notes')"
          @click="clicks++"
        >
          <m-row justify="between">
            <m-text variant="overline" tone="primary">{{ t('FIELD NOTES') }}</m-text>
            <m-icon name="sparkles" :size="28" tone="primary" />
          </m-row>
          <m-text variant="title">{{ t('Stay curious.') }}</m-text>
          <m-row justify="between">
            <m-text variant="caption" tone="muted">{{ t('VOL. 01 / 2026') }}</m-text>
            <m-text variant="caption" tone="primary">↔</m-text>
          </m-row>
        </m-card>
        <m-text v-else tone="primary">{{ t('A little room to begin again.') }}</m-text>
      </m-column>
      <m-row justify="center" gap="sm">
        <m-button
          size="sm"
          variant="secondary"
          :disabled="!mounted || disabled"
          @click="motion?.move(-40)"
          >{{ t('Left') }}</m-button
        >
        <m-button
          size="sm"
          variant="secondary"
          :disabled="!mounted || disabled"
          @click="motion?.move(0)"
          >{{ t('Center') }}</m-button
        >
        <m-button
          size="sm"
          variant="secondary"
          :disabled="!mounted || disabled"
          @click="motion?.move(40)"
          >{{ t('Right') }}</m-button
        >
      </m-row>
      <m-text id="kinetic-status" variant="caption" tone="muted">{{ t(status) }}</m-text>
      <m-text id="kinetic-count" variant="caption"
        >{{ t(clicks) }}{{ t(' activations · base ') }}{{ t(scale.toFixed(2)) }}</m-text
      >
      <m-row gap="sm" wrap>
        <m-button
          variant="secondary"
          size="sm"
          :disabled="!mounted"
          @click="retarget(scale === 1.08 ? 0.94 : 1.08)"
          >{{ t('Retarget spring') }}</m-button
        >
        <m-button variant="secondary" size="sm" :disabled="!mounted" @click="pause">{{
          t(paused ? 'Resume spring' : 'Pause spring')
        }}</m-button>
        <m-button variant="secondary" size="sm" :disabled="!mounted" @click="hold">{{
          t('Retarget while held')
        }}</m-button>
      </m-row>
      <m-row gap="sm" wrap>
        <m-button variant="ghost" size="sm" @click="disabled = !disabled">{{
          t(disabled ? 'Enable card' : 'Disable card')
        }}</m-button>
        <m-button variant="ghost" size="sm" @click="mounted = !mounted">{{
          t(mounted ? 'Remove card' : 'Mount card')
        }}</m-button>
        <m-button variant="ghost" size="sm" @click="sheet = true">{{ t('Open notes') }}</m-button>
      </m-row>
      <m-sheet
        v-model:open="sheet"
        :title="t('A note to keep')"
        :closeLabel="t('Close notes')"
        gap="md"
      >
        <m-text variant="title">{{ t('Good things take a little motion.') }}</m-text>
        <m-text tone="muted">{{
          t('Pull the handle to close, or use the close button. Your place stays here.')
        }}</m-text>
        <m-input :label="t('Your note')" :placeholder="t('Something worth remembering')" />
        <m-button @click="sheet = false">{{ t('Keep this thought') }}</m-button>
      </m-sheet>
    </m-column>
  </m-screen>
</template>
