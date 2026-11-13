<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDirectory } from './directory-store'
const directory = useDirectory()
const entry = computed(() => directory.entries.value.find((item) => item.id === 'garden'))
const draft = ref(entry.value?.name ?? '')
const dirty = ref(false)
watch(
  () => entry.value?.name ?? '',
  (value) => {
    if (!dirty.value) draft.value = value
  },
)
function edit() {
  dirty.value = true
  draft.value = 'Kept draft'
}
</script>
<template>
  <MColumn gap="md">
    <MText>{{ draft }}</MText>
    <MButton text="Keep a draft" @click="edit" />
  </MColumn>
</template>
