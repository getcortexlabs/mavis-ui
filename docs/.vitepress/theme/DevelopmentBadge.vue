<script setup>
import { useData } from 'vitepress'
const { lang } = useData()
</script>

<template>
  <span class="development-badge">{{ lang === 'pt-BR' ? 'em desenvolvimento' : 'in development' }}</span>
</template>
