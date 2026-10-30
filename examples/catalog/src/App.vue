<script setup lang="ts">
declare const __LAYOUT_CHECK__: boolean
declare const __SCREEN_CHECK__: boolean
declare const __ACCESSIBILITY_CHECK__: boolean
declare const __INPUT_CHECK__: string
declare const __PERFORMANCE_CHECK__: boolean

let initial = '/'
if (__PERFORMANCE_CHECK__) initial = '/checks/performance'
else if (__INPUT_CHECK__ === 'contract') initial = '/checks/input'
else if (__INPUT_CHECK__ === 'demo') initial = '/components/input'
else if (__INPUT_CHECK__) initial = '/showcase/profile'
else if (__ACCESSIBILITY_CHECK__) initial = '/checks/accessibility'
else if (__SCREEN_CHECK__) initial = '/checks/screen'
else if (__LAYOUT_CHECK__) initial = '/checks/layout'
</script>

<template>
  <RouterView :initial="initial" />
</template>
