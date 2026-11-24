<script setup lang="ts">
import { reactive } from 'vue'
import type { TreeSelectNode } from './types'

const state = reactive({
  nodes: [
    {
      id: 'guides',
      label: 'Guides',
      children: [
        {
          id: 'install',
          label: 'Install',
          disabled: undefined,
          selectable: undefined,
          children: undefined,
        },
        {
          id: 'theme',
          label: 'Themes',
          disabled: undefined,
          selectable: undefined,
          children: undefined,
        },
        {
          id: 'legacy',
          label: 'Legacy',
          disabled: true,
          selectable: undefined,
          children: undefined,
        },
      ],
      disabled: undefined,
      selectable: undefined,
    },
    {
      id: 'api',
      label: 'Reference',
      selectable: false,
      children: [
        {
          id: 'button',
          label: 'Button',
          disabled: undefined,
          selectable: undefined,
          children: undefined,
        },
      ],
      disabled: undefined,
    },
    {
      id: 'notes',
      label: 'Release notes',
      disabled: undefined,
      selectable: undefined,
      children: undefined,
    },
  ] as TreeSelectNode[],
  topics: ['notes'] as string[],
  open: [] as string[],
  start: [] as string[],
  shown: [] as string[],
  get chosen(): string {
    return state.topics.length === 0 ? 'Topics: none' : `Topics: ${state.topics.join(', ')}`
  },
  get home(): string {
    return state.start.length === 0 ? 'Start: none' : `Start: ${state.start.join(', ')}`
  },
})
</script>

<template>
  <MColumn gap="md">
    <MTreeSelect
      id="topics"
      label="Topics"
      :nodes="state.nodes"
      :modelValue="state.topics"
      @update:modelValue="(value) => (state.topics = value)"
      :expanded="state.open"
      @update:expanded="(value) => (state.open = value)"
      :multiple="true"
      placeholder="Choose topics"
      clearLabel="Clear topics"
    />
    <MText id="chosen">{{ state.chosen }}</MText>
    <MTreeSelect
      id="start"
      label="Start page"
      :nodes="state.nodes"
      :modelValue="state.start"
      @update:modelValue="(value) => (state.start = value)"
      :expanded="state.shown"
      @update:expanded="(value) => (state.shown = value)"
      placeholder="Choose a page"
    />
    <MText id="home">{{ state.home }}</MText>
  </MColumn>
</template>
