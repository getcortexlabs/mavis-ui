<script setup lang="ts">
import { ref } from 'vue'
import type { InputHandle } from '#mavis'

const amountRef = ref<InputHandle | null>(null)
const amount = ref<number | null>(2)
const seats = ref<number | null>(4)
const text = ref('10')
const total = ref<number | null>(10)

// The source keeps an odd number of seats out.
function seat(next: number | null) {
  if (next === null) return
  if (next % 2 === 0) seats.value = next
}

function edit() {
  amountRef.value?.focus()
}
</script>

<template>
  <MColumn gap="md">
    <MNumberInput ref="amountRef" v-model="amount" label="Amount" :min="0" :max="40" :step="0.5" />
    <MText>Amount {{ amount ?? -1 }}</MText>
    <MNumberInput label="Seats" :model-value="seats" @update:model-value="seat" />
    <MText>Seats {{ seats ?? -1 }}</MText>
    <MNumberInput
      v-model="total"
      label="Total"
      :draft="text"
      @update:draft="(value) => (text = value)"
    />
    <MText>Total {{ total ?? -1 }} typed {{ text }}</MText>
    <MButton @click="edit">Edit amount</MButton>
  </MColumn>
</template>
