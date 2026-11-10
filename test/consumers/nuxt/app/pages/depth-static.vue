<script setup lang="ts">
import { provide } from 'vue'
import { catalogLocaleKey, createCatalogLocale } from '../components/locale'
import DepthCheck from '../components/pages/DepthCheck.vue'
provide(catalogLocaleKey, createCatalogLocale('en'))
</script>
<template><DepthCheck /></template>
