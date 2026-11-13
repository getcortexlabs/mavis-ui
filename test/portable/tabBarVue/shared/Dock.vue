<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceValue, NavigationItem } from '@getcortexlabs/mavis-core'

const route = ref<ChoiceValue | null>('home')
const off = ref(false)
const places: NavigationItem[] = [
  { value: 'home', label: 'Home', href: 'https://mavis.example/', icon: 'house' },
  {
    value: 'library',
    label: 'Library',
    href: 'https://mavis.example/library',
    icon: 'book-open',
    badge: '3',
  },
]
</script>

<template>
  <MColumn id="page" gap="md">
    <MTabBar
      id="dock"
      label="Main navigation"
      :items="places"
      :model-value="route"
      :disabled="off"
    />
    <MText id="where">At {{ route ?? 'nowhere' }}</MText>
    <MRow gap="sm" wrap>
      <MButton variant="secondary" @click="route = 'library'">Go to library</MButton>
      <MButton variant="secondary" @click="route = null">Leave</MButton>
      <MButton variant="secondary" @click="off = !off">Turn off</MButton>
    </MRow>
  </MColumn>
</template>
