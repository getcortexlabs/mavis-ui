<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  quantity: 2 as number | undefined,
  price: 9.5 as number | undefined,
  seats: 4 as number | undefined,
  seat(next: number | undefined): void {
    if (next === undefined) return
    if (next % 2 === 0) {
      state.seats = next
    }
  },
})
</script>

<template>
  <MColumn gap="md">
    <MBox id="quantity-box">
      <MNumberInput
        id="quantity"
        label="Quantity"
        :modelValue="state.quantity ?? null"
        @update:modelValue="(next) => ((value) => (state.quantity = value))(next ?? undefined)"
        :min="0"
        :max="4"
        helperText="Up to four"
      />
    </MBox>
    <MText id="quantity-text">{{ `Quantity ${state.quantity ?? -1}` }}</MText>
    <MButton text="Clear quantity" variant="ghost" @click="() => (state.quantity = undefined)" />
    <MNumberInput
      label="Price"
      :modelValue="state.price ?? null"
      @update:modelValue="(next) => ((value) => (state.price = value))(next ?? undefined)"
      :step="0.25"
      locale="pt-BR"
      incrementLabel="Aumentar"
      decrementLabel="Diminuir"
    />
    <MText>{{ `Price ${state.price ?? -1}` }}</MText>
    <MNumberInput
      label="Seats"
      :modelValue="state.seats ?? null"
      @update:modelValue="(next) => ((next) => state.seat(next))(next ?? undefined)"
      :step="1"
    />
    <MText>{{ `Seats ${state.seats ?? -1}` }}</MText>
    <MNumberInput
      label="Fixed"
      :modelValue="state.seats ?? null"
      @update:modelValue="(next) => ((next) => state.seat(next))(next ?? undefined)"
      :readonly="true"
    />
  </MColumn>
</template>
