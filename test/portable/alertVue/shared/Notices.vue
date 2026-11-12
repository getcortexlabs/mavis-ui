<script setup lang="ts">
import { computed, ref } from 'vue'
import { MAlert, MButton, MColumn, MText } from '#mavis'

const saved = ref(true)
const tries = ref(0)
const tone = computed(() => (tries.value > 1 ? 'error' : 'warning'))
</script>

<template>
  <MColumn id="page" gap="md" :width="360">
    <MText>{{ saved ? 'Saved' : 'Dismissed' }}</MText>
    <MAlert
      id="sync"
      title="Sync is on"
      description="Changes reach your other devices in a moment."
    />
    <MAlert
      v-if="saved"
      id="saved"
      title="Draft saved"
      tone="success"
      dismissible
      closeLabel="Dismiss saved"
      @close="saved = false"
    />
    <m-alert
      id="failed"
      title="Upload failed"
      :description="`Tried ${tries} times.`"
      :tone="tone"
      announce
    >
      <template #actions>
        <MButton id="retry" text="Retry" size="sm" @click="tries += 1" />
        <MButton id="forget" text="Forget" variant="ghost" size="sm" @click="tries = 0" />
      </template>
    </m-alert>
    <MAlert id="narrow" title="Almost full" tone="warning" :width="240" />
    <MButton text="Restore" @click="saved = true" />
  </MColumn>
</template>
