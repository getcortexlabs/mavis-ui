<script setup lang="ts">
import { provide } from 'vue'
import Welcome from '__MAVIS_SHARED__/Welcome.vue'
import { projectServiceKey } from '__MAVIS_SHARED__/services'
provide(projectServiceKey, {
  async save(_name) {
    /* Replace with your application service. */
  },
})
</script>
<template><Welcome /></template>
