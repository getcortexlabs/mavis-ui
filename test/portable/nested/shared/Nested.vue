<script setup lang="ts">
import { reactive } from 'vue'
import Card from './Card.vue'
import type { Profile } from './types'

const state = reactive({
  profile: {
    name: 'Lin',
    tags: ['calm', 'bold'],
    address: { city: 'Recife', zip: '50000' },
  } as Profile,
  picked: 'none' as string,
  rename(): void {
    state.profile.name = state.profile.name + '!'
  },
  move(): void {
    state.profile.address.city = 'Lisboa'
    state.profile.address = { ...state.profile.address, zip: '1100' }
  },
  tag(): void {
    state.profile.tags.push(`tag${state.profile.tags.length}`)
  },
  pick(tag: string): void {
    state.picked = tag
  },
})
</script>

<template>
  <MColumn gap="sm">
    <MText>{{
      `${state.profile.name} in ${state.profile.address.city} ${state.profile.address.zip}; picked ${state.picked}`
    }}</MText>
    <Card
      :title="state.profile.name"
      :tags="state.profile.tags"
      :onPick="(tag) => state.pick(tag)"
    />
    <MColumn gap="xs">
      <MButton text="Rename" @click="() => state.rename()" />
      <MButton text="Move" @click="() => state.move()" />
      <MButton text="Tag" @click="() => state.tag()" />
    </MColumn>
  </MColumn>
</template>
