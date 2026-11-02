<script setup lang="ts">
import { markRaw, onBeforeUnmount, ref } from 'vue'
import {
  createMotionScrollSource,
  createMotionSurface,
} from '@getcortexlabs/mavis-core/experimental'
import { MScreen, MColumn, MCard, MText, MButton, MBox } from 'mavis-renderer'
const source = markRaw(createMotionScrollSource())
const card = markRaw(createMotionSurface())
const button = markRaw(createMotionSurface())
const wide = ref(false)
const releaseScroll = source.onAvailable(() =>
  card.onAvailable(() => {
    const link = card.scrollLinked(source, { y: [0, 40], opacity: [1, 0.5] }, { range: [0, 200] })
    return () => link.dispose()
  }),
)
const releaseButton = button.onAvailable(() => {
  const input = button.motionValue(1.04)
  const spring = button.springValue(input)
  button.bind({ scale: spring, x: spring.to([1, 1.08], [0, 8]) })
})
onBeforeUnmount(() => {
  releaseScroll()
  releaseButton()
})
</script>

<template>
  <MScreen id="consumer-motion-screen" scroll :motionScroll="source">
    <MColumn padding="lg" gap="lg">
      <MCard
        id="consumer-motion-card"
        :motionSurface="card"
        interactive
        accessibilityLabel="Installed motion"
        :height="180"
      >
        <MText variant="title">Installed motion</MText>
      </MCard>
      <MColumn :width="wide ? 300 : 190">
        <MButton id="consumer-motion-button" :motionSurface="button" @click="wide = !wide">{{
          wide ? 'A wider installed control' : 'Resize installed control'
        }}</MButton>
      </MColumn>
      <MBox :height="1200" />
    </MColumn>
  </MScreen>
</template>
