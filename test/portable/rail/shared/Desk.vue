<script setup lang="ts">
import { reactive } from 'vue'
import type { NavigationGroup } from './types'

const state = reactive({
  route: 'overview' as string | number | undefined,
  narrow: false as boolean,
  groups: [
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
          disabled: undefined,
        },
      ],
    },
    {
      key: 'people',
      label: 'Together',
      items: [
        {
          value: 'team',
          label: 'Team',
          href: 'https://mavis.example/team',
          icon: 'users',
          badge: undefined,
          disabled: undefined,
        },
        {
          value: 'guests',
          label: 'Guests',
          href: 'https://mavis.example/guests',
          disabled: true,
          icon: undefined,
          badge: undefined,
        },
      ],
    },
  ] as NavigationGroup[],
})
</script>

<template>
  <MRow gap="md" align="start">
    <MNavigationRail
      id="rail"
      label="Desk"
      :groups="state.groups"
      :modelValue="state.route ?? null"
      :collapsed="state.narrow"
      @update:collapsed="(value) => (state.narrow = value)"
    >
      <template #header="{ collapsed }">
        <MText id="brand">{{ collapsed ? 'M' : 'Mavis' }}</MText>
      </template>
      <template #footer="{ collapsed }">
        <MText id="who">{{ collapsed ? 'R' : 'Rafael' }}</MText>
      </template>
    </MNavigationRail>
    <MColumn id="main" gap="md" :grow="1">
      <MText>{{ `At ${state.route ?? 'nowhere'}` }}</MText>
      <MButton text="Open team" variant="secondary" @click="() => (state.route = 'team')" />
    </MColumn>
  </MRow>
</template>
