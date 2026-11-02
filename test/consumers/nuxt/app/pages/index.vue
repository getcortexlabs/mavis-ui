<script setup lang="ts">
const route = useRoute()
const name = route.query.name === 'Marina' ? 'Marina' : 'Rafa'
const { data } = await useAsyncData(`profile:${name}`, () =>
  $fetch('/api/profile', { query: { name } }),
)
if (!data.value) throw createError({ statusCode: 503, statusMessage: 'Profile unavailable' })
</script>

<template>
  <PreferenceEditor v-if="data" :profile="data" :initialSheet="route.query.preview === '1'" />
</template>
