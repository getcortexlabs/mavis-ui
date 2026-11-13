<script setup lang="ts">
import { markRaw, onBeforeUnmount, ref } from 'vue'
import {
  createMotionRegion,
  createMotionScrollSource,
  createMotionSurface,
  whenMotionAvailable,
  type MotionScrollLink,
} from '@getcortexlabs/mavis-core/experimental'

const source = markRaw(createMotionScrollSource())
const section = markRaw(createMotionRegion())
const automatic = markRaw(createMotionSurface())
const fallback = markRaw(createMotionSurface())
const height = ref(700)
const mounted = ref(true)
const modes = ref('waiting')
let links: MotionScrollLink[] = []
function inspect() {
  source.refresh()
  modes.value = links.map((link) => link.execution).join(',')
}
const stop = whenMotionAvailable([source, section, automatic, fallback], () => {
  const frames = { y: [0, -80], opacity: [0.4, 1] }
  links = [
    automatic.scrollSection(source, section, frames),
    fallback.scrollSection(source, section, frames, { execution: 'scheduler' }),
  ]
  modes.value = links.map((link) => link.execution).join(',')
  return () => {
    links.forEach((link) => link.dispose())
    links = []
    modes.value = 'released'
  }
})
onBeforeUnmount(stop)
</script>

<template>
  <MScreen id="scroll-check-screen" scroll :motionScroll="source">
    <MColumn padding="lg" gap="md">
      <MText as="h1">One section, two execution paths</MText>
      <MText id="scroll-check-modes">{{ modes }}</MText>
      <MRow gap="sm" wrap>
        <MButton id="scroll-check-refresh" text="Refresh geometry" @click="inspect" />
        <MButton
          id="scroll-check-grow"
          text="Resize section"
          @click="height = height === 700 ? 1000 : 700"
        />
        <MButton id="scroll-check-mount" text="Replace surfaces" @click="mounted = !mounted" />
      </MRow>
      <MBox :height="200" />
      <MColumn id="scroll-check-section" :height="height" :motionRegion="section" gap="lg">
        <MCard v-if="mounted" id="scroll-check-auto" :motionSurface="automatic">
          <MText>Jolt selects the supported backend</MText>
        </MCard>
        <MCard v-if="mounted" id="scroll-check-fallback" :motionSurface="fallback">
          <MText>The same motion through the scheduler</MText>
        </MCard>
      </MColumn>
      <MBox :height="700" />
    </MColumn>
  </MScreen>
</template>
