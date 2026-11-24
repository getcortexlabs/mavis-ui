<script setup lang="ts">
import { reactive } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'

const state = reactive({
  status: 'Ready' as string,
  async move(): Promise<void> {
    try {
      const playback = motion.animate(
        { x: [null, 24], opacity: [0.5, 1] },
        { type: 'tween', duration: 120 },
      )
      playback.pause()
      playback.resume()
      const finished = await playback.finished
      state.status = finished ? 'Moved' : 'Interrupted'
    } catch {
      state.status = 'Unavailable'
    }
  },
  reset(): void {
    try {
      motion.set({ x: 0, opacity: 1 })
      state.status = 'Reset'
    } catch {
      state.status = 'Unavailable'
    }
  },
})
const motion = createMotionSurface()
</script>

<template>
  <MColumn gap="sm">
    <MBox :motionSurface="motion" :height="50">
      <MText>Motion</MText>
    </MBox>
    <MButton text="Move" @click="() => state.move()" />
    <MButton text="Reset" @click="() => state.reset()" />
    <MText>{{ state.status }}</MText>
  </MColumn>
</template>
