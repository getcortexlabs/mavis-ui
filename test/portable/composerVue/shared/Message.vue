<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MColumn, MComposer, MText } from '#mavis'
import type { ComposerAttachment, ComposerMessage } from '#mavis'

const text = ref('Hello from Mavis')
const files = ref<ComposerAttachment[]>([{ id: 'brief', name: 'Brief.pdf' }])
const sent = ref('Not sent')
const count = ref(0)
const locked = ref(false)
const loading = ref(false)

function attach() {
  files.value = [{ id: 'brief', name: 'Brief.pdf' }]
}

function send(message: ComposerMessage) {
  count.value = count.value + 1
  sent.value = `${message.text} (${message.attachments.length} attachments)`
}
</script>

<template>
  <MColumn gap="md">
    <MComposer
      id="message"
      v-model="text"
      v-model:attachments="files"
      label="Message"
      :disabled="locked"
      :loading="loading"
      placeholder="Write something"
      :max-length="120"
      @attach="attach"
      @submit="send"
    >
      <MText>Draft stays until you clear it</MText>
    </MComposer>
    <MText id="sent">{{ sent }}</MText>
    <MText id="count">{{ `Sent ${count}` }}</MText>
    <MText id="draft">{{ `Draft: ${text}` }}</MText>
    <MButton text="Clear draft" @click="text = ''" />
    <MButton :text="locked ? 'Unlock' : 'Lock'" @click="locked = !locked" />
    <MButton :text="loading ? 'Stop sending' : 'Start sending'" @click="loading = !loading" />
  </MColumn>
</template>
