<script setup lang="ts">
import { ref } from 'vue'

const confirm = ref(false)
const remove = ref(false)
const removing = ref(false)
const status = ref('draft')
const reason = ref('none')
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText variant="title" as="h1">Trip to Lisbon</MText>
      <MText>Status: {{ status }}</MText>
      <MColumn id="closed">
        <MText>Last close: {{ reason }}</MText>
      </MColumn>
      <MDialog
        v-model:open="confirm"
        title="Confirm booking?"
        description="You will be charged now."
        confirm-label="Book now"
        cancel-label="Not yet"
        @close="(next) => (reason = next)"
        @confirm="
          () => {
            status = 'booked'
            confirm = false
          }
        "
      />
      <MRow id="actions" gap="sm">
        <MButton text="Book" @click="confirm = true" />
        <MButton text="Delete trip" variant="secondary" @click="remove = true" />
      </MRow>
      <m-dialog
        v-model:open="remove"
        title="Delete this trip?"
        description="This cannot be undone."
        confirm-label="Delete"
        loading-label="Deleting…"
        tone="danger"
        :loading="removing"
        :dismissible="false"
        @close="(next) => (reason = next)"
        @confirm="removing = true"
      />
    </MColumn>
  </MScreen>
</template>
