<script setup lang="ts">
import { markRaw, ref } from 'vue'
import { createMotionRegion, createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { useMavisWebMotion } from '@getcortexlabs/mavis-web/experimental'
import { MBox, MButton } from '@getcortexlabs/mavis-web'
definePageMeta({ pageTransition: { name: 'motion-arrival', mode: 'out-in' } })
const region = markRaw(createMotionRegion())
const target = markRaw(createMotionSurface())
const active = ref(true)
const arrivals = ref(0)
useMavisWebMotion(region, (scope, element) => {
  scope.viewportEnter(element.querySelector<HTMLElement>('#arrival-button')!, {
    keyframes: { y: [22, 0] },
    transition: { duration: 500 },
  })
  arrivals.value++
})
await useAsyncData('motion-arrival', () => $fetch('/api/profile'))
</script>
<template>
  <main>
    <NuxtLink to="/motion-entry">Leave horizons</NuxtLink>
    <MBox :motionRegion="region">
      <MButton id="arrival-button" :motionSurface="target">Arrival {{ arrivals }}</MButton>
    </MBox>
    <button @click="active = !active">
      {{ active ? 'Deactivate horizons' : 'Activate horizons' }}
    </button>
    <KeepAlive><HorizonsScene v-if="active" /></KeepAlive>
  </main>
</template>
