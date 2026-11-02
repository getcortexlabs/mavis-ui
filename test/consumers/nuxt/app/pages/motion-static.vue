<script setup lang="ts">
import { provide } from 'vue'
import { catalogLocaleKey, createCatalogLocale } from '../components/locale'
provide(catalogLocaleKey, createCatalogLocale('en'))
import AfterglowScene from '../components/AfterglowScene.vue'
</script>
<template><AfterglowScene /></template>
