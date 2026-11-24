<script setup lang="ts">
import { reactive, type PropType } from 'vue'
import TagButton from './TagButton.vue'
import { vMavisKeepFocus } from './runtime'

const props = defineProps({
  title: { type: String, required: true },
  tags: { type: Array as PropType<string[]>, required: true },
  onPick: { type: Function as PropType<(arg0: string) => void>, required: true },
})
const state = reactive({
  firstTitle: props.title,
})
</script>

<template>
  <MColumn gap="xs" v-mavis-keep-focus>
    <MText>{{ `Now ${props.title}, first ${state.firstTitle}, ${props.tags.length} tags` }}</MText>
    <template v-for="(tag, index) in props.tags" :key="tag">
      <TagButton :label="`${index + 1}. ${tag}`" :onPress="() => props.onPick(tag)" />
    </template>
  </MColumn>
</template>
