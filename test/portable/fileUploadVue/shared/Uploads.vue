<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFileSelection } from '@getcortexlabs/mavis-core/vue'
import { MButton, MColumn, MFilePicker, MText } from '#mavis'
import { useUploads } from './uploads'
const service = useUploads()
const files = useFileSelection({
  upload: async (context) => {
    await service.upload(context)
  },
})
const count = ref(0)
const status = ref('none')
async function load() {
  try {
    await service.select(files)
  } catch {
    status.value = 'selection failed'
  }
}
onMounted(() => {
  count.value = files.state.items.length
  files.subscribe((snapshot) => {
    count.value = snapshot.items.length
    status.value = snapshot.items[0]?.status ?? 'none'
  })
})
</script>
<template>
  <MColumn gap="md">
    <MFilePicker label="Attachments" :selection="files" />
    <MText>{{ `Count ${count}` }}</MText
    ><MText>{{ `Status ${status}` }}</MText> <MButton text="Load fixture" @click="load" /><MButton
      text="Clear all"
      @click="files.clear()"
    />
  </MColumn>
</template>
