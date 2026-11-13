<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceValue, NavigationGroup } from '@getcortexlabs/mavis-core'

const route = ref<ChoiceValue | null>('overview')
const narrow = ref(false)
const groups: NavigationGroup[] = [
  {
    key: 'work',
    label: 'Workspace',
    items: [
      {
        value: 'overview',
        label: 'Overview',
        href: 'https://mavis.example/overview',
        icon: 'layout-dashboard',
        badge: '8',
      },
    ],
  },
  {
    key: 'people',
    label: 'Together',
    items: [
      { value: 'team', label: 'Team', href: 'https://mavis.example/team', icon: 'users' },
      { value: 'guests', label: 'Guests', href: 'https://mavis.example/guests', disabled: true },
    ],
  },
]
</script>

<template>
  <MRow gap="md" align="start">
    <MNavigationRail
      id="rail"
      label="Desk"
      :groups="groups"
      :model-value="route"
      v-model:collapsed="narrow"
    >
      <template #header="{ collapsed }">
        <MText id="brand">{{ collapsed ? 'M' : 'Mavis' }}</MText>
      </template>
      <template #footer="{ collapsed }">
        <MText id="who">{{ collapsed ? 'R' : 'Rafael' }}</MText>
      </template>
    </MNavigationRail>
    <MColumn id="main" gap="md" :grow="1">
      <MText>At {{ route ?? 'nowhere' }}</MText>
      <MButton variant="secondary" @click="route = 'team'">Open team</MButton>
    </MColumn>
  </MRow>
</template>
