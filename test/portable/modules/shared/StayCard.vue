<script setup lang="ts">
import { type PropType } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  price: { type: String, required: true },
  detail: { type: String, required: false },
  onPick: { type: Function as PropType<() => void>, required: true },
})
</script>

<template>
  <MCard gap="xs">
    <MText variant="heading">{{ props.title }}</MText>
    <MText>{{ props.price }}</MText>
    <template v-if="props.detail !== undefined">
      <MText tone="muted">{{ props.detail ?? '' }}</MText>
    </template>
    <MButton @click="() => props.onPick()" :text="`Pick ${props.title}`" />
  </MCard>
</template>
