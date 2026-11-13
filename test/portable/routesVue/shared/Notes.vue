<script setup lang="ts">
import { MButton, MColumn, MScreen, MText, useMavisNavigation } from '#mavis'

defineProps<{ id: string }>()
const navigation = useMavisNavigation()
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText as="h1" variant="title">Notes</MText>
      <MText>Nothing written about {{ id }} yet.</MText>
      <MButton text="Done" @click="navigation.back()" />
    </MColumn>
  </MScreen>
</template>
