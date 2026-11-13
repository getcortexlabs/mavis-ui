<script setup lang="ts">
import { ref } from 'vue'
import Quantity from './Quantity.vue'
const count = ref(1),
  unit = ref('kg'),
  last = ref('none')
</script>
<template>
  <MColumn gap="md"
    ><Quantity
      v-model="count"
      v-model:unit="unit"
      @update:model-value="(value) => (last = `Changed to ${value}`)" /><MText>{{
      `Total: ${count} ${unit}`
    }}</MText
    ><MText>{{ last }}</MText
    ><MButton
      text="Reset"
      @click="
        () => {
          count = 1
          unit = 'kg'
        }
      "
  /></MColumn>
</template>
