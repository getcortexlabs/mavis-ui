<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MCarousel, MColumn, MRow, MText } from '#mavis'
import type { Story } from './types'

const current = ref<string | null>(null)
const looping = ref(false)
const locked = ref(false)
const stories = ref<Story[]>([
  { id: 'walk', title: 'A walk before breakfast', note: 'The street is still asleep.' },
  { id: 'market', title: 'Saturday market', note: 'Peaches, bread and a long chat.' },
  { id: 'ferry', title: 'The last ferry', note: 'Lights on the water, all the way back.' },
])

function clear() {
  stories.value = []
}
</script>

<template>
  <MColumn gap="md" :width="360">
    <MCarousel
      id="stories"
      v-model="current"
      label="Stories"
      :items="stories"
      :loop="looping"
      :disabled="locked"
    >
      <template #empty>
        <MText>Nothing to read yet</MText>
      </template>
      <template #default="{ item, index }">
        <MColumn id="slide" padding="lg" gap="sm" backgroundColor="#F4E9FF">
          <MText variant="heading">{{ item.title }}</MText>
          <MText>{{ item.note }}</MText>
          <MText tone="muted">Story {{ index + 1 }}</MText>
        </MColumn>
      </template>
    </MCarousel>
    <MText>Current: {{ current ?? 'none' }}</MText>
    <MRow gap="sm" wrap>
      <MButton text="Loop" @click="looping = !looping" />
      <MButton text="Lock" @click="locked = !locked" />
      <MButton text="Clear" @click="clear" />
    </MRow>
  </MColumn>
</template>
