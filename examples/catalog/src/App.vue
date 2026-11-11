<script setup lang="ts">
declare const __ADVANCED_CHECK__: boolean
declare const __CREATIVE_CHECK__: boolean
declare const __DASHBOARD_CHECK__: boolean
declare const __SCREEN_COMPONENTS_CHECK__: boolean
declare const __INTERACTIVE_CHECK__: boolean
declare const __WAYFINDING_CHECK__: boolean
declare const __DISCOVERY_CHECK__: boolean
declare const __COLLECTION_CHECK__: boolean
declare const __CONFIGURATOR_CHECK__: boolean
declare const __GRID_CHECK__: boolean
declare const __PLATFORM_CHECK__: boolean
declare const __POINTER_CHECK__: boolean
declare const __DEPTH_CHECK__: boolean
declare const __VISUAL_CHECK__: boolean
declare const __COMPOSITION_CHECK__: boolean
declare const __MOTION_CHECK__: string
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
if (__COLLECTION_CHECK__) initial = '/checks/collections'
if (__INTERACTIVE_CHECK__) initial = '/checks/interactive'
if (__SCREEN_COMPONENTS_CHECK__) initial = '/checks/screen-components'
if (__CREATIVE_CHECK__) initial = '/checks/creative'
if (__ADVANCED_CHECK__) initial = '/checks/advanced'
else if (__DASHBOARD_CHECK__) initial = '/checks/dashboard'
else if (__WAYFINDING_CHECK__) initial = '/checks/wayfinding'
else if (__DISCOVERY_CHECK__) initial = '/checks/discovery'
else if (__GRID_CHECK__) initial = '/checks/grid/native'
else if (__POINTER_CHECK__) initial = '/showcase/afterglow'
else if (__DEPTH_CHECK__) initial = '/checks/depth'
else if (__PLATFORM_CHECK__) initial = '/showcase/prism'
else if (__VISUAL_CHECK__) initial = '/showcase/lustre'
else if (__CONFIGURATOR_CHECK__) initial = '/showcase/forma'
else if (__MOTION_CHECK__ === 'lustre' || __MOTION_CHECK__ === 'current')
  initial = `/showcase/${__MOTION_CHECK__}`
else if (__COMPOSITION_CHECK__) initial = '/checks/composition'
else if (__MOTION_CHECK__)
  initial =
    __MOTION_CHECK__ === 'tempo'
      ? '/showcase/tempo'
      : __MOTION_CHECK__ === 'probe'
        ? '/checks/continuous/native'
        : __MOTION_CHECK__ === 'afterglow'
          ? '/showcase/afterglow'
          : __MOTION_CHECK__ === 'lifecycles'
            ? '/checks/lifecycles'
            : __MOTION_CHECK__ === 'field'
              ? '/showcase/field-guide'
              : __MOTION_CHECK__ === 'kinetic'
                ? '/showcase/kinetic'
                : '/checks/motion'
else if (__PRESS_CHECK__) initial = '/checks/press'
else if (__PERFORMANCE_CHECK__) initial = '/checks/performance'
else if (__IDENTITY_CHECK__) initial = `/components/${__IDENTITY_CHECK__}`
else if (__SKELETON_CHECK__) initial = '/components/skeleton'
else if (__TABS_CHECK__) initial = '/checks/tabs'
else if (__DIALOG_CHECK__) initial = '/checks/dialog'
else if (__TOAST_CHECK__) initial = '/checks/toast'
else if (__SELECT_CHECK__) initial = '/checks/select'
else if (__INPUT_CHECK__ === 'contract') initial = '/checks/input'
else if (__INPUT_CHECK__ === 'auth') initial = '/showcase/morrow'
else if (__INPUT_CHECK__ === 'studio') initial = '/showcase/studio'
else if (__INPUT_CHECK__ === 'consumer') initial = '/checks/consumer'
else if (__INPUT_CHECK__ === 'files') initial = '/checks/files'
else if (__INPUT_CHECK__ === 'date') initial = '/checks/date'
else if (__INPUT_CHECK__ === 'combobox') initial = '/checks/combobox'
else if (__INPUT_CHECK__ === 'workflows') initial = '/checks/workflows'
else if (__INPUT_CHECK__ === 'gather') initial = '/showcase/gather'
else if (__INPUT_CHECK__ === 'forma') initial = '/showcase/forma'
else if (__INPUT_CHECK__ === 'demo') initial = '/components/input'
else if (__INPUT_CHECK__) initial = '/showcase/profile'
else if (__ACCESSIBILITY_CHECK__) initial = '/checks/accessibility'
else if (__SCREEN_CHECK__) initial = '/checks/screen'
else if (__LAYOUT_CHECK__) initial = __LAYOUT_NATIVE__ ? '/checks/layout/native' : '/checks/layout'
</script>

<template>
  <RouterView :initial="initial" />
</template>
