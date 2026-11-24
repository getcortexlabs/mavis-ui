<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import * as mavisUploads from './shared/uploads'
import { useFileSelection } from '@getcortexlabs/mavis-core/vue'

const service = mavisUploads.useUploads()
const state = reactive({
  count: 0 as number,
  status: 'none' as string,
  async load(): Promise<void> {
    try {
      await service.select(files)
    } catch {
      state.status = 'selection failed'
    }
  },
})
onMounted(() => {
  state.count = files.state.items.length
  files.subscribe((snapshot) => {
    state.count = snapshot.items.length
    state.status = snapshot.items[0]?.status ?? 'none'
  })
})
const files = useFileSelection({ upload: async (context) => await service.upload(context) })
</script>

<template>
  <MColumn gap="md">
    <MFilePicker label="Attachments" :selection="files" />
    <MText>{{ `Count ${state.count}` }}</MText>
    <MText>{{ `Status ${state.status}` }}</MText>
    <MButton text="Load fixture" @click="() => state.load()" />
    <MButton text="Clear all" @click="() => files.clear()" />
  </MColumn>
</template>
