<script setup lang="ts">
const props = defineProps<{ modelValue: number; unit: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: number]; 'update:unit': [value: string] }>()
</script>
<template>
  <MColumn gap="sm"
    ><MText>{{ `Quantity: ${props.modelValue} ${props.unit}` }}</MText
    ><MButton text="Add one" @click="emit('update:modelValue', props.modelValue + 1)" /><MButton
      text="Change unit"
      @click="emit('update:unit', props.unit === 'kg' ? 'lb' : 'kg')"
  /></MColumn>
</template>
