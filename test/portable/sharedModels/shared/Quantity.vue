<script setup lang="ts">
import { type PropType } from 'vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  unit: { type: String, required: true },
  onUpdateModelValue: { type: Function as PropType<(arg0: number) => void>, required: true },
  onUpdateUnit: { type: Function as PropType<(arg0: string) => void>, required: true },
})
</script>

<template>
  <MColumn gap="sm">
    <MText>{{ `Quantity: ${props.modelValue} ${props.unit}` }}</MText>
    <MButton text="Add one" @click="() => props.onUpdateModelValue(props.modelValue + 1)" />
    <MButton
      text="Change unit"
      @click="() => props.onUpdateUnit(props.unit === 'kg' ? 'lb' : 'kg')"
    />
  </MColumn>
</template>
