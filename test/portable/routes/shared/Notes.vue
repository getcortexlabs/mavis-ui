<script setup lang="ts">
import { useMavisNavigation } from '@getcortexlabs/mavis-core/vue'

const props = defineProps({
  id: { type: String, required: true },
})
const mavisNavigation = useMavisNavigation()
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText as="h1" variant="title">Notes</MText>
      <MText>{{ `Nothing written about ${props.id} yet.` }}</MText>
      <MButton text="Done" @click="() => mavisNavigation.back()" />
    </MColumn>
  </MScreen>
</template>
