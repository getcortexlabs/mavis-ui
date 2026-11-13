<script setup lang="ts">
import { computed, ref } from 'vue'
import { MButton, MColumn, MEmptyState, MText } from '#mavis'

const written = ref(0)
const symbol = computed(() => (written.value > 0 ? 'mail' : 'inbox'))
</script>

<template>
  <MColumn id="page" gap="md" :width="360">
    <MEmptyState
      id="empty"
      title="No messages yet"
      description="Messages from your team show up here."
      :icon="symbol"
    >
      <template #actions>
        <MButton id="write" text="Write one" @click="written += 1" />
        <MButton id="clear" text="Clear" variant="ghost" @click="written = 0" />
      </template>
    </MEmptyState>
    <m-empty-state
      id="found"
      title="Nothing found"
      icon="search"
      tone="accent"
      compact
      titleAs="h3"
    />
    <MEmptyState id="done" title="All done" compact :width="240">
      <template #illustration>
        <MColumn :width="40" :height="40" radius="sm" backgroundColor="#E9DDF7">
          <MText>Art</MText>
        </MColumn>
      </template>
    </MEmptyState>
    <MText>{{ `${written} written` }}</MText>
  </MColumn>
</template>
