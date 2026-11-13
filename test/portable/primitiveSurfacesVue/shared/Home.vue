<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
const button = markRaw(createMotionSurface())
const card = markRaw(createMotionSurface())
const text = markRaw(createMotionSurface())
const status = ref('Ready')
const clicks = ref(0)
async function move() {
  try {
    button.set({ x: 12 })
    card.set({ x: 16 })
    const playback = text.animate(
      { x: [null, 20], opacity: [0.5, 1] },
      { type: 'tween', duration: 100 },
    )
    const finished = await playback.finished
    status.value = finished ? 'Moved' : 'Interrupted'
  } catch {
    status.value = 'Unavailable'
  }
}
function reset() {
  try {
    button.set({ x: 0 })
    card.set({ x: 0 })
    text.set({ x: 0, opacity: 1 })
    status.value = 'Reset'
  } catch {
    status.value = 'Unavailable'
  }
}
</script>
<template>
  <MColumn gap="sm" :width="360">
    <MText id="surface-text" :motionSurface="text">Motion primitives</MText>
    <MButton id="surface-button" text="Surface button" :motionSurface="button" @click="clicks++" />
    <MCard
      id="surface-card"
      accessibilityLabel="Surface card"
      :motionSurface="card"
      interactive
      @click="clicks++"
      ><MText>Card content</MText></MCard
    >
    <MButton text="Move" @click="move" />
    <MButton text="Reset" @click="reset" />
    <MText>{{ status + ' / Clicks ' + clicks }}</MText>
  </MColumn>
</template>
