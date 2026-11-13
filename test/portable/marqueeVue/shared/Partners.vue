<script setup lang="ts">
import { ref } from 'vue'
import { MColumn, MMarquee, MText } from '#mavis'
type Partner = { id: string; label: string }
const items = ref<Partner[]>([
  { id: 'mavis', label: 'Mavis' },
  { id: 'jolt', label: 'Jolt' },
])
const paused = ref(false)
const updates = ref(0)
</script>
<template>
  <MColumn gap="md">
    <MMarquee
      label="Made together"
      :items="items"
      :paused="paused"
      :speed="80"
      @update:paused="
        (next) => {
          paused = next
          updates += 1
        }
      "
    />
    <MText>{{ `Updates ${updates}` }}</MText>
  </MColumn>
</template>
