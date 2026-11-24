<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  saved: true as boolean,
  tries: 0 as number,
  get tone(): string {
    return state.tries > 1 ? 'error' : 'warning'
  },
})
</script>

<template>
  <MColumn id="page" gap="md" :width="360">
    <MText>{{ state.saved ? 'Saved' : 'Dismissed' }}</MText>
    <MAlert
      id="sync"
      title="Sync is on"
      description="Changes reach your other devices in a moment."
    />
    <template v-if="state.saved">
      <MAlert
        id="saved"
        title="Draft saved"
        tone="success"
        :dismissible="true"
        closeLabel="Dismiss saved"
        @close="() => (state.saved = false)"
      />
    </template>
    <MAlert
      id="failed"
      title="Upload failed"
      :description="`Tried ${state.tries} times.`"
      :tone="state.tone"
      :announce="true"
    >
      <template #actions>
        <MButton id="retry" text="Retry" size="sm" @click="() => (state.tries += 1)" />
        <MButton
          id="forget"
          text="Forget"
          variant="ghost"
          size="sm"
          @click="() => (state.tries = 0)"
        />
      </template>
    </MAlert>
    <MAlert id="narrow" title="Almost full" tone="warning" :width="240" />
    <MButton text="Restore" @click="() => (state.saved = true)" />
  </MColumn>
</template>
