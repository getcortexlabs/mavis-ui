<script setup lang="ts">
import { reactive } from 'vue'
import * as mavisVenues from './shared/venues'
import { vMavisKeepFocus } from './runtime'
import { useMavisNavigation } from '@getcortexlabs/mavis-core/vue'

const state = reactive({
  surprise(): void {
    mavisNavigation.push('/places/studio')
  },
})
const mavisNavigation = useMavisNavigation()
</script>

<template>
  <MScreen :scroll="true">
    <MColumn id="home" padding="lg" gap="md" v-mavis-keep-focus>
      <MText as="h1" variant="title">Places</MText>
      <MText tone="muted">{{ `${mavisVenues.venues.length} places to visit.` }}</MText>
      <template v-for="venue in mavisVenues.venues" :key="venue.id">
        <MCard
          :id="`place-${venue.id}`"
          :href="`/places/${venue.id}`"
          :accessibilityLabel="`Open ${venue.name}`"
          gap="xs"
        >
          <MText variant="heading">{{ venue.name }}</MText>
          <MText tone="muted">{{ venue.city }}</MText>
        </MCard>
      </template>
      <MButton id="surprise" text="Surprise me" @click="() => state.surprise()" />
      <MLink id="search" href="/search?q=tea" text="Search tea" />
      <MRow id="more" gap="md">
        <MLink id="nowhere" href="/nowhere" text="Nowhere" />
        <MLink id="closed" href="/places/garden" text="Closed today" :disabled="true" />
      </MRow>
    </MColumn>
  </MScreen>
</template>
