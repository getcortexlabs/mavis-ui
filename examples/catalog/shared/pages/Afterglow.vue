<script setup lang="ts">
import { inject } from 'vue'
import AfterglowScene from '../AfterglowScene.vue'
// Development checks ask for the scene's diagnostics; the showcase never shows them.
const debug = inject('mavis.afterglowDebug', false)
</script>
<template><AfterglowScene :debug="debug" /></template>
