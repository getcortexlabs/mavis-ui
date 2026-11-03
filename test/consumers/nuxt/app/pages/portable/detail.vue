<script setup lang="ts">
await useAsyncData(
  'portable-detail',
  () => new Promise<string>((resolve) => setTimeout(() => resolve('ready'), 80)),
)
</script>
<template><PortableScene detail base="/portable" /></template>
