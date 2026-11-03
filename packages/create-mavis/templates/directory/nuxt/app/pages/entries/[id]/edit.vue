<script setup lang="ts">
import Edit from '__MAVIS_SHARED__/Edit.vue'
const route = useRoute()
</script>
<template><Edit :id="String(route.params.id)" /></template>
