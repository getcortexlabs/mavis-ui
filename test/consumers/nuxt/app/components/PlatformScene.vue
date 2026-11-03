<script setup lang="ts">
import { provide, ref } from 'vue'
import Prism from './visual-catalog/pages/Prism.vue'
import Orbit from './visual-catalog/pages/Orbit.vue'
import Field from './visual-catalog/pages/Field.vue'
import { catalogKey, createCatalog } from './visual-catalog/context'
import { catalogLocaleKey, createCatalogLocale } from './visual-catalog/locale'
const active = ref(true),
  scene = ref('prism'),
  detail = ref(false)
const photo = ref<string>()
async function navigatePhoto(next: string | undefined, signal?: AbortSignal) {
  if (!signal?.aborted) photo.value = next
}
provide(
  catalogKey,
  createCatalog({
    push() {},
    back() {
      active.value = false
    },
  }),
)
provide(catalogLocaleKey, createCatalogLocale('en'))
async function navigate(next: boolean) {
  await Promise.resolve()
  detail.value = next
}
</script>
<template>
  <div>
    <button id="platform-active" @click="active = !active">Toggle active</button>
    <button id="platform-orbit" @click="scene = 'orbit'">Orbit</button>
    <button id="platform-prism" @click="scene = 'prism'">Prism</button>
    <button id="platform-field" @click="scene = 'field'">Field</button>
    <KeepAlive
      ><component
        :is="scene === 'prism' ? Prism : scene === 'field' ? Field : Orbit"
        v-if="active"
        :key="scene"
    /></KeepAlive>
    <PassageScene :detail="detail" :navigate="navigate" />
    <GalleryScene :selected="photo" :navigate="navigatePhoto" />
  </div>
</template>
