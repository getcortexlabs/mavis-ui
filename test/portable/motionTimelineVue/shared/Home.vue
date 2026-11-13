<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { createMotionSurface, createMotionRegion } from '@getcortexlabs/mavis-core/experimental'
const first = markRaw(createMotionSurface())
const second = markRaw(createMotionSurface())
const region = markRaw(createMotionRegion())
const status = ref('Ready')
async function play() {
  try {
    const timeline = region.timeline([
      [first, { x: [0, 24] }, { type: 'tween', duration: 100 }],
      [second, { opacity: [0.3, 1] }, { at: '<', type: 'tween', duration: 100 }],
      [first, { x: 0 }, { at: '+20', type: 'tween', duration: 100 }],
    ])
    timeline.pause()
    timeline.resume()
    const finished = await timeline.finished
    status.value = finished ? 'Together' : 'Interrupted'
  } catch {
    status.value = 'Unavailable'
  }
}
</script>
<template>
  <MColumn gap="sm">
    <MBox :motionRegion="region"
      ><MColumn>
        <MBox :motionSurface="first" :height="40"><MText>First</MText></MBox>
        <MBox :motionSurface="second" :height="40"><MText>Second</MText></MBox>
      </MColumn></MBox
    >
    <MButton text="Play together" @click="play" />
    <MText>{{ status }}</MText>
  </MColumn>
</template>
