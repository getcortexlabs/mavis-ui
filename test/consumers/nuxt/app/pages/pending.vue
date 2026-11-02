<script setup lang="ts">
import { useMavisTheme } from '@getcortexlabs/mavis-web'
useMavisTheme().setAppearance('dark')
await useAsyncData('pending', async () => {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return 'Pending request only'
})
</script>

<template><p>Pending request only</p></template>
