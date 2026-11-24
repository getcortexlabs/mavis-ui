<script setup lang="ts">
import { reactive } from 'vue'
import Quantity from './Quantity.vue'

const state = reactive({
  count: 1 as number,
  unit: 'kg' as string,
  last: 'none' as string,
})
</script>

<template>
  <MColumn gap="md">
    <Quantity
      :modelValue="state.count"
      :unit="state.unit"
      :onUpdateModelValue="
        (value) => {
          state.count = value
          state.last = `Changed to ${value}`
        }
      "
      :onUpdateUnit="(value) => (state.unit = value)"
    />
    <MText>{{ `Total: ${state.count} ${state.unit}` }}</MText>
    <MText>{{ state.last }}</MText>
    <MButton
      text="Reset"
      @click="
        () => {
          state.count = 1
          state.unit = 'kg'
        }
      "
    />
  </MColumn>
</template>
