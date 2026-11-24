<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'

const state = reactive({
  visible: true as boolean,
  setups: 0 as number,
  cleanups: 0 as number,
  status: 'Waiting' as string,
})
onMounted(() => {
  surface.use((child) => {
    state.setups += 1
    state.status = child.available ? 'Ready' : 'Unavailable'
    try {
      child.set({ x: 12 })
    } catch {
      state.status = 'Unavailable'
    }
    return () => {
      state.cleanups += 1
      state.status = 'Cleaned'
    }
  })
})
const surface = createMotionSurface()
</script>

<template>
  <MColumn gap="sm">
    <template v-if="state.visible">
      <MBox :motionSurface="surface">
        <MText>Target</MText>
      </MBox>
    </template>
    <MButton text="Toggle target" @click="() => (state.visible = !state.visible)" />
    <MText>{{ state.status }}</MText>
    <MText>{{ `Setups ${state.setups}` }}</MText>
    <MText>{{ `Cleanups ${state.cleanups}` }}</MText>
  </MColumn>
</template>
