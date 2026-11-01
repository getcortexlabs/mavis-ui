<script setup lang="ts">
declare const __MOTION_CHECK__: boolean
declare const __PRESS_CHECK__: boolean
declare const __LAYOUT_CHECK__: boolean
declare const __LAYOUT_NATIVE__: boolean
declare const __SCREEN_CHECK__: boolean
declare const __ACCESSIBILITY_CHECK__: boolean
declare const __INPUT_CHECK__: string
declare const __IDENTITY_CHECK__: string
declare const __SKELETON_CHECK__: boolean
declare const __TABS_CHECK__: boolean
declare const __DIALOG_CHECK__: boolean
declare const __TOAST_CHECK__: boolean
declare const __SELECT_CHECK__: boolean
declare const __PERFORMANCE_CHECK__: boolean

let initial = '/'
if (__MOTION_CHECK__) initial = '/checks/motion'
else if (__PRESS_CHECK__) initial = '/checks/press'
else if (__PERFORMANCE_CHECK__) initial = '/checks/performance'
else if (__IDENTITY_CHECK__) initial = `/components/${__IDENTITY_CHECK__}`
else if (__SKELETON_CHECK__) initial = '/components/skeleton'
else if (__TABS_CHECK__) initial = '/checks/tabs'
else if (__DIALOG_CHECK__) initial = '/checks/dialog'
else if (__TOAST_CHECK__) initial = '/checks/toast'
else if (__SELECT_CHECK__) initial = '/checks/select'
else if (__INPUT_CHECK__ === 'contract') initial = '/checks/input'
else if (__INPUT_CHECK__ === 'studio') initial = '/showcase/studio'
else if (__INPUT_CHECK__ === 'consumer') initial = '/checks/consumer'
else if (__INPUT_CHECK__ === 'demo') initial = '/components/input'
else if (__INPUT_CHECK__) initial = '/showcase/profile'
else if (__ACCESSIBILITY_CHECK__) initial = '/checks/accessibility'
else if (__SCREEN_CHECK__) initial = '/checks/screen'
else if (__LAYOUT_CHECK__) initial = __LAYOUT_NATIVE__ ? '/checks/layout/native' : '/checks/layout'
</script>

<template>
  <RouterView :initial="initial" />
</template>
