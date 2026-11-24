<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  stars: 3 as number,
  taste: 2.5 as number,
  service: 4 as number,
  serve(next: number): void {
    if (next >= 2) {
      state.service = next
    }
  },
})
</script>

<template>
  <MColumn gap="md">
    <MRating
      id="stars"
      label="Stars"
      :modelValue="state.stars"
      @update:modelValue="(value) => (state.stars = value)"
    />
    <MText id="stars-text">{{ `Stars ${state.stars}` }}</MText>
    <MRating
      label="Taste"
      :modelValue="state.taste"
      @update:modelValue="(value) => (state.taste = value)"
      :max="4"
      :step="0.5"
      clearLabel="Clear taste"
      :formatValue="(value, most) => `${value} of ${most}`"
    />
    <MText>{{ `Taste ${state.taste}` }}</MText>
    <MRating
      label="Service"
      :modelValue="state.service"
      @update:modelValue="(next) => state.serve(next)"
      :max="4"
      :clearable="false"
    />
    <MRating
      label="Average"
      :modelValue="3.5"
      @update:modelValue="(value) => (state.stars = value)"
      :step="0.5"
      :readonly="true"
    />
    <MRating
      label="Closed"
      :modelValue="state.stars"
      @update:modelValue="(value) => (state.stars = value)"
      :max="3"
      clearLabel="Clear closed"
      :disabled="true"
    />
  </MColumn>
</template>
