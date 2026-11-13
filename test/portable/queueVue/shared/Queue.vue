<script setup lang="ts">
import { ref } from 'vue'
import type { SortableMove } from '#mavis'
import type { Track } from './types'

const tracks = ref<Track[]>([
  { id: 'night', title: 'Night Drive', artist: 'Kavinsky' },
  { id: 'tide', title: 'High Tide', artist: 'Tycho' },
  { id: 'dawn', title: 'First Light', artist: 'Bonobo' },
])
const fixed = ref<Track[]>([
  { id: 'intro', title: 'Intro', artist: 'House band' },
  { id: 'outro', title: 'Outro', artist: 'House band' },
])
const none = ref<Track[]>([])
const last = ref('nothing')
const locked = ref(false)

function moved(move: SortableMove) {
  last.value = `${move.key} before ${move.beforeKey ?? 'the end'}, ${move.fromIndex} to ${move.toIndex}`
}
</script>

<template>
  <MColumn gap="md">
    <MSortableList
      id="queue"
      v-model="tracks"
      label="Up next"
      :item-label="(item) => item.title"
      :height="440"
      :disabled="locked"
      @reorder="moved"
    >
      <template #default="{ item, index, itemKey }">
        <MColumn :id="`track-${itemKey}`" gap="xs">
          <MText weight="600">{{ index + 1 }}. {{ item.title }}</MText>
          <MText variant="caption" tone="muted">{{ item.artist }}</MText>
        </MColumn>
      </template>
    </MSortableList>
    <MRow gap="sm">
      <MButton :text="locked ? 'Unlock' : 'Lock'" variant="secondary" @click="locked = !locked" />
      <MText>Last move: {{ last }}</MText>
    </MRow>
    <m-sortable-list
      label="Fixed order"
      :model-value="fixed"
      :item-label="(item) => item.title"
      :height="300"
      handle-label="Drag"
      move-up-label="Earlier"
      move-down-label="Later"
    />
    <MSortableList label="Later" :model-value="none" :height="64" empty-label="Nothing queued" />
  </MColumn>
</template>
