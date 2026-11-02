<script setup lang="ts">
import { ref, KeepAlive } from 'vue'
import AfterglowScene from '../AfterglowScene.vue'
const active = ref(true)
</script>
<template>
  <m-column :height="'100%'">
    <m-button size="sm" @click="active = !active">{{
      active ? 'Deactivate scene' : 'Activate scene'
    }}</m-button>
    <KeepAlive><AfterglowScene v-if="active" debug /></KeepAlive>
  </m-column>
</template>
