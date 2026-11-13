<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceValue } from '#mavis'

defineProps<{ name: ChoiceValue }>()

const count = ref(0)
</script>

<template>
  <MRow gap="sm">
    <MText>{{ name }} {{ count }}</MText>
    <MButton variant="secondary" size="sm" @click="count = count + 1">Add to {{ name }}</MButton>
  </MRow>
</template>
