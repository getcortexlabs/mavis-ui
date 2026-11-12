<script setup lang="ts">
import { MColumn, MText } from '#mavis'

defineProps<{ name: string; title: string }>()
</script>

<template>
  <MColumn :id="name" gap="sm" padding="md">
    <slot name="header">
      <MText :id="`${name}-title`" variant="heading">{{ title }}</MText>
    </slot>
    <slot />
    <slot name="footer" />
  </MColumn>
</template>
