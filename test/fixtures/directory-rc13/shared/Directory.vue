<script setup lang="ts">
import { computed } from 'vue'
import { MScreen, MColumn, MText, MInput, MGrid, MCard, MAlert, MEmptyState } from '#mavis'
import { useDirectory } from './directory-store'
const { entries, query, storageError } = useDirectory()
const results = computed(() => {
  const filter = query.value.trim().toLocaleLowerCase('en')
  return entries.value.filter((entry) =>
    `${entry.name} ${entry.city}`.toLocaleLowerCase('en').includes(filter),
  )
})
</script>
<template>
  <MScreen scroll>
    <MColumn padding="lg" gap="lg">
      <MText as="h1" variant="title">Community directory</MText>
      <MText tone="muted">Find a place to learn, create or meet your neighbours.</MText>
      <MInput
        id="directory-search"
        v-model="query"
        label="Search places"
        placeholder="Name or city"
      />
      <MAlert
        v-if="storageError"
        tone="warning"
        title="Storage unavailable"
        :description="storageError"
      />
      <MText variant="caption">{{ results.length }} places found</MText>
      <MEmptyState
        v-if="!results.length"
        title="No places found"
        description="Try another name or city."
      />
      <MGrid :minColumnWidth="240" gap="md">
        <MCard
          v-for="entry in results"
          :key="entry.id"
          :id="`entry-${entry.id}`"
          :href="`/entries/${entry.id}`"
          :accessibilityLabel="`Open ${entry.name}`"
          gap="sm"
        >
          <MText variant="heading">{{ entry.name }}</MText>
          <MText tone="muted">{{ entry.city }}</MText>
        </MCard>
      </MGrid>
    </MColumn>
  </MScreen>
</template>
