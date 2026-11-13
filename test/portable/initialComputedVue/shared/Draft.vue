<script setup lang="ts">
import { computed, ref } from 'vue'
const props = defineProps<{ value: string }>()
const caption = computed(() => props.value + ' caption')
const draft = ref(caption.value)
function edit() {
  draft.value = 'Edited draft'
}
</script>

<template>
  <MColumn gap="md">
    <MText>{{ caption }}</MText>
    <MText>{{ draft }}</MText>
    <MButton text="Edit draft" @click="edit" />
  </MColumn>
</template>
