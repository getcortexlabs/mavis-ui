<script setup lang="ts">
import { MScreen, MColumn, MText, MButton } from '#mavis'
import { pageTransition } from './page-transition'
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText as="h1">Shared policy</MText>
      <MText>{{ pageTransition.name }} {{ pageTransition.duration }}</MText>
      <MButton text="Open detail" href="/details/42" />
    </MColumn>
  </MScreen>
</template>
