<script setup lang="ts">
import { provide, ref } from 'vue'
import { catalogLocaleKey, createCatalogLocale } from '../components/locale'
import DepthCheck from '../components/pages/DepthCheck.vue'
provide(catalogLocaleKey, createCatalogLocale('en'))
const active = ref(true)
</script>
<template>
  <div>
    <button @click="active = !active">{{ active ? 'Deactivate depth' : 'Activate depth' }}</button>
    <KeepAlive><DepthCheck v-if="active" /></KeepAlive>
  </div>
</template>
