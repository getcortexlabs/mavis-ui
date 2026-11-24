<script setup lang="ts">
const props = defineProps({
  name: { type: String, required: true },
  title: { type: String, required: true },
})
defineSlots<{
  header?: () => unknown
  footer?: () => unknown
  default?: () => unknown
}>()
</script>

<template>
  <MColumn :id="props.name" gap="sm" padding="md">
    <slot name="header">
      <MText :id="`${props.name}-title`" variant="heading">{{ props.title }}</MText>
    </slot>
    <slot />
    <slot name="footer" />
  </MColumn>
</template>
