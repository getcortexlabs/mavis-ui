<script setup lang="ts">
import { ref } from 'vue'
import AfterglowScene from '../components/AfterglowScene.vue'
const active = ref(true)
</script>
<template>
  <div>
    <button @click="active = !active">{{ active ? 'Deactivate scene' : 'Activate scene' }}</button>
    <NuxtLink to="/">Leave motion</NuxtLink>
    <KeepAlive><AfterglowScene v-if="active" debug /></KeepAlive>
  </div>
</template>
