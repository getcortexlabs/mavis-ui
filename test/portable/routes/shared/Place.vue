<script setup lang="ts">
import { reactive } from 'vue'
import type { Venue } from './types'
import * as mavisVenues from './shared/venues'
import { useMavisNavigation } from '@getcortexlabs/mavis-core/vue'

const props = defineProps({
  id: { type: String, required: true },
})
const state = reactive({
  get venue(): Venue | undefined {
    return mavisVenues.venueAt(props.id)
  },
})
const mavisNavigation = useMavisNavigation()
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText as="h1" variant="title">{{ state.venue?.name ?? 'Unknown place' }}</MText>
      <MText tone="muted">{{ `In ${state.venue?.city ?? 'no city'}, as ${props.id}.` }}</MText>
      <MRow gap="sm">
        <MButton text="Back" variant="secondary" @click="() => mavisNavigation.back()" />
        <MButton text="Notes" :href="`/places/${props.id}/notes`" />
      </MRow>
      <MLink href="/" text="All places" />
      <MLink
        href="/places/library"
        text="Swap for the library"
        :navigate="(href) => mavisNavigation.replace(href)"
      />
    </MColumn>
  </MScreen>
</template>
