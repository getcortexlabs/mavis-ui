<script setup lang="ts">
import { reactive, ref } from 'vue'

const amountRef = ref<{ focus(): void; blur(): void }>()
const state = reactive({
  amount: 2 as number | undefined,
  seats: 4 as number | undefined,
  text: '10' as string,
  total: 10 as number | undefined,
  seat(next: number | undefined): void {
    if (next === undefined) return
    if (next % 2 === 0) {
      state.seats = next
    }
  },
  edit(): void {
    amountRef.value?.focus()
  },
})
</script>

<template>
  <MColumn gap="md">
    <MNumberInput
      ref="amountRef"
      label="Amount"
      :modelValue="state.amount ?? null"
      @update:modelValue="(next) => ((value) => (state.amount = value))(next ?? undefined)"
      :min="0"
      :max="40"
      :step="0.5"
    />
    <MText>{{ `Amount ${state.amount ?? -1}` }}</MText>
    <MNumberInput
      label="Seats"
      :modelValue="state.seats ?? null"
      @update:modelValue="(next) => ((next) => state.seat(next))(next ?? undefined)"
    />
    <MText>{{ `Seats ${state.seats ?? -1}` }}</MText>
    <MNumberInput
      label="Total"
      :modelValue="state.total ?? null"
      @update:modelValue="(next) => ((value) => (state.total = value))(next ?? undefined)"
      :draft="state.text"
      @update:draft="(value) => (state.text = value)"
    />
    <MText>{{ `Total ${state.total ?? -1} typed ${state.text}` }}</MText>
    <MButton text="Edit amount" @click="() => state.edit()" />
  </MColumn>
</template>
