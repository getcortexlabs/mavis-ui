<script setup lang="ts">
import { reactive } from 'vue'
import type { TreeNode } from './types'

const state = reactive({
  nodes: [
    {
      key: 'docs',
      label: 'Documents',
      children: [
        {
          key: 'plan',
          label: 'Plan.md',
          disabled: undefined,
          children: undefined,
          hasChildren: undefined,
        },
        {
          key: 'notes',
          label: 'Notes.md',
          disabled: undefined,
          children: undefined,
          hasChildren: undefined,
        },
      ],
      disabled: undefined,
      hasChildren: undefined,
    },
    { key: 'media', label: 'Media', hasChildren: true, disabled: undefined, children: undefined },
    {
      key: 'readme',
      label: 'Readme.md',
      disabled: undefined,
      children: undefined,
      hasChildren: undefined,
    },
    { key: 'trash', label: 'Trash', disabled: true, children: undefined, hasChildren: undefined },
  ] as TreeNode[],
  none: [] as TreeNode[],
  selected: undefined as string | undefined,
  open: [] as string[],
  loading: [] as string[],
  asked: '' as string,
  load(node: TreeNode): void {
    state.loading = [node.key]
    state.asked = node.label
  },
  finish(): void {
    state.nodes.splice(1, 1, {
      key: 'media',
      label: 'Media',
      children: [
        {
          key: 'cover',
          label: 'Cover.png',
          disabled: undefined,
          children: undefined,
          hasChildren: undefined,
        },
      ],
      disabled: undefined,
      hasChildren: undefined,
    })
    state.loading = []
  },
})
</script>

<template>
  <MColumn id="page" gap="md">
    <MTreeView
      id="files"
      label="Files"
      :nodes="state.nodes"
      :modelValue="state.selected"
      @update:modelValue="(value) => (state.selected = value)"
      :expanded="state.open"
      @update:expanded="(value) => (state.open = value)"
      :loadingKeys="state.loading"
      @load="(node) => state.load(node)"
    />
    <MText>{{ `Selected: ${state.selected ?? 'nothing'}. Open: ${state.open.join(', ')}.` }}</MText>
    <MText>{{ `Asked for ${state.asked}.` }}</MText>
    <MButton text="Finish loading" variant="secondary" @click="() => state.finish()" />
    <MTreeView label="Archive" :nodes="state.none" emptyLabel="Nothing archived" :disabled="true" />
  </MColumn>
</template>
