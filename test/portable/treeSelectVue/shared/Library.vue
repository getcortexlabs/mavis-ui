<script setup lang="ts">
import { computed, ref } from 'vue'
import { MColumn, MText, MTreeSelect } from '#mavis'
import type { TreeSelectNode } from '#mavis'

const nodes: TreeSelectNode[] = [
  {
    id: 'guides',
    label: 'Guides',
    children: [
      { id: 'install', label: 'Install' },
      { id: 'theme', label: 'Themes' },
      { id: 'legacy', label: 'Legacy', disabled: true },
    ],
  },
  {
    id: 'api',
    label: 'Reference',
    selectable: false,
    children: [{ id: 'button', label: 'Button' }],
  },
  { id: 'notes', label: 'Release notes' },
]
const topics = ref<string[]>(['notes'])
const open = ref<string[]>([])
const start = ref<string[]>([])
const shown = ref<string[]>([])
const chosen = computed(() =>
  topics.value.length === 0 ? 'Topics: none' : `Topics: ${topics.value.join(', ')}`,
)
const home = computed(() =>
  start.value.length === 0 ? 'Start: none' : `Start: ${start.value.join(', ')}`,
)
</script>

<template>
  <MColumn gap="md">
    <MTreeSelect
      id="topics"
      v-model="topics"
      v-model:expanded="open"
      label="Topics"
      :nodes="nodes"
      multiple
      placeholder="Choose topics"
      clear-label="Clear topics"
    />
    <MText id="chosen">{{ chosen }}</MText>
    <MTreeSelect
      id="start"
      v-model="start"
      v-model:expanded="shown"
      label="Start page"
      :nodes="nodes"
      placeholder="Choose a page"
    />
    <MText id="home">{{ home }}</MText>
  </MColumn>
</template>
