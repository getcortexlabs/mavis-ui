<script setup lang="ts">
const props = defineProps({
  q: { type: String, required: false },
  sort: { type: String, required: false },
})
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText as="h1" variant="title">{{ `Results for ${props.q ?? 'everything'}` }}</MText>
      <MText>{{ `Sorted by ${props.sort ?? 'name'}.` }}</MText>
      <MLink href="/search?q=green%20tea&amp;sort=city" text="Green tea by city" />
    </MColumn>
  </MScreen>
</template>
