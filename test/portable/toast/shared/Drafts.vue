<script setup lang="ts">
import { reactive } from 'vue'
import { useToast } from '@getcortexlabs/mavis-core/vue'

const state = reactive({
  saved: 0 as number,
  tone: 'success' as string,
  save(): void {
    state.saved += 1
    toast.show({
      message: `Version ${state.saved} is safe.`,
      title: 'Draft saved',
      tone: state.tone,
    })
  },
  fail(): void {
    toast.show({ message: 'The upload did not finish.', tone: 'error', duration: 0 })
  },
})
const toast = useToast()
</script>

<template>
  <MScreen>
    <MColumn id="page" gap="md" padding="lg">
      <MColumn id="top" :height="160" />
      <MText>{{ `${state.saved} saved` }}</MText>
      <MRow gap="sm">
        <MButton text="Save" @click="() => state.save()" />
        <MButton text="Fail" variant="secondary" @click="() => state.fail()" />
        <MButton
          text="Hint"
          variant="secondary"
          @click="() => toast.show({ message: 'Drafts save as you type.', duration: 400 })"
        />
      </MRow>
      <MRow gap="sm">
        <MButton text="Dismiss" variant="ghost" @click="() => toast.dismiss()" />
        <MButton text="Clear" variant="ghost" @click="() => toast.clear()" />
      </MRow>
      <MToast :controller="toast" closeLabel="Close message" />
    </MColumn>
  </MScreen>
</template>
