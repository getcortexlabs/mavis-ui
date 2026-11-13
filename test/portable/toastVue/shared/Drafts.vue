<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MColumn, MRow, MScreen, MText, MToast, useToast, type ToastTone } from '#mavis'

const toast = useToast()
const saved = ref(0)
const tone = ref<ToastTone>('success')

function save() {
  saved.value += 1
  toast.show({
    title: 'Draft saved',
    message: `Version ${saved.value} is safe.`,
    tone: tone.value,
  })
}
function fail() {
  toast.show({ message: 'The upload did not finish.', tone: 'error', duration: 0 })
}
</script>

<template>
  <MScreen>
    <MColumn id="page" gap="md" padding="lg">
      <MColumn id="top" :height="160" />
      <MText>{{ `${saved} saved` }}</MText>
      <MRow gap="sm">
        <MButton text="Save" @click="save" />
        <MButton text="Fail" variant="secondary" @click="fail" />
        <MButton
          text="Hint"
          variant="secondary"
          @click="toast.show({ message: 'Drafts save as you type.', duration: 400 })"
        />
      </MRow>
      <MRow gap="sm">
        <MButton text="Dismiss" variant="ghost" @click="toast.dismiss()" />
        <MButton text="Clear" variant="ghost" @click="toast.clear()" />
      </MRow>
      <m-toast :controller="toast" closeLabel="Close message" />
    </MColumn>
  </MScreen>
</template>
