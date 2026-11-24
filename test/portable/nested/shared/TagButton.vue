<script setup lang="ts">
import { type PropType } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  onPress: { type: Function as PropType<() => void>, required: true },
})
</script>

<template>
  <MButton :text="props.label" variant="secondary" @click="() => props.onPress()" />
</template>
