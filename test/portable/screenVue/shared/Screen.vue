<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MCard, MColumn, MScreen, MText } from '#mavis'

const count = ref(0)
const cards = [
  'North',
  'East',
  'South',
  'West',
  'Harbor',
  'Ridge',
  'Meadow',
  'Grove',
  'Shore',
  'Peak',
]
</script>

<template>
  <m-screen id="screen" scroll>
    <template #overlay>
      <MColumn id="screen-overlay" padding="md">
        <MCard id="screen-bar" padding="md">
          <MText weight="bold">Held over the content</MText>
        </MCard>
      </MColumn>
    </template>
    <MColumn id="screen-content" paddingX="lg" :paddingY="96" gap="md">
      <MText id="screen-first" variant="title" as="h1">A screen of its own</MText>
      <MButton id="screen-count" text="Count" @click="count++" />
      <MText>Counted {{ count }}</MText>
      <MColumn id="screen-gap" :height="48" />
      <MCard v-for="card in cards" :key="card" :height="120">
        <MText>{{ card }}</MText>
      </MCard>
    </MColumn>
  </m-screen>
</template>
