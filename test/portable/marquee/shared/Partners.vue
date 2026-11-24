<script setup lang="ts">
import { reactive } from 'vue'
import type { Partner } from './types'

const state = reactive({
  items: [
    { id: 'mavis', label: 'Mavis' },
    { id: 'jolt', label: 'Jolt' },
  ] as Partner[],
  paused: false as boolean,
  updates: 0 as number,
})
</script>

<template>
  <MColumn gap="md">
    <MMarquee
      label="Made together"
      :items="state.items"
      :paused="state.paused"
      :speed="80"
      @update:paused="
        (next) => {
          state.paused = next
          state.updates += 1
        }
      "
    />
    <MText>{{ `Updates ${state.updates}` }}</MText>
  </MColumn>
</template>
