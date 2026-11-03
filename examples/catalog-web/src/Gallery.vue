<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useCatalogLocale } from '../../catalog/shared/locale'
import GalleryScene from './GalleryScene.vue'
const route = useRoute(),
  router = useRouter(),
  { locale } = useCatalogLocale()
async function navigate(key: string | undefined, signal?: AbortSignal) {
  if (signal?.aborted) return false
  await router.push({ query: { ...route.query, photo: key } })
}
</script>
<template>
  <m-screen scroll
    ><m-column padding="lg" gap="lg"
      ><m-link href="#/showcase">← Showcase</m-link>
      <GalleryScene
        :selected="typeof route.query.photo === 'string' ? route.query.photo : undefined"
        :navigate="navigate"
        :locale="locale"
      /> </m-column
  ></m-screen>
</template>
