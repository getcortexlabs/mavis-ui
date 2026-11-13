<script setup lang="ts">
import { ref } from 'vue'
import type { MenuItem } from '@getcortexlabs/mavis-core'
const open = ref(false)
const selected = ref('none')
const reason = ref('none')
const items = ref<MenuItem[]>([
  { type: 'group', key: 'edit', label: 'Editing' },
  { value: 'edit', label: 'Edit', icon: 'pencil' },
  { value: 'delete', label: 'Delete', disabled: true },
  { type: 'separator', key: 'more' },
  { value: 'duplicate', label: 'Duplicate', icon: 'copy' },
])
</script>

<template>
  <MColumn padding="lg" gap="md">
    <MMenu
      v-model:open="open"
      label="Document actions"
      trigger-label="Actions"
      :items="items"
      @select="(value) => (selected = value)"
      @close="(value) => (reason = value)"
    />
    <MText>Selected: {{ selected }}</MText>
    <MText>Closed: {{ reason }}</MText>
  </MColumn>
</template>
