<script setup lang="ts">
import { reactive } from 'vue'
import type { CommandItem } from './types'

const state = reactive({
  open: false as boolean,
  query: '' as string,
  chosen: 'none' as string,
  loading: false as boolean,
  items: [
    {
      value: 'cafe',
      label: 'Café',
      keywords: ['drink'],
      group: 'Places',
      description: undefined,
      icon: undefined,
      shortcut: undefined,
      disabled: undefined,
    },
    {
      value: 'garden',
      label: 'Garden',
      group: 'Places',
      description: undefined,
      keywords: undefined,
      icon: undefined,
      shortcut: undefined,
      disabled: undefined,
    },
    {
      value: 'locked',
      label: 'Locked',
      disabled: true,
      description: undefined,
      keywords: undefined,
      group: undefined,
      icon: undefined,
      shortcut: undefined,
    },
  ] as CommandItem[],
})
</script>

<template>
  <MColumn gap="md" padding="lg">
    <MButton text="Open commands" @click="() => (state.open = true)" />
    <MText>{{ `Chosen: ${state.chosen}` }}</MText>
    <MText>{{ `Query: ${state.query}` }}</MText>
    <MCommandPalette
      label="Find an action"
      :items="state.items"
      :open="state.open"
      @update:open="(value) => (state.open = value)"
      :query="state.query"
      @update:query="(value) => (state.query = value)"
      @select="(value) => (state.chosen = value)"
      :loading="state.loading"
      :shortcut="true"
    />
  </MColumn>
</template>
