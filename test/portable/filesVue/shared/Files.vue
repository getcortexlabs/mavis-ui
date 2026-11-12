<script setup lang="ts">
import { ref } from 'vue'
import type { TreeNode } from '#mavis'

const nodes = ref<TreeNode[]>([
  {
    key: 'docs',
    label: 'Documents',
    children: [
      { key: 'plan', label: 'Plan.md' },
      { key: 'notes', label: 'Notes.md' },
    ],
  },
  { key: 'media', label: 'Media', hasChildren: true },
  { key: 'readme', label: 'Readme.md' },
  { key: 'trash', label: 'Trash', disabled: true },
])
const none = ref<TreeNode[]>([])
const selected = ref<string | null>(null)
const open = ref<string[]>([])
const loading = ref<string[]>([])
const asked = ref('')

function load(node: TreeNode) {
  loading.value = [node.key]
  asked.value = node.label
}

function finish() {
  nodes.value.splice(1, 1, {
    key: 'media',
    label: 'Media',
    children: [{ key: 'cover', label: 'Cover.png' }],
  })
  loading.value = []
}
</script>

<template>
  <MColumn id="page" gap="md">
    <MTreeView
      id="files"
      v-model="selected"
      v-model:expanded="open"
      label="Files"
      :nodes="nodes"
      :loading-keys="loading"
      @load="load"
    />
    <MText>Selected: {{ selected ?? 'nothing' }}. Open: {{ open.join(', ') }}.</MText>
    <MText>Asked for {{ asked }}.</MText>
    <MButton text="Finish loading" variant="secondary" @click="finish" />
    <m-tree-view label="Archive" :nodes="none" empty-label="Nothing archived" disabled />
  </MColumn>
</template>
