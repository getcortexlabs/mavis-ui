<script setup lang="ts">
import { ref } from 'vue'
import type { CommandItem } from '@getcortexlabs/mavis-core'
const open = ref(false)
const query = ref('')
const chosen = ref('none')
const loading = ref(false)
const items = ref<CommandItem[]>([
  { value: 'cafe', label: 'Café', keywords: ['drink'], group: 'Places' },
  { value: 'garden', label: 'Garden', group: 'Places' },
  { value: 'locked', label: 'Locked', disabled: true },
])
</script>
<template>
  <MColumn gap="md" padding="lg">
    <MButton text="Open commands" @click="open = true" />
    <MText>Chosen: {{ chosen }}</MText>
    <MText>Query: {{ query }}</MText>
    <MCommandPalette
      label="Find an action"
      :items="items"
      v-model:open="open"
      v-model:query="query"
      @select="
        (value) => {
          chosen = value
        }
      "
      :loading="loading"
      shortcut
    />
  </MColumn>
</template>
