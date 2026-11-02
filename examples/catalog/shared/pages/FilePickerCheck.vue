<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { useFileSelection } from '@getcortexlabs/mavis-core/vue'
const disabled = ref(false)
const visible = ref(true)
const failures = ref(false)
const unknown = ref(false)
const late = ref(false)
const calls = ref(0)
const cancellations = ref(0)
const selection = useFileSelection({
  multiple: true,
  maxCount: 3,
  maxSize: 2048,
  accept: ['.pdf', 'image/*', '.txt'],
  upload: ({ progress, cancellation }) =>
    new Promise<void>((resolve, reject) => {
      calls.value++
      const fail = failures.value
      failures.value = false
      const completeLate = late.value
      let step = 0
      const timer = setInterval(() => {
        step++
        progress(step, unknown.value ? undefined : 20)
        if (fail && step === 3) {
          clearInterval(timer)
          unsubscribe()
          reject(new Error('Fixture upload failed'))
        } else if (step === 20) {
          clearInterval(timer)
          unsubscribe()
          resolve()
        }
      }, 100)
      const unsubscribe = cancellation.onCancel(() => {
        cancellations.value++
        if (!completeLate) {
          clearInterval(timer)
          resolve()
        }
      })
    }),
})
const state = shallowRef(selection.state)
const unsubscribe = selection.subscribe((value) => {
  state.value = value
})
onBeforeUnmount(unsubscribe)
</script>
<template>
  <m-screen>
    <m-column gap="md" padding="md">
      <m-text variant="title">File selection check</m-text>
      <m-file-picker
        v-if="visible"
        :selection="selection"
        label="Check attachments"
        :disabled="disabled"
      />
      <m-button id="file-toggle" variant="secondary" @click="visible = !visible"
        >Toggle files</m-button
      >
      <m-switch v-model="disabled" label="Disable files" />
      <m-switch v-model="failures" label="Fail next upload" />
      <m-switch v-model="unknown" label="Unknown upload total" />
      <m-switch v-model="late" label="Allow late completion" />
      <m-text id="file-check-state">{{ JSON.stringify(state) }}</m-text>
      <m-text id="file-check-counts">{{
        `Calls: ${calls}; cancellations: ${cancellations}`
      }}</m-text>
    </m-column>
  </m-screen>
</template>
