<script setup lang="ts">
import { reactive } from 'vue'
import type { Pin } from './types'

const state = reactive({
  pins: [
    { id: 'alder', note: 'tall' },
    { id: 'birch', note: 'short' },
    { id: 'cedar', note: 'short' },
    { id: 'dogwood', note: 'short' },
  ] as Pin[],
  add(): void {
    state.pins.push({ id: 'elm', note: 'short' })
  },
  clear(): void {
    state.pins = []
  },
})
</script>

<template>
  <MColumn gap="md">
    <MMasonry
      id="board"
      label="Pinned trees"
      :items="state.pins"
      :minColumnWidth="120"
      :columns="2"
      gap="md"
      emptyLabel="Nothing pinned"
    >
      <template #item="{ item, index }">
        <MCard :id="`pin-${item.id}`" gap="sm">
          <MText>{{ item.id }}</MText>
          <MBox :height="index === 0 ? 96 : 40" />
        </MCard>
      </template>
    </MMasonry>
    <MRow gap="sm">
      <MButton text="Add elm" @click="() => state.add()" />
      <MButton text="Clear" @click="() => state.clear()" />
    </MRow>
  </MColumn>
</template>
