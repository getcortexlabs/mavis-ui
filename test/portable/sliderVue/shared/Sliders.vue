<script setup lang="ts">
import { ref } from 'vue'

const volume = ref(80)
const level = ref(9)
const capped = ref(20)

// The source keeps the cap at 30 or below.
function cap(value: number) {
  if (value <= 30) capped.value = value
}
</script>

<template>
  <MColumn gap="md">
    <MSlider id="volume" v-model="volume" label="Volume" />
    <MText>Volume {{ volume }}</MText>
    <m-slider v-model="level" label="Level" :min="0" :max="10" :step="3" />
    <MText>Level {{ level }}</MText>
    <MSlider
      id="cap"
      label="Cap"
      :model-value="capped"
      :max="50"
      :step="10"
      @update:model-value="cap"
    />
    <MText>Cap {{ capped }}</MText>
    <MSlider label="Fixed" :model-value="capped" :max="50" disabled @update:model-value="cap" />
  </MColumn>
</template>
