<script setup lang="ts">
import { MColumn, MLink, MScreen, MText } from '#mavis'
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText as="h1" variant="title">Nothing here</MText>
      <MText tone="muted">That address is not a place of this app.</MText>
      <MLink href="/" text="Back to places" />
    </MColumn>
  </MScreen>
</template>
