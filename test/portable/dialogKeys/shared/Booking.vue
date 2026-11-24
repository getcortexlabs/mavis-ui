<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  confirm: false as boolean,
  remove: false as boolean,
  removing: false as boolean,
  status: 'draft' as string,
  reason: 'none' as string,
})
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText variant="title" as="h1">Trip to Lisbon</MText>
      <MText>{{ `Status: ${state.status}` }}</MText>
      <MColumn id="closed">
        <MText>{{ `Last close: ${state.reason}` }}</MText>
      </MColumn>
      <MDialog
        :open="state.confirm"
        @update:open="(value) => (state.confirm = value)"
        @close="(next) => (state.reason = next)"
        @confirm="
          () => {
            state.status = 'booked'
            state.confirm = false
          }
        "
        title="Confirm booking?"
        description="You will be charged now."
        confirmLabel="Book now"
        cancelLabel="Not yet"
      />
      <MRow id="actions" gap="sm">
        <MButton text="Book" @click="() => (state.confirm = true)" />
        <MButton text="Delete trip" variant="secondary" @click="() => (state.remove = true)" />
      </MRow>
      <MDialog
        :open="state.remove"
        @update:open="(value) => (state.remove = value)"
        @close="(next) => (state.reason = next)"
        @confirm="() => (state.removing = true)"
        title="Delete this trip?"
        description="This cannot be undone."
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        tone="danger"
        :loading="state.removing"
        :dismissible="false"
      />
    </MColumn>
  </MScreen>
</template>
