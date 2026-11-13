<script setup lang="ts">
import { ref, onMounted, markRaw } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
const surface = markRaw(createMotionSurface())
const visible = ref(true)
const setups = ref(0)
const cleanups = ref(0)
const status = ref('Waiting')
onMounted(() => {
  surface.use((child) => {
    setups.value += 1
    status.value = child.available ? 'Ready' : 'Unavailable'
    try {
      child.set({ x: 12 })
    } catch {
      status.value = 'Unavailable'
    }
    return () => {
      cleanups.value += 1
      status.value = 'Cleaned'
    }
  })
})
</script>
<template>
  <MColumn gap="sm">
    <MBox v-if="visible" :motionSurface="surface"><MText>Target</MText></MBox>
    <MButton text="Toggle target" @click="visible = !visible" />
    <MText>{{ status }}</MText
    ><MText>Setups {{ setups }}</MText
    ><MText>Cleanups {{ cleanups }}</MText>
  </MColumn>
</template>
