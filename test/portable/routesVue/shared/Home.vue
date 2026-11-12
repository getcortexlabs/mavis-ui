<script setup lang="ts">
import { MButton, MCard, MColumn, MLink, MRow, MScreen, MText, useMavisNavigation } from '#mavis'
import { venues } from './venues'

const navigation = useMavisNavigation()
function surprise() {
  void navigation.push('/places/studio')
}
</script>

<template>
  <MScreen scroll>
    <MColumn id="home" padding="lg" gap="md">
      <MText as="h1" variant="title">Places</MText>
      <MText tone="muted">{{ venues.length }} places to visit.</MText>
      <MCard
        v-for="venue in venues"
        :key="venue.id"
        :id="`place-${venue.id}`"
        :href="`/places/${venue.id}`"
        :accessibilityLabel="`Open ${venue.name}`"
        gap="xs"
      >
        <MText variant="heading">{{ venue.name }}</MText>
        <MText tone="muted">{{ venue.city }}</MText>
      </MCard>
      <MButton id="surprise" text="Surprise me" @click="surprise" />
      <MLink id="search" href="/search?q=tea" text="Search tea" />
      <MRow id="more" gap="md">
        <MLink id="nowhere" href="/nowhere">Nowhere</MLink>
        <MLink id="closed" href="/places/garden" text="Closed today" disabled />
      </MRow>
    </MColumn>
  </MScreen>
</template>
