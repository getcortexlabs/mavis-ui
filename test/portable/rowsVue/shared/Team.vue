<script setup lang="ts">
import { ref } from 'vue'

const opened = ref('nobody')
const locked = ref(false)

function lock() {
  locked.value = !locked.value
}
</script>

<template>
  <MColumn gap="md">
    <MListItem id="plain" title="Marina Costa" description="Design, São Paulo">
      <template #leading>
        <MColumn
          id="plain-lead"
          :width="40"
          :height="40"
          radius="full"
          background-color="#E9DDF7"
        />
      </template>
      <template #trailing>
        <MText id="plain-trail" variant="caption" tone="muted">Online</MText>
      </template>
    </MListItem>
    <MRow id="pair" gap="md" align="start">
      <MListItem id="bare" title="Only a title" :grow="1" />
      <m-list-item id="narrow" title="Fixed" description="A third" :width="220" />
    </MRow>
    <MListItem title="Rui Tavares" description="Engineering" interactive @click="opened = 'Rui'">
      <template #leading>
        <MText>RT</MText>
      </template>
    </MListItem>
    <MListItem
      title="Ines Prado"
      description="Support"
      accessibility-label="Open Ines Prado, away"
      :disabled="locked"
      interactive
      @click="() => (opened = 'Ines')"
    >
      <template #trailing>
        <MText variant="caption">Away</MText>
      </template>
    </MListItem>
    <MRow gap="sm">
      <MButton :text="locked ? 'Unlock' : 'Lock'" @click="lock" />
      <MText id="opened">Opened: {{ opened }}</MText>
    </MRow>
  </MColumn>
</template>
