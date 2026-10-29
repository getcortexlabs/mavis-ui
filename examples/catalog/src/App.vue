<script setup lang="ts">
declare const __LAYOUT_CHECK__: boolean
const initial = __LAYOUT_CHECK__ ? '/checks/layout' : '/'
</script>

<template>
  <RouterView :initial="initial" />
</template>
