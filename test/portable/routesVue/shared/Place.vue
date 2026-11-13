<script setup lang="ts">
import { computed } from 'vue'
import { MButton, MColumn, MLink, MRow, MScreen, MText, useMavisNavigation } from '#mavis'
import { venueAt } from './venues'

const props = defineProps<{ id: string }>()
const navigation = useMavisNavigation()
const venue = computed(() => venueAt(props.id))
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText as="h1" variant="title">{{ venue?.name ?? 'Unknown place' }}</MText>
      <MText tone="muted">In {{ venue?.city ?? 'no city' }}, as {{ id }}.</MText>
      <MRow gap="sm">
        <MButton text="Back" variant="secondary" @click="navigation.back()" />
        <MButton text="Notes" :href="`/places/${id}/notes`" />
      </MRow>
      <MLink href="/" text="All places" />
      <MLink
        href="/places/library"
        text="Swap for the library"
        :navigate="(href) => navigation.replace(href)"
      />
    </MColumn>
  </MScreen>
</template>
