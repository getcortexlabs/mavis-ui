<script setup lang="ts">
import { reactive } from 'vue'
import { vMavisKeepFocus } from './runtime'

const state = reactive({
  count: 0 as number,
  cards: [
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
  ] as string[],
})
</script>

<template>
  <MScreen id="screen" :scroll="true">
    <template #overlay>
      <MColumn id="screen-overlay" padding="md">
        <MCard id="screen-bar" padding="md">
          <MText weight="bold">Held over the content</MText>
        </MCard>
      </MColumn>
    </template>
    <MColumn id="screen-content" paddingX="lg" :paddingY="96" gap="md" v-mavis-keep-focus>
      <MText id="screen-first" variant="title" as="h1">A screen of its own</MText>
      <MButton id="screen-count" text="Count" @click="() => (state.count += 1)" />
      <MText>{{ `Counted ${state.count}` }}</MText>
      <MColumn id="screen-gap" :height="48" />
      <template v-for="card in state.cards" :key="card">
        <MCard :height="120">
          <MText>{{ card }}</MText>
        </MCard>
      </template>
    </MColumn>
  </MScreen>
</template>
