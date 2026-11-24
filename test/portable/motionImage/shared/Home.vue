<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'

const state = reactive({
  picture: '~/assets/gallery-blue.png' as string,
  status: 'Loading' as string,
  setups: 0 as number,
  cleanups: 0 as number,
  async move(): Promise<void> {
    try {
      const playback = motion.animate(
        { x: 16, opacity: [0.5, 1] },
        { type: 'tween', duration: 120 },
      )
      const finished = await playback.finished
      state.status = finished ? 'Moved' : 'Interrupted'
    } catch {
      state.status = 'Unavailable'
    }
  },
})
onMounted(() => {
  motion.onAvailable(() => {
    state.setups += 1
    state.status = 'Ready'
    return () => {
      state.cleanups += 1
      state.status = 'Unavailable'
    }
  })
})
const motion = createMotionSurface()
</script>

<template>
  <MColumn gap="sm" :width="240">
    <MImage :src="state.picture" alt="Motion artwork" :motionSurface="motion" />
    <MButton text="Move" @click="() => state.move()" />
    <MButton text="Next picture" @click="() => (state.picture = '~/assets/gallery-green.png')" />
    <MButton text="Break picture" @click="() => (state.picture = 'data:image/png;base64,broken')" />
    <MButton text="Restore picture" @click="() => (state.picture = '~/assets/gallery-blue.png')" />
    <MText>{{ state.status }}</MText>
    <MText>{{ `Setups ${state.setups}` }}</MText>
    <MText>{{ `Cleanups ${state.cleanups}` }}</MText>
  </MColumn>
</template>
