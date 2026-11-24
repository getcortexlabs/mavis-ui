<script setup lang="ts">
import { reactive } from 'vue'
import { createMotionRegion, createMotionSurface } from '@getcortexlabs/mavis-core/experimental'

const state = reactive({
  status: 'Ready' as string,
  async play(): Promise<void> {
    try {
      const timeline = region.timeline([
        [first, { x: [0, 24] }, { type: 'tween', duration: 100 }],
        [second, { opacity: [0.3, 1] }, { at: '<', type: 'tween', duration: 100 }],
        [first, { x: 0 }, { at: '+20', type: 'tween', duration: 100 }],
      ])
      timeline.pause()
      timeline.resume()
      const finished = await timeline.finished
      state.status = finished ? 'Together' : 'Interrupted'
    } catch {
      state.status = 'Unavailable'
    }
  },
})
const first = createMotionSurface()
const second = createMotionSurface()
const region = createMotionRegion()
</script>

<template>
  <MColumn gap="sm">
    <MBox :motionRegion="region">
      <MColumn>
        <MBox :motionSurface="first" :height="40">
          <MText>First</MText>
        </MBox>
        <MBox :motionSurface="second" :height="40">
          <MText>Second</MText>
        </MBox>
      </MColumn>
    </MBox>
    <MButton text="Play together" @click="() => state.play()" />
    <MText>{{ state.status }}</MText>
  </MColumn>
</template>
