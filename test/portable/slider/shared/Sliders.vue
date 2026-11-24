<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  volume: 80 as number,
  level: 9 as number,
  capped: 20 as number,
  cap(value: number): void {
    if (value <= 30) {
      state.capped = value
    }
  },
})
</script>

<template>
  <MColumn gap="md">
    <MSlider
      id="volume"
      label="Volume"
      :modelValue="state.volume"
      @update:modelValue="(value) => (state.volume = value)"
    />
    <MText>{{ `Volume ${state.volume}` }}</MText>
    <MSlider
      label="Level"
      :modelValue="state.level"
      @update:modelValue="(value) => (state.level = value)"
      :min="0"
      :max="10"
      :step="3"
    />
    <MText>{{ `Level ${state.level}` }}</MText>
    <MSlider
      id="cap"
      label="Cap"
      :modelValue="state.capped"
      @update:modelValue="(value) => state.cap(value)"
      :max="50"
      :step="10"
    />
    <MText>{{ `Cap ${state.capped}` }}</MText>
    <MSlider
      label="Fixed"
      :modelValue="state.capped"
      @update:modelValue="(value) => state.cap(value)"
      :max="50"
      :disabled="true"
    />
  </MColumn>
</template>
