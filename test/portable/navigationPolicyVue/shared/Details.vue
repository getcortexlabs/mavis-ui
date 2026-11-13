<script setup lang="ts">
import { MScreen, MColumn, MText, MButton, useMavisNavigation } from '#mavis'
defineProps<{ id: string }>()
const navigation = useMavisNavigation()
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText as="h1">Detail {{ id }}</MText>
      <MButton text="Return home" @click="navigation.back()" />
    </MColumn>
  </MScreen>
</template>
