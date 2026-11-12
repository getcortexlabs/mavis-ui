<script setup lang="ts">
import { MButton, MCard, MText } from '#mavis'

defineProps<{ title: string; price: string; detail?: string }>()
defineEmits<{ pick: [] }>()
</script>

<template>
  <MCard gap="xs">
    <MText variant="heading">{{ title }}</MText>
    <MText>{{ price }}</MText>
    <MText v-if="detail !== undefined" tone="muted">{{ detail ?? '' }}</MText>
    <MButton @click="$emit('pick')">Pick {{ title }}</MButton>
  </MCard>
</template>
