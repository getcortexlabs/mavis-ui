<script setup lang="ts">
import { ref } from 'vue'
import type { Pin } from './types'

const pins = ref<Pin[]>([
  { id: 'alder', note: 'tall' },
  { id: 'birch', note: 'short' },
  { id: 'cedar', note: 'short' },
  { id: 'dogwood', note: 'short' },
])

function add() {
  pins.value.push({ id: 'elm', note: 'short' })
}

function clear() {
  pins.value = []
}
</script>

<template>
  <MColumn gap="md">
    <m-masonry
      id="board"
      label="Pinned trees"
      :items="pins"
      :min-column-width="120"
      :columns="2"
      gap="md"
      empty-label="Nothing pinned"
    >
      <template #item="{ item, index }">
        <MCard :id="`pin-${item.id}`" gap="sm">
          <MText>{{ item.id }}</MText>
          <MBox :height="index === 0 ? 96 : 40" />
        </MCard>
      </template>
    </m-masonry>
    <MRow gap="sm">
      <MButton text="Add elm" @click="add" />
      <MButton text="Clear" @click="clear" />
    </MRow>
  </MColumn>
</template>
