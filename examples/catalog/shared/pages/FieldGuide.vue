<script setup lang="ts">
import { markRaw, ref, onBeforeUnmount } from 'vue'
import {
  createMotionSurface,
  createMotionScrollSource,
  type MotionScrollLink,
} from '@getcortexlabs/mavis-core/experimental'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { createFieldMotion } from '../field-motion'
import { useCatalog } from '../context'

const { theme } = useMavisTheme()
const { navigation } = useCatalog()
const source = markRaw(createMotionScrollSource())
const surface = markRaw(createMotionSurface())
const button = markRaw(createMotionSurface())
const mounted = ref(true)
const scrolling = ref(true)
const compact = ref(false)
const expanded = ref(false)
const largeType = ref(false)
const loading = ref(false)
const fallback = ref(false)
const detail = ref('A changing landscape. The same point of view.')
const count = ref(0)
const execution = ref('Scroll to explore')
let link: MotionScrollLink | undefined
let timer: ReturnType<typeof setTimeout> | undefined
const connect = () => {
  link?.dispose()
  link = createFieldMotion(source, surface, fallback.value ? 'scheduler' : 'auto')
}
const release = source.onAvailable(() =>
  surface.onAvailable(() => {
    connect()
    return () => {
      link?.dispose()
      link = undefined
    }
  }),
)
const releaseButton = button.onAvailable(() => {
  button.set({ scale: 1.04 })
})
const changeMode = () => {
  fallback.value = !fallback.value
  if (source.available && surface.available) connect()
}
const refresh = () => {
  if (source.available) source.refresh()
  inspect()
}
const inspect = () => {
  execution.value = link?.execution ?? 'Released'
}
const change = () => {
  expanded.value = !expanded.value
  detail.value = expanded.value
    ? 'Look closer. Every small detail changes the shape of the story, without losing its place.'
    : 'A changing landscape. The same point of view.'
}
const hold = () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    change()
    largeType.value = !largeType.value
    loading.value = !loading.value
  }, 1000)
}
onBeforeUnmount(() => {
  release()
  releaseButton()
  clearTimeout(timer)
})
</script>

<template>
  <m-screen id="field-screen" :scroll="scrolling" :motionScroll="source">
    <m-column padding="lg" gap="lg">
      <m-row justify="between">
        <m-button variant="ghost" size="sm" @click="navigation.back('/showcase')"
          >← Showcase</m-button
        >
        <m-text variant="overline" tone="primary">10 / FIELD GUIDE</m-text>
      </m-row>
      <m-column gap="xs">
        <m-text as="h1" variant="display">Go a little further.</m-text>
        <m-text tone="muted">A story that moves with you.</m-text>
      </m-column>
      <m-column
        :height="expanded ? 500 : 420"
        align="center"
        justify="center"
        radius="lg"
        :backgroundColor="theme.colors.primarySoft"
      >
        <m-card
          v-if="mounted"
          id="field-card"
          :motionSurface="surface"
          interactive
          :width="expanded ? '94%' : '82%'"
          padding="lg"
          gap="md"
          accessibilityLabel="Open field notes"
          @click="count++"
        >
          <m-row justify="between"
            ><m-text variant="overline" tone="primary">THE OPEN ROAD</m-text
            ><m-icon name="compass" :size="28" tone="primary"
          /></m-row>
          <m-text :variant="largeType ? 'display' : 'title'">Find your own way.</m-text>
          <m-text tone="muted">{{ detail }}</m-text>
          <m-text variant="caption" tone="primary">FIELD NOTES / 001</m-text>
        </m-card>
        <m-text v-else tone="primary">Ready for a fresh perspective.</m-text>
      </m-column>
      <m-row gap="sm" wrap>
        <m-button
          id="field-button"
          :motionSurface="button"
          :loading="loading"
          loadingText="A longer loading label…"
          variant="secondary"
          @click="change"
          >{{ expanded ? 'A wider perspective' : 'Change shape' }}</m-button
        >
        <m-button size="sm" variant="ghost" @click="hold">Change while held</m-button>
        <m-button size="sm" variant="ghost" @click="largeType = !largeType">Change type</m-button>
      </m-row>
      <m-row gap="sm" wrap>
        <m-button size="sm" variant="ghost" @click="mounted = !mounted">{{
          mounted ? 'Remove scene' : 'Mount scene'
        }}</m-button>
        <m-button size="sm" variant="ghost" @click="scrolling = !scrolling">{{
          scrolling ? 'Detach scroll' : 'Attach scroll'
        }}</m-button>
        <m-button
          size="sm"
          variant="ghost"
          @click="surface.available && surface.animate({ y: 12 }, { duration: 0 })"
          >Release position</m-button
        >
        <m-button size="sm" variant="ghost" @click="compact = !compact">{{
          compact ? 'Long story' : 'Short story'
        }}</m-button>
        <m-button size="sm" variant="ghost" @click="changeMode">{{
          fallback ? 'Use automatic' : 'Use fallback'
        }}</m-button>
        <m-button size="sm" variant="ghost" @click="refresh">Refresh scene</m-button>
      </m-row>
      <m-text id="field-status" variant="caption" tone="muted"
        >{{ execution }} · {{ count }} activations</m-text
      >
      <m-column v-if="!compact" gap="lg">
        <m-card
          v-for="(title, index) in [
            'Leave room for wonder.',
            'Take the quieter road.',
            'Keep something worth sharing.',
            'Start again, somewhere new.',
          ]"
          :key="title"
          padding="lg"
          gap="md"
        >
          <m-text variant="overline" tone="primary">0{{ index + 1 }} / A SMALL REMINDER</m-text>
          <m-text variant="title">{{ title }}</m-text>
          <m-text tone="muted"
            >The best part of a journey rarely follows a straight line. Slow down, look around, and
            make space for the things you did not expect to find.</m-text
          >
        </m-card>
      </m-column>
    </m-column>
  </m-screen>
</template>
