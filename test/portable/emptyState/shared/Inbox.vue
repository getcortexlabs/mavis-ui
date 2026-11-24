<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  written: 0 as number,
  get symbol(): string {
    return state.written > 0 ? 'mail' : 'inbox'
  },
})
</script>

<template>
  <MColumn id="page" gap="md" :width="360">
    <MEmptyState
      id="empty"
      title="No messages yet"
      description="Messages from your team show up here."
      :icon="state.symbol"
    >
      <template #actions>
        <MButton id="write" text="Write one" @click="() => (state.written += 1)" />
        <MButton id="clear" text="Clear" variant="ghost" @click="() => (state.written = 0)" />
      </template>
    </MEmptyState>
    <MEmptyState
      id="found"
      title="Nothing found"
      icon="search"
      tone="accent"
      :compact="true"
      titleAs="h3"
    />
    <MEmptyState id="done" title="All done" :compact="true" :width="240">
      <template #illustration>
        <MColumn :width="40" :height="40" radius="sm" backgroundColor="#E9DDF7">
          <MText>Art</MText>
        </MColumn>
      </template>
    </MEmptyState>
    <MText>{{ `${state.written} written` }}</MText>
  </MColumn>
</template>
