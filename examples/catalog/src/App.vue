<script setup lang="ts">
declare const __LAYOUT_CHECK__: boolean
declare const __SCREEN_CHECK__: boolean
declare const __ACCESSIBILITY_CHECK__: boolean
const initial = __ACCESSIBILITY_CHECK__
  ? '/checks/accessibility'
  : __SCREEN_CHECK__
    ? '/checks/screen'
    : __LAYOUT_CHECK__
      ? '/checks/layout'
      : '/'
</script>

<template>
  <RouterView :initial="initial" />
</template>
