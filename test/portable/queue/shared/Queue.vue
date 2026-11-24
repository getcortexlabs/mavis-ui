<script setup lang="ts">
import { reactive } from 'vue'
import type { SortableMove, Track } from './types'

const state = reactive({
  tracks: [
    { id: 'night', title: 'Night Drive', artist: 'Kavinsky' },
    { id: 'tide', title: 'High Tide', artist: 'Tycho' },
    { id: 'dawn', title: 'First Light', artist: 'Bonobo' },
  ] as Track[],
  fixed: [
    { id: 'intro', title: 'Intro', artist: 'House band' },
    { id: 'outro', title: 'Outro', artist: 'House band' },
  ] as Track[],
  none: [] as Track[],
  last: 'nothing' as string,
  locked: false as boolean,
  moved(move: SortableMove): void {
    state.last = `${move.key} before ${move.beforeKey ?? 'the end'}, ${move.fromIndex} to ${move.toIndex}`
  },
})
</script>

<template>
  <MColumn gap="md">
    <MSortableList
      id="queue"
      label="Up next"
      :modelValue="state.tracks"
      @update:modelValue="(value) => (state.tracks = value)"
      @reorder="
        (move) => ((move) => state.moved(move))({ ...move, beforeKey: move.beforeKey ?? undefined })
      "
      :itemLabel="(item) => item.title"
      :height="440"
      :disabled="state.locked"
    >
      <template #default="{ item, index, itemKey }">
        <MColumn :id="`track-${itemKey}`" gap="xs">
          <MText weight="600">{{ `${index + 1}. ${item.title}` }}</MText>
          <MText variant="caption" tone="muted">{{ item.artist }}</MText>
        </MColumn>
      </template>
    </MSortableList>
    <MRow gap="sm">
      <MButton
        :text="state.locked ? 'Unlock' : 'Lock'"
        variant="secondary"
        @click="() => (state.locked = !state.locked)"
      />
      <MText>{{ `Last move: ${state.last}` }}</MText>
    </MRow>
    <MSortableList
      label="Fixed order"
      :modelValue="state.fixed"
      :itemLabel="(item) => item.title"
      :height="300"
      handleLabel="Drag"
      moveUpLabel="Earlier"
      moveDownLabel="Later"
    />
    <MSortableList
      label="Later"
      :modelValue="state.none"
      :height="64"
      emptyLabel="Nothing queued"
    />
  </MColumn>
</template>
