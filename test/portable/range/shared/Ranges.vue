<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  price: [20, 80] as number[],
  hours: [9, 17] as number[],
  level: [2, 3] as number[],
  plan(next: number[]): void {
    if ((next[0] ?? 0) >= 8) {
      state.hours = next
    }
  },
})
</script>

<template>
  <MColumn gap="md">
    <MRangeSlider
      id="price"
      label="Price"
      :modelValue="state.price as [number, number]"
      @update:modelValue="(pair) => ((value) => (state.price = value))([...pair])"
      :step="5"
      :formatValue="(value) => `$${value}`"
    />
    <MText id="price-text">{{ `From ${state.price[0] ?? 0} to ${state.price[1] ?? 0}` }}</MText>
    <MRangeSlider
      label="Hours"
      :modelValue="state.hours as [number, number]"
      @update:modelValue="(pair) => ((next) => state.plan(next))([...pair])"
      :max="24"
      lowerLabel="Start"
      upperLabel="End"
    />
    <MRangeSlider
      label="Level"
      :modelValue="state.level as [number, number]"
      @update:modelValue="(pair) => ((value) => (state.level = value))([...pair])"
      :max="5"
      lowerLabel="Lowest"
      upperLabel="Highest"
    />
    <MRangeSlider
      label="Fixed"
      :modelValue="[2, 4] as [number, number]"
      @update:modelValue="(pair) => ((value) => (state.level = value))([...pair])"
      :max="10"
      :readonly="true"
    />
  </MColumn>
</template>
