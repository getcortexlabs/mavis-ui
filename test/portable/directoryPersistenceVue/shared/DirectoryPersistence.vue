<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDirectory } from './directory-store'

const directory = useDirectory()
const status = ref('Waiting')

onMounted(async () => {
  await directory.restore()
  status.value = 'Restored'
})
async function garden() {
  try {
    await directory.save('garden', 'New garden')
    status.value = 'Saved'
  } catch {
    status.value = 'Write rejected'
  }
}
async function library() {
  try {
    await directory.save('library', 'New library')
    status.value = 'Saved'
  } catch {
    status.value = 'Write rejected'
  }
}
function together() {
  garden()
  library()
}
async function reject() {
  try {
    await directory.save('garden', 'Blocked')
  } catch {
    status.value = 'Write rejected'
  }
}
async function restore() {
  await directory.restore()
  status.value = 'Restored again'
}
</script>

<template>
  <MColumn gap="md">
    <MText>{{ status }}</MText>
    <MText v-for="entry in directory.entries.value" :key="entry.id">{{ entry.name }}</MText>
    <MButton text="Edit both" @click="together" />
    <MButton text="Reject write" @click="reject" />
    <MButton text="Restore again" @click="restore" />
  </MColumn>
</template>
