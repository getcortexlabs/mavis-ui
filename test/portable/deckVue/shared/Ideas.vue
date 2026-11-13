<script setup lang="ts">
import { ref } from 'vue'
import type { SwipeCard } from '#mavis'
const cards = ref<SwipeCard[]>([
  { id: 'garden', title: 'Moon garden', description: 'A quiet place' },
  { id: 'cabin', title: 'Forest cabin', description: 'Among the trees' },
])
const current = ref<string | null>('garden')
const previous = ref<string | null>(null)
const last = ref('none')
const locked = ref(false)
</script>
<template>
  <MColumn gap="md">
    <MSwipeDeck
      id="ideas"
      label="Weekend ideas"
      :items="cards"
      v-model="current"
      :disabled="locked"
      :can-undo="previous !== null"
      @decide="
        (event) => {
          previous = event.item.id
          last = `${event.item.title}: ${event.decision}`
        }
      "
      @undo="
        () => {
          current = previous
          previous = null
        }
      "
    />
    <MButton :text="locked ? 'Unlock' : 'Lock'" @click="locked = !locked" />
    <MText>Decision: {{ last }}</MText>
  </MColumn>
</template>
