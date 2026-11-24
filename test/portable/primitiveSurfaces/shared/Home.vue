<script setup lang="ts">
import { reactive } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'

const state = reactive({
  status: 'Ready' as string,
  clicks: 0 as number,
  async move(): Promise<void> {
    try {
      button.set({ x: 12 })
      card.set({ x: 16 })
      const playback = text.animate(
        { x: [null, 20], opacity: [0.5, 1] },
        { type: 'tween', duration: 100 },
      )
      const finished = await playback.finished
      state.status = finished ? 'Moved' : 'Interrupted'
    } catch {
      state.status = 'Unavailable'
    }
  },
  reset(): void {
    try {
      button.set({ x: 0 })
      card.set({ x: 0 })
      text.set({ x: 0, opacity: 1 })
      state.status = 'Reset'
    } catch {
      state.status = 'Unavailable'
    }
  },
})
const button = createMotionSurface()
const card = createMotionSurface()
const text = createMotionSurface()
</script>

<template>
  <MColumn gap="sm" :width="360">
    <MText id="surface-text" :motionSurface="text">Motion primitives</MText>
    <MButton
      id="surface-button"
      text="Surface button"
      :motionSurface="button"
      @click="() => (state.clicks += 1)"
    />
    <MCard
      id="surface-card"
      accessibilityLabel="Surface card"
      :motionSurface="card"
      interactive
      @click="() => (state.clicks += 1)"
    >
      <MText>Card content</MText>
    </MCard>
    <MButton text="Move" @click="() => state.move()" />
    <MButton text="Reset" @click="() => state.reset()" />
    <MText>{{ state.status + ' / Clicks ' + state.clicks }}</MText>
  </MColumn>
</template>
