<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import {
  createMotionRegion,
  createMotionSurface,
  whenMotionAvailable,
} from '@getcortexlabs/mavis-core/experimental'

const state = reactive({
  visible: true as boolean,
  setups: 0 as number,
  cleanups: 0 as number,
})
onMounted(() => {
  whenMotionAvailable([surface, region], () => {
    state.setups += 1
    const stop = surface.onAvailable(() => {})
    return () => {
      stop()
      state.cleanups += 1
    }
  })
})
const surface = createMotionSurface()
const region = createMotionRegion()
</script>

<template>
  <MColumn gap="sm">
    <template v-if="state.visible">
      <MBox :motionSurface="surface" :motionRegion="region">
        <MText>Target</MText>
      </MBox>
    </template>
    <MButton text="Toggle target" @click="() => (state.visible = !state.visible)" />
    <MText>{{ `Setups ${state.setups}` }}</MText>
    <MText>{{ `Cleanups ${state.cleanups}` }}</MText>
  </MColumn>
</template>
