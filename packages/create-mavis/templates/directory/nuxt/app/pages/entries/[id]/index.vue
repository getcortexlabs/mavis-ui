<script setup lang="ts">
import Details from '__MAVIS_SHARED__/Details.vue'
const route = useRoute()
</script>
<template><Details :id="String(route.params.id)" /></template>
