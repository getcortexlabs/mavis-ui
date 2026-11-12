<script setup lang="ts">
import { ref } from 'vue'

const edition = ref(1)
const offline = ref(false)
const paused = ref(false)
const seen = ref('idle')

function reload() {
  if (offline.value) throw new Error('Offline')
  edition.value += 1
}
</script>

<template>
  <MColumn gap="md">
    <m-refresh-control
      id="daily"
      label="Morning edition"
      :refresh="reload"
      :height="320"
      :disabled="paused"
      success-label="You are up to date"
      error-label="Offline. Your stories are still here."
      retry-label="Try again"
      @state-change="(next) => (seen = next)"
    >
      <MColumn padding="md" gap="md">
        <MText id="daily-edition">Edition {{ edition }}</MText>
        <MCard>
          <MText>A different way to start</MText>
          <MBox :height="64" />
        </MCard>
        <MCard>
          <MText>Small things, noticed</MText>
          <MBox :height="64" />
        </MCard>
        <MCard>
          <MText>Make time for a detour</MText>
          <MBox :height="64" />
        </MCard>
      </MColumn>
    </m-refresh-control>
    <MText>Last state: {{ seen }}</MText>
    <MRow gap="sm" wrap>
      <MButton
        :text="offline ? 'Go online' : 'Go offline'"
        variant="secondary"
        @click="offline = !offline"
      />
      <MButton
        :text="paused ? 'Resume updates' : 'Pause updates'"
        variant="secondary"
        @click="paused = !paused"
      />
    </MRow>
  </MColumn>
</template>
