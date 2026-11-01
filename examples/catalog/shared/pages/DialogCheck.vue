<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useToast } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
const { navigation } = useCatalog()
const open = ref(false),
  loading = ref(false),
  dismissible = ref(true),
  reject = ref(false)
const long = ref(false),
  confirmations = ref(0),
  reason = ref('none'),
  failure = ref(false)
const toast = useToast()
let timer: ReturnType<typeof setTimeout> | undefined
function show(mode: string) {
  long.value = mode === 'long'
  dismissible.value = mode !== 'locked'
  reject.value = mode === 'reject'
  failure.value = false
  open.value = true
  if (mode === 'toast') toast.show({ message: 'After the decision', duration: 0 })
  if (mode === 'navigate') timer = setTimeout(() => navigation.push('/checks/screen/next'), 1800)
  if (mode === 'program')
    timer = setTimeout(() => {
      open.value = false
    }, 1200)
  if (mode === 'reopen')
    timer = setTimeout(() => {
      open.value = false
      timer = setTimeout(() => {
        open.value = true
      }, 30)
    }, 600)
}
function confirm() {
  confirmations.value++
  loading.value = true
  timer = setTimeout(() => {
    loading.value = false
    failure.value = true
  }, 1800)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="md">
      <m-text as="h1" variant="heading">Dialog checks</m-text>
      <m-button
        v-for="mode in [
          'normal',
          'locked',
          'reject',
          'long',
          'toast',
          'program',
          'reopen',
          'navigate',
        ]"
        :id="mode"
        :key="mode"
        @click="show(mode)"
        >{{ mode }}</m-button
      >
      <m-text>Confirmations: {{ confirmations }}</m-text>
      <m-text>Closed: {{ reason }}</m-text>
    </m-column>
    <m-dialog
      :open="open"
      @update:open="
        (value) => {
          if (!reject) open = value
        }
      "
      title="Delete collection?"
      tone="danger"
      :dismissible="dismissible"
      :loading="loading"
      :description="
        failure
          ? 'Could not finish. Try again.'
          : long
            ? 'Your photos and notes will be removed. This cannot be undone. '.repeat(30)
            : 'This cannot be undone.'
      "
      confirmLabel="Delete"
      cancelLabel="Keep collection"
      loadingLabel="Deleting…"
      @confirm="confirm"
      @close="reason = $event"
    />
    <m-toast :controller="toast" />
  </m-screen>
</template>
