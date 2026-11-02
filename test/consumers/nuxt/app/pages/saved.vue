<script setup lang="ts">
import { MScreen, MColumn, MText } from '@getcortexlabs/mavis-web'
</script>

<template>
  <MScreen scroll>
    <MColumn class="notebook" padding="xl" gap="lg">
      <MText as="h1" variant="display">A little room to focus.</MText>
      <MText>Your next session starts here.</MText>
      <NuxtLink to="/">Return to your notebook</NuxtLink>
    </MColumn>
  </MScreen>
</template>
