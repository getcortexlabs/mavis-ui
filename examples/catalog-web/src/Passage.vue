<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import PassageScene from './PassageScene.vue'
import { useCatalogLocale } from '../../catalog/shared/locale'
const route = useRoute(),
  router = useRouter(),
  { locale } = useCatalogLocale()
const navigate = async (detail: boolean) => {
  await router.push({ query: { ...route.query, story: detail ? 'coast' : undefined } })
}
</script>
<template>
  <m-screen scroll
    ><m-column padding="lg" gap="lg"
      ><m-link href="#/showcase">← Showcase</m-link
      ><PassageScene
        :detail="route.query.story === 'coast'"
        :navigate="navigate"
        :locale="locale" /></m-column
  ></m-screen>
</template>
