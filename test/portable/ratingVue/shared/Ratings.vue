<script setup lang="ts">
import { ref } from 'vue'

const stars = ref(3)
const taste = ref(2.5)
const service = ref(4)

// The source keeps the service rating at 2 or above.
function serve(next: number) {
  if (next >= 2) service.value = next
}
</script>

<template>
  <MColumn gap="md">
    <MRating id="stars" v-model="stars" label="Stars" />
    <MText id="stars-text">Stars {{ stars }}</MText>
    <m-rating
      v-model="taste"
      label="Taste"
      :max="4"
      :step="0.5"
      clear-label="Clear taste"
      :format-value="(value, most) => `${value} of ${most}`"
    />
    <MText>Taste {{ taste }}</MText>
    <MRating
      label="Service"
      :model-value="service"
      :max="4"
      :clearable="false"
      @update:model-value="serve"
    />
    <MRating
      label="Average"
      :model-value="3.5"
      :step="0.5"
      readonly
      @update:model-value="(value) => (stars = value)"
    />
    <MRating v-model="stars" label="Closed" :max="3" clear-label="Clear closed" disabled />
  </MColumn>
</template>
