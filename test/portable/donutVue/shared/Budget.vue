<script setup lang="ts">
import { ref } from 'vue'
import type { DonutSegment } from '#mavis'

const parts = ref<DonutSegment[]>([
  { id: 'rent', label: 'Rent', value: 30 },
  { id: 'food', label: 'Food', value: 20, color: '#2F7D6B' },
  { id: 'fun', label: 'Fun', value: 10 },
])
const picked = ref<string | null>(null)
const locked = ref(false)
const shares = ref<DonutSegment[]>([
  { id: 'alpha', label: 'Alpha', value: 3 },
  { id: 'beta', label: 'Beta', value: 1, color: '#2F7D6B' },
])

function grow() {
  parts.value = [
    { id: 'rent', label: 'Rent', value: 30 },
    { id: 'food', label: 'Food', value: 50, color: '#2F7D6B' },
    { id: 'fun', label: 'Fun', value: 10 },
  ]
}

function lock() {
  locked.value = !locked.value
}

function swap() {
  shares.value = [
    { id: 'alpha', label: 'Alpha', value: 1 },
    { id: 'beta', label: 'Beta', value: 3, color: '#2F7D6B' },
  ]
}

function clear() {
  shares.value = []
}
</script>

<template>
  <MColumn id="page" gap="lg">
    <MBox id="ring" :width="200" :height="444" background-color="#FFF4D6">
      <MColumn>
        <MDonutChart label="Shares" :segments="shares" :size="200" :stroke-width="20" />
      </MColumn>
    </MBox>
    <MRow gap="sm" wrap>
      <MButton text="Swap" @click="swap" />
      <MButton text="Clear" variant="secondary" @click="clear" />
      <MButton text="Grow food" variant="secondary" @click="grow" />
      <MButton text="Lock" variant="secondary" @click="lock" />
    </MRow>
    <MText>Picked: {{ picked ?? 'none' }}</MText>
    <m-donut-chart
      id="budget"
      v-model="picked"
      label="Budget"
      :segments="parts"
      :disabled="locked"
      animate-number
      total-label="All"
      :format-value="(value) => `$${value}`"
    />
  </MColumn>
</template>
