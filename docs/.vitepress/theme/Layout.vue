<script setup>
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Home from './Home.vue'
const { frontmatter } = useData()
</script>

<template>
  <Home v-if="frontmatter.layout === 'landing'" />
  <DefaultTheme.Layout v-else />
</template>
