<script setup lang="ts">
import { reactive } from 'vue'
import type { BreadcrumbItem } from './types'

const state = reactive({
  path: [
    { key: 'home', label: 'Home', href: 'https://mavis.example/' },
    { key: 'library', label: 'Library', href: 'https://mavis.example/library' },
    { key: 'shelves', label: 'Shelves', href: 'https://mavis.example/library/shelves' },
    { key: 'fiction', label: 'Fiction', href: 'https://mavis.example/library/shelves/fiction' },
    { key: 'dune', label: 'Dune', href: undefined },
  ] as BreadcrumbItem[],
  near: false as boolean,
  get shown(): BreadcrumbItem[] {
    return state.near ? state.path.slice(3) : state.path
  },
})
</script>

<template>
  <MColumn gap="md">
    <MColumn :width="220">
      <MBreadcrumb
        id="trail"
        :items="state.shown"
        :maxItems="2"
        expandLabel="Show the whole path"
      />
    </MColumn>
    <MText id="count">{{ `${state.shown.length} places` }}</MText>
    <MButton text="Nearer" variant="secondary" @click="() => (state.near = !state.near)" />
  </MColumn>
</template>
