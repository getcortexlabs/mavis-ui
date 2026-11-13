<script setup lang="ts">
import { ref } from 'vue'

const quantity = ref<number | null>(2)
const price = ref<number | null>(9.5)
const seats = ref<number | null>(4)

// The source keeps an odd number of seats out.
function seat(next: number | null) {
  if (next === null) return
  if (next % 2 === 0) seats.value = next
}
</script>

<template>
  <MColumn gap="md">
    <MBox id="quantity-box">
      <MNumberInput
        id="quantity"
        v-model="quantity"
        label="Quantity"
        :min="0"
        :max="4"
        helper-text="Up to four"
      />
    </MBox>
    <MText id="quantity-text">Quantity {{ quantity ?? -1 }}</MText>
    <MButton variant="ghost" @click="quantity = null">Clear quantity</MButton>
    <m-number-input
      v-model="price"
      label="Price"
      :step="0.25"
      locale="pt-BR"
      increment-label="Aumentar"
      decrement-label="Diminuir"
    />
    <MText>Price {{ price ?? -1 }}</MText>
    <MNumberInput label="Seats" :model-value="seats" :step="1" @update:model-value="seat" />
    <MText>Seats {{ seats ?? -1 }}</MText>
    <MNumberInput label="Fixed" :model-value="seats" readonly @update:model-value="seat" />
  </MColumn>
</template>
