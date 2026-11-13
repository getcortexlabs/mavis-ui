<script setup lang="ts">
import { ref } from 'vue'
import { MColumn, MMarquee, MButton } from '#mavis'
type Partner = { id: number; label: string }
const items = ref<Partner[]>([
  { id: 1, label: 'Mavis' },
  { id: 2, label: 'Jolt' },
])
const paused = ref(false)
const autoplay = ref(false)
</script>
<template>
  <MColumn gap="md">
    <MMarquee
      label="Shared tools"
      :items="items"
      :paused="paused"
      :autoplay="autoplay"
      direction="right"
      :itemWidth="120"
      :gap="8"
    />
    <MButton text="Request autoplay" @click="autoplay = true" />
    <MButton text="Pause from parent" @click="paused = true" />
    <MButton text="Remove first" @click="items = items.slice(1)" />
  </MColumn>
</template>
