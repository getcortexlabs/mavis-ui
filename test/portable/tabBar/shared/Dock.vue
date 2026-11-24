<script setup lang="ts">
import { reactive } from 'vue'
import type { NavigationItem } from './types'

const state = reactive({
  route: 'home' as string | number | undefined,
  off: false as boolean,
  places: [
    {
      value: 'home',
      label: 'Home',
      href: 'https://mavis.example/',
      icon: 'house',
      badge: undefined,
      disabled: undefined,
    },
    {
      value: 'library',
      label: 'Library',
      href: 'https://mavis.example/library',
      icon: 'book-open',
      badge: '3',
      disabled: undefined,
    },
  ] as NavigationItem[],
})
</script>

<template>
  <MColumn id="page" gap="md">
    <MTabBar
      id="dock"
      label="Main navigation"
      :items="state.places"
      :modelValue="state.route ?? null"
      :disabled="state.off"
    />
    <MText id="where">{{ `At ${state.route ?? 'nowhere'}` }}</MText>
    <MRow gap="sm" :wrap="true">
      <MButton text="Go to library" variant="secondary" @click="() => (state.route = 'library')" />
      <MButton text="Leave" variant="secondary" @click="() => (state.route = undefined)" />
      <MButton text="Turn off" variant="secondary" @click="() => (state.off = !state.off)" />
    </MRow>
  </MColumn>
</template>
