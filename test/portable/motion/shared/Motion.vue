<script setup lang="ts">
import { reactive } from 'vue'
import type { Card } from './types'
import { vMavisKeepFocus } from './runtime'
import { useComponentLayout } from '@getcortexlabs/mavis-core/vue'

const state = reactive({
  open: false as boolean,
  cards: [
    { id: 'a', title: 'Alpha' },
    { id: 'b', title: 'Beta' },
  ] as Card[],
  count: 2 as number,
  toggle(): void {
    state.open = !state.open
  },
  add(): void {
    state.count += 1
    state.cards.push({ id: `card${state.count}`, title: `Card ${state.count}` })
  },
  removeFirst(): void {
    state.cards.splice(0, 1)
  },
  lastToTop(): void {
    const last = state.cards[state.cards.length - 1]
    if (last === undefined) return
    state.cards.splice(state.cards.length - 1, 1)
    state.cards.unshift(last)
  },
})
const mavisRows1 = useComponentLayout(() => state.cards.map((card) => card.id))
</script>

<template>
  <MColumn gap="md">
    <MText variant="title">Motion</MText>
    <MRow gap="sm">
      <MButton text="Toggle details" @click="() => state.toggle()" />
      <MButton text="Add card" variant="secondary" @click="() => state.add()" />
      <MButton text="Remove first" variant="secondary" @click="() => state.removeFirst()" />
      <MButton text="Last to top" variant="secondary" @click="() => state.lastToTop()" />
    </MRow>
    <MReveal :show="state.open" gap="md">
      <MText>Details are open</MText>
      <MText tone="muted">{{ `${state.cards.length} cards` }}</MText>
    </MReveal>
    <MReveal :show="!state.open" gap="md">
      <MText tone="muted">Details are closed</MText>
    </MReveal>
    <MColumn gap="sm" :motionRegion="mavisRows1" v-mavis-keep-focus>
      <template v-for="card in state.cards" :key="card.id">
        <MText>{{ card.title }}</MText>
      </template>
    </MColumn>
    <template v-if="state.cards.length === 0">
      <MText tone="muted">No cards</MText>
    </template>
  </MColumn>
</template>
