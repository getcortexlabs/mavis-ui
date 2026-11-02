<script setup lang="ts">
import { markRaw, onBeforeUnmount, ref } from 'vue'
import {
  createMotionScrollSource,
  createMotionSurface,
  createMotionRegion,
  whenMotionAvailable,
} from '@getcortexlabs/mavis-core/experimental'
import { MScreen, MColumn, MCard, MText, MButton, MBox } from 'mavis-renderer'
const source = markRaw(createMotionScrollSource())
const card = markRaw(createMotionSurface())
const button = markRaw(createMotionSurface())
const region = markRaw(createMotionRegion())
const wide = ref(false)
let removePointer: (() => void) | undefined
const releaseScroll = source.onAvailable(() =>
  card.onAvailable(() => {
    const link = card.scrollLinked(source, { y: [0, 40], opacity: [1, 0.5] }, { range: [0, 200] })
    return () => link.dispose()
  }),
)
const releaseButton = whenMotionAvailable([region, button], () => {
  const scale = button.use((owner) => {
    const input = owner.motionValue(1.04)
    const spring = owner.springValue(input)
    owner.bind({ scale: spring })
  })
  removePointer = button.use((owner) => {
    const pointer = owner.pointerFollow(region, { range: { x: [-8, 8] } })
    owner.bind({ x: pointer.x })
  })
  return () => {
    removePointer?.()
    scale()
  }
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
      <MBox :motionRegion="region">
        <MColumn :width="wide ? 300 : 190">
          <MButton id="consumer-motion-button" :motionSurface="button" @click="wide = !wide">{{
            wide ? 'A wider installed control' : 'Resize installed control'
          }}</MButton>
        </MColumn>
      </MBox>
      <MButton @click="removePointer?.()">Remove installed pointer</MButton>
      <MBox :height="1200" />
    </MColumn>
  </MScreen>
</template>
