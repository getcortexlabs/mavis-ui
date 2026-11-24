<script setup lang="ts">
import { reactive } from 'vue'
import type { SpeedDialAction } from './types'

const state = reactive({
  open: false as boolean,
  selected: 'none' as string,
  actions: [
    { value: 'note', label: 'New note', icon: 'plus', disabled: undefined },
    { value: 'folder', label: 'New folder', disabled: true, icon: undefined },
  ] as SpeedDialAction[],
})
</script>

<template>
  <MColumn padding="lg" gap="md">
    <MSpeedDial
      :open="state.open"
      @update:open="(value) => (state.open = value)"
      label="Create"
      :actions="state.actions as never"
      direction="down"
      @select="(value, item) => ((value) => (state.selected = value))(String(value), item as never)"
    />
    <MText>{{ `Selected: ${state.selected}` }}</MText>
  </MColumn>
</template>
