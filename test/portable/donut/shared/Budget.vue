<script setup lang="ts">
import { reactive } from 'vue'
import type { DonutSegment } from './types'

const state = reactive({
  parts: [
    { id: 'rent', label: 'Rent', value: 30, color: undefined },
    { id: 'food', label: 'Food', value: 20, color: '#2F7D6B' },
    { id: 'fun', label: 'Fun', value: 10, color: undefined },
  ] as DonutSegment[],
  picked: undefined as string | undefined,
  locked: false as boolean,
  shares: [
    { id: 'alpha', label: 'Alpha', value: 3, color: undefined },
    { id: 'beta', label: 'Beta', value: 1, color: '#2F7D6B' },
  ] as DonutSegment[],
  grow(): void {
    state.parts = [
      { id: 'rent', label: 'Rent', value: 30, color: undefined },
      { id: 'food', label: 'Food', value: 50, color: '#2F7D6B' },
      { id: 'fun', label: 'Fun', value: 10, color: undefined },
    ]
  },
  lock(): void {
    state.locked = !state.locked
  },
  swap(): void {
    state.shares = [
      { id: 'alpha', label: 'Alpha', value: 1, color: undefined },
      { id: 'beta', label: 'Beta', value: 3, color: '#2F7D6B' },
    ]
  },
  clear(): void {
    state.shares = []
  },
})
</script>

<template>
  <MColumn id="page" gap="lg">
    <MBox id="ring" :width="200" :height="444" backgroundColor="#FFF4D6">
      <MColumn>
        <MDonutChart label="Shares" :segments="state.shares" :size="200" :strokeWidth="20" />
      </MColumn>
    </MBox>
    <MRow gap="sm" :wrap="true">
      <MButton text="Swap" @click="() => state.swap()" />
      <MButton text="Clear" variant="secondary" @click="() => state.clear()" />
      <MButton text="Grow food" variant="secondary" @click="() => state.grow()" />
      <MButton text="Lock" variant="secondary" @click="() => state.lock()" />
    </MRow>
    <MText>{{ `Picked: ${state.picked ?? 'none'}` }}</MText>
    <MDonutChart
      id="budget"
      label="Budget"
      :segments="state.parts"
      :modelValue="state.picked ?? null"
      @update:modelValue="(next) => ((value) => (state.picked = value))(next ?? undefined)"
      :disabled="state.locked"
      :animateNumber="true"
      totalLabel="All"
      :formatValue="(value) => `$${value}`"
    />
  </MColumn>
</template>
