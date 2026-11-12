<script setup lang="ts">
import { ref } from 'vue'

const price = ref<[number, number]>([20, 80])
const hours = ref<[number, number]>([9, 17])
const level = ref<[number, number]>([2, 3])

// The source keeps the day from starting before 8.
function plan(next: [number, number]) {
  if ((next[0] ?? 0) >= 8) hours.value = next
}
</script>

<template>
  <MColumn gap="md">
    <MRangeSlider
      id="price"
      v-model="price"
      label="Price"
      :step="5"
      :format-value="(value) => `$${value}`"
    />
    <MText id="price-text">From {{ price[0] ?? 0 }} to {{ price[1] ?? 0 }}</MText>
    <m-range-slider
      label="Hours"
      :model-value="hours"
      :max="24"
      lower-label="Start"
      upper-label="End"
      @update:model-value="plan"
    />
    <MRangeSlider
      v-model="level"
      label="Level"
      :max="5"
      lower-label="Lowest"
      upper-label="Highest"
    />
    <MRangeSlider
      label="Fixed"
      :model-value="[2, 4]"
      :max="10"
      readonly
      @update:model-value="(value) => (level = value)"
    />
  </MColumn>
</template>
