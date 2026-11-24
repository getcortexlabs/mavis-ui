<script setup lang="ts">
import { reactive } from 'vue'
import type { NavigationGroup, NavigationItem } from './types'

const state = reactive({
  value: 1 as string | number | undefined,
  items: [
    {
      value: 1,
      label: 'Number place',
      href: 'https://mavis.example/number',
      icon: undefined,
      badge: undefined,
      disabled: undefined,
    },
    {
      value: '1',
      label: 'Text place',
      href: 'https://mavis.example/text',
      icon: undefined,
      badge: undefined,
      disabled: undefined,
    },
    {
      value: 0,
      label: 'Zero place',
      href: 'https://mavis.example/zero',
      icon: undefined,
      badge: undefined,
      disabled: undefined,
    },
  ] as NavigationItem[],
  groups: [
    {
      key: 'main',
      label: 'Places',
      items: [
        {
          value: 1,
          label: 'Number rail',
          href: 'https://mavis.example/number',
          icon: undefined,
          badge: undefined,
          disabled: undefined,
        },
        {
          value: '1',
          label: 'Text rail',
          href: 'https://mavis.example/text',
          icon: undefined,
          badge: undefined,
          disabled: undefined,
        },
        {
          value: 0,
          label: 'Zero rail',
          href: 'https://mavis.example/zero',
          icon: undefined,
          badge: undefined,
          disabled: undefined,
        },
      ],
    },
  ] as NavigationGroup[],
  get summary(): string {
    return state.value === 1
      ? 'Numeric one'
      : state.value === '1'
        ? 'Textual one'
        : state.value === 0
          ? 'Zero'
          : 'None'
  },
})
</script>

<template>
  <MColumn gap="md">
    <MTabBar
      id="dock"
      label="Typed destinations"
      :items="state.items"
      :modelValue="state.value ?? null"
    />
    <MNavigationRail
      label="Typed rail"
      :groups="state.groups"
      :modelValue="state.value ?? null"
      :collapsible="false"
    />
    <MText>{{ state.summary }}</MText>
    <MRow gap="sm">
      <MButton text="Show text" @click="() => (state.value = '1')" />
      <MButton text="Show zero" @click="() => (state.value = 0)" />
      <MButton text="Show number" @click="() => (state.value = 1)" />
      <MButton text="Clear" @click="() => (state.value = undefined)" />
    </MRow>
  </MColumn>
</template>
