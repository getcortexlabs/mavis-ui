<script setup lang="ts">
import { ref } from 'vue'
import { useWork } from './work'
const props = defineProps<{ id: string }>()
const work = useWork()
const status = ref('No pending draft')
async function wait() {
  const before = props.id
  status.value = 'Waiting for ' + before
  await work.load()
  status.value = props.id === before ? 'Applied ' + before : 'Ignored ' + before
}
</script>
<template>
  <MColumn gap="md">
    <MText>{{ status }}</MText>
    <MButton text="Wait with current id" @click="wait" />
  </MColumn>
</template>
