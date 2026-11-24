<script setup lang="ts">
import { reactive } from 'vue'
import type { Partner } from './types'

const state = reactive({
  items: [
    { id: 1, label: 'Mavis' },
    { id: 2, label: 'Jolt' },
  ] as Partner[],
  paused: false as boolean,
  autoplay: false as boolean,
})
</script>

<template>
  <MColumn gap="md">
    <MMarquee
      label="Shared tools"
      :items="state.items"
      :paused="state.paused"
      :autoplay="state.autoplay"
      direction="right"
      :itemWidth="120"
      :gap="8"
    />
    <MButton text="Request autoplay" @click="() => (state.autoplay = true)" />
    <MButton text="Pause from parent" @click="() => (state.paused = true)" />
    <MButton text="Remove first" @click="() => (state.items = state.items.slice(1))" />
  </MColumn>
</template>
