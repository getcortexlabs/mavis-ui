<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
const motion = markRaw(createMotionSurface())
const status = ref('Ready')
async function move() {
  try {
    const playback = motion.animate(
      { x: [null, 24], opacity: [0.5, 1] },
      { type: 'tween', duration: 120 },
    )
    playback.pause()
    playback.resume()
    const finished = await playback.finished
    status.value = finished ? 'Moved' : 'Interrupted'
  } catch {
    status.value = 'Unavailable'
  }
}
function reset() {
  try {
    motion.set({ x: 0, opacity: 1 })
    status.value = 'Reset'
  } catch {
    status.value = 'Unavailable'
  }
}
</script>
<template>
  <MColumn gap="sm">
    <MIcon name="sparkles" :size="32" :motionSurface="motion" />
    <MButton text="Move" @click="move" />
    <MButton text="Reset" @click="reset" />
    <MText>{{ status }}</MText>
  </MColumn>
</template>
