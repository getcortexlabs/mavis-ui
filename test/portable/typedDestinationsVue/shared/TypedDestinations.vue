<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChoiceValue, NavigationItem, NavigationGroup } from '#mavis'
const value = ref<ChoiceValue | null>(1)
const items: NavigationItem[] = [
  { value: 1, label: 'Number place', href: 'https://mavis.example/number' },
  { value: '1', label: 'Text place', href: 'https://mavis.example/text' },
  { value: 0, label: 'Zero place', href: 'https://mavis.example/zero' },
]
const groups: NavigationGroup[] = [
  {
    key: 'main',
    label: 'Places',
    items: [
      { value: 1, label: 'Number rail', href: 'https://mavis.example/number' },
      { value: '1', label: 'Text rail', href: 'https://mavis.example/text' },
      { value: 0, label: 'Zero rail', href: 'https://mavis.example/zero' },
    ],
  },
]
const summary = computed(() =>
  value.value === 1
    ? 'Numeric one'
    : value.value === '1'
      ? 'Textual one'
      : value.value === 0
        ? 'Zero'
        : 'None',
)
</script>
<template>
  <MColumn gap="md"
    ><MTabBar
      id="dock"
      label="Typed destinations"
      :items="items"
      :model-value="value" /><MNavigationRail
      label="Typed rail"
      :groups="groups"
      :model-value="value"
      :collapsible="false" /><MText>{{ summary }}</MText
    ><MRow gap="sm"
      ><MButton text="Show text" @click="value = '1'" /><MButton
        text="Show zero"
        @click="value = 0" /><MButton text="Show number" @click="value = 1" /><MButton
        text="Clear"
        @click="value = null" /></MRow
  ></MColumn>
</template>
