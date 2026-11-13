<script setup lang="ts">
import { ref, onMounted, markRaw } from 'vue'
import {
  createMotionSurface,
  createMotionRegion,
  whenMotionAvailable,
} from '@getcortexlabs/mavis-core/experimental'
const surface = markRaw(createMotionSurface())
const region = markRaw(createMotionRegion())
const visible = ref(true)
const setups = ref(0)
const cleanups = ref(0)
onMounted(() => {
  whenMotionAvailable([surface, region], () => {
    setups.value += 1
    const stop = surface.onAvailable(() => {})
    return () => {
      stop()
      cleanups.value += 1
    }
  })
})
</script>
<template>
  <MColumn gap="sm">
    <MBox v-if="visible" :motionSurface="surface" :motionRegion="region"
      ><MText>Target</MText></MBox
    >
    <MButton text="Toggle target" @click="visible = !visible" />
    <MText>Setups {{ setups }}</MText>
    <MText>Cleanups {{ cleanups }}</MText>
  </MColumn>
</template>
