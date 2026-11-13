<script setup lang="ts">
import { MColumn, MLink, MScreen, MText } from '#mavis'

defineProps<{ q?: string; sort?: string }>()
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText as="h1" variant="title">Results for {{ q ?? 'everything' }}</MText>
      <MText>Sorted by {{ sort ?? 'name' }}.</MText>
      <MLink href="/search?q=green%20tea&sort=city" text="Green tea by city" />
    </MColumn>
  </MScreen>
</template>
