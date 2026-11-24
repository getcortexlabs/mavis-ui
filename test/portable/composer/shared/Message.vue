<script setup lang="ts">
import { reactive } from 'vue'
import type { ComposerAttachment, ComposerMessage } from './types'

const state = reactive({
  text: 'Hello from Mavis' as string,
  files: [{ id: 'brief', name: 'Brief.pdf' }] as ComposerAttachment[],
  sent: 'Not sent' as string,
  count: 0 as number,
  locked: false as boolean,
  loading: false as boolean,
  attach(): void {
    state.files = [{ id: 'brief', name: 'Brief.pdf' }]
  },
  send(message: ComposerMessage): void {
    state.count = state.count + 1
    state.sent = `${message.text} (${message.attachments.length} attachments)`
  },
})
</script>

<template>
  <MColumn gap="md">
    <MComposer
      id="message"
      label="Message"
      :modelValue="state.text"
      @update:modelValue="(value) => (state.text = value)"
      :attachments="state.files"
      @update:attachments="(value) => (state.files = value)"
      @attach="() => state.attach()"
      @submit="(message) => state.send(message)"
      :disabled="state.locked"
      :loading="state.loading"
      placeholder="Write something"
      :maxLength="120"
    >
      <MText>Draft stays until you clear it</MText>
    </MComposer>
    <MText id="sent">{{ state.sent }}</MText>
    <MText id="count">{{ `Sent ${state.count}` }}</MText>
    <MText id="draft">{{ `Draft: ${state.text}` }}</MText>
    <MButton text="Clear draft" @click="() => (state.text = '')" />
    <MButton
      :text="state.locked ? 'Unlock' : 'Lock'"
      @click="() => (state.locked = !state.locked)"
    />
    <MButton
      :text="state.loading ? 'Stop sending' : 'Start sending'"
      @click="() => (state.loading = !state.loading)"
    />
  </MColumn>
</template>
