<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BreadcrumbItem } from '@getcortexlabs/mavis-core'

const path: BreadcrumbItem[] = [
  { key: 'home', label: 'Home', href: 'https://mavis.example/' },
  { key: 'library', label: 'Library', href: 'https://mavis.example/library' },
  { key: 'shelves', label: 'Shelves', href: 'https://mavis.example/library/shelves' },
  { key: 'fiction', label: 'Fiction', href: 'https://mavis.example/library/shelves/fiction' },
  { key: 'dune', label: 'Dune' },
]
const near = ref(false)
const shown = computed<BreadcrumbItem[]>(() => (near.value ? path.slice(3) : path))
</script>

<template>
  <MColumn gap="md">
    <MColumn :width="220">
      <MBreadcrumb id="trail" :items="shown" :max-items="2" expand-label="Show the whole path" />
    </MColumn>
    <MText id="count">{{ shown.length }} places</MText>
    <MButton variant="secondary" @click="near = !near">Nearer</MButton>
  </MColumn>
</template>
