<script setup lang="ts">
import { reactive } from 'vue'
import type { SwipeCard } from './types'

const state = reactive({
  cards: [
    { id: 'garden', title: 'Moon garden', description: 'A quiet place', image: undefined },
    { id: 'cabin', title: 'Forest cabin', description: 'Among the trees', image: undefined },
  ] as SwipeCard[],
  current: 'garden' as string | undefined,
  previous: undefined as string | undefined,
  last: 'none' as string,
  locked: false as boolean,
})
</script>

<template>
  <MColumn gap="md">
    <MSwipeDeck
      id="ideas"
      label="Weekend ideas"
      :items="state.cards"
      :modelValue="state.current"
      @update:modelValue="(value) => (state.current = value)"
      :disabled="state.locked"
      :canUndo="state.previous !== undefined"
      @decide="
        (event) => {
          state.previous = event.item.id
          state.last = `${event.item.title}: ${event.decision}`
        }
      "
      @undo="
        () => {
          state.current = state.previous
          state.previous = undefined
        }
      "
    />
    <MButton
      :text="state.locked ? 'Unlock' : 'Lock'"
      @click="() => (state.locked = !state.locked)"
    />
    <MText>{{ `Decision: ${state.last}` }}</MText>
  </MColumn>
</template>
