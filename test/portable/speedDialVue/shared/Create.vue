<script setup lang="ts">
import { ref } from 'vue'
import type { SpeedDialAction } from '@getcortexlabs/mavis-core'
const open = ref(false)
const selected = ref('none')
const actions = ref<SpeedDialAction[]>([
  { value: 'note', label: 'New note', icon: 'plus' },
  { value: 'folder', label: 'New folder', disabled: true },
])
</script>

<template>
  <MColumn padding="lg" gap="md">
    <MSpeedDial
      v-model:open="open"
      label="Create"
      :actions="actions"
      direction="down"
      @select="(value) => (selected = value)"
    />
    <MText>Selected: {{ selected }}</MText>
  </MColumn>
</template>
