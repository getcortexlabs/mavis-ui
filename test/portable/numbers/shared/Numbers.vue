<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  value: 0 as number,
  get label(): string {
    return `Value: ${state.value}`
  },
  get rounded(): number {
    return Math.round(state.value * 10) / 10
  },
  add(amount: number): void {
    state.value += amount
  },
})
</script>

<template>
  <MColumn gap="sm">
    <MText>{{ state.label }}</MText>
    <MText>{{ `Rounded ${state.rounded}` }}</MText>
    <MText>{{ state.value % 3 }}</MText>
    <MText>{{ `${Math.floor(state.value / 3)} and ${Math.max(state.value, 2.5)}` }}</MText>
    <MColumn gap="xs">
      <MButton text="Add tenth" @click="() => state.add(0.1)" />
      <MButton text="Add two tenths" @click="() => state.add(0.2)" />
      <MButton text="Negative half" @click="() => (state.value = -2.5)" />
      <MButton text="Huge" @click="() => (state.value = 1e21)" />
      <MButton text="Tiny" @click="() => (state.value = 1e-7)" />
      <MButton text="Divide" @click="() => (state.value = state.value / 3)" />
      <MButton text="Precise" @click="() => (state.value = 123456789.125)" />
      <MButton text="Micro" @click="() => (state.value = 0.000001)" />
    </MColumn>
  </MColumn>
</template>
