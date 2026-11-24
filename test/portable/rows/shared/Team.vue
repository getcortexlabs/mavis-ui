<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  opened: 'nobody' as string,
  locked: false as boolean,
  lock(): void {
    state.locked = !state.locked
  },
})
</script>

<template>
  <MColumn gap="md">
    <MListItem id="plain" title="Marina Costa" description="Design, São Paulo">
      <template #leading>
        <MColumn id="plain-lead" :width="40" :height="40" radius="full" backgroundColor="#E9DDF7" />
      </template>
      <template #trailing>
        <MText id="plain-trail" variant="caption" tone="muted">Online</MText>
      </template>
    </MListItem>
    <MRow id="pair" gap="md" align="start">
      <MListItem id="bare" title="Only a title" :grow="1" />
      <MListItem id="narrow" title="Fixed" description="A third" :width="220" />
    </MRow>
    <MListItem
      title="Rui Tavares"
      description="Engineering"
      interactive
      @click="() => (state.opened = 'Rui')"
    >
      <template #leading>
        <MText>RT</MText>
      </template>
    </MListItem>
    <MListItem
      title="Ines Prado"
      description="Support"
      accessibilityLabel="Open Ines Prado, away"
      :disabled="state.locked"
      interactive
      @click="() => (state.opened = 'Ines')"
    >
      <template #trailing>
        <MText variant="caption">Away</MText>
      </template>
    </MListItem>
    <MRow gap="sm">
      <MButton :text="state.locked ? 'Unlock' : 'Lock'" @click="() => state.lock()" />
      <MText id="opened">{{ `Opened: ${state.opened}` }}</MText>
    </MRow>
  </MColumn>
</template>
