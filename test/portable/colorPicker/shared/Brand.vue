<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  color: '#FF0000' as string,
  colors: ['#f00', 'rgba(0,255,0,.5)', '#00f'] as string[],
  locked: false as boolean,
  quiet: false as boolean,
  choose(value: string): void {
    if (value !== '#0000FFFF') {
      state.color = value
    }
  },
})
</script>

<template>
  <MColumn gap="md">
    <MColorPicker
      id="brand"
      label="Brand color"
      :modelValue="state.color"
      @update:modelValue="(value) => state.choose(value)"
      :palette="state.colors"
      :alpha="true"
      :readonly="state.locked"
      :animated="!state.quiet"
    />
    <MText>{{ `Chosen: ${state.color}` }}</MText>
    <MButton
      :text="state.locked ? 'Unlock' : 'Lock'"
      @click="() => (state.locked = !state.locked)"
    />
    <MButton
      :text="state.quiet ? 'Animate' : 'Set immediately'"
      @click="() => (state.quiet = !state.quiet)"
    />
  </MColumn>
</template>
