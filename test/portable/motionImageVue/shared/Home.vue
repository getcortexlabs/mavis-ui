<script setup lang="ts">
import { ref, onMounted, markRaw } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
const motion = markRaw(createMotionSurface())
const picture = ref('~/assets/gallery-blue.png')
const status = ref('Loading')
const setups = ref(0)
const cleanups = ref(0)
async function move() {
  try {
    const playback = motion.animate({ x: 16, opacity: [0.5, 1] }, { type: 'tween', duration: 120 })
    const finished = await playback.finished
    status.value = finished ? 'Moved' : 'Interrupted'
  } catch {
    status.value = 'Unavailable'
  }
}
onMounted(() => {
  motion.onAvailable(() => {
    setups.value += 1
    status.value = 'Ready'
    return () => {
      cleanups.value += 1
      status.value = 'Unavailable'
    }
  })
})
</script>
<template>
  <MColumn gap="sm" :width="240">
    <MImage :src="picture" alt="Motion artwork" :motionSurface="motion" />
    <MButton text="Move" @click="move" />
    <MButton text="Next picture" @click="picture = '~/assets/gallery-green.png'" />
    <MButton text="Break picture" @click="picture = 'data:image/png;base64,broken'" />
    <MButton text="Restore picture" @click="picture = '~/assets/gallery-blue.png'" />
    <MText>{{ status }}</MText
    ><MText>Setups {{ setups }}</MText
    ><MText>Cleanups {{ cleanups }}</MText>
  </MColumn>
</template>
