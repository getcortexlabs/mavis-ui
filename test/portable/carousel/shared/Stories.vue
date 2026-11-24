<script setup lang="ts">
import { reactive } from 'vue'
import type { Story } from './types'

const state = reactive({
  current: undefined as string | undefined,
  looping: false as boolean,
  locked: false as boolean,
  stories: [
    { id: 'walk', title: 'A walk before breakfast', note: 'The street is still asleep.' },
    { id: 'market', title: 'Saturday market', note: 'Peaches, bread and a long chat.' },
    { id: 'ferry', title: 'The last ferry', note: 'Lights on the water, all the way back.' },
  ] as Story[],
  clear(): void {
    state.stories = []
  },
})
</script>

<template>
  <MColumn gap="md" :width="360">
    <MCarousel
      id="stories"
      label="Stories"
      :items="state.stories"
      :modelValue="state.current"
      @update:modelValue="(value) => (state.current = value)"
      :loop="state.looping"
      :disabled="state.locked"
    >
      <template #default="{ item, index }">
        <MColumn id="slide" padding="lg" gap="sm" backgroundColor="#F4E9FF">
          <MText variant="heading">{{ item.title }}</MText>
          <MText>{{ item.note }}</MText>
          <MText tone="muted">{{ `Story ${index + 1}` }}</MText>
        </MColumn>
      </template>
      <template #empty>
        <MText>Nothing to read yet</MText>
      </template>
    </MCarousel>
    <MText>{{ `Current: ${state.current ?? 'none'}` }}</MText>
    <MRow gap="sm" :wrap="true">
      <MButton text="Loop" @click="() => (state.looping = !state.looping)" />
      <MButton text="Lock" @click="() => (state.locked = !state.locked)" />
      <MButton text="Clear" @click="() => state.clear()" />
    </MRow>
  </MColumn>
</template>
