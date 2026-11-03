<script setup lang="ts">
import { provide, ref } from 'vue'
import Prism from './visual-catalog/pages/Prism.vue'
import Orbit from './visual-catalog/pages/Orbit.vue'
import { catalogKey, createCatalog } from './visual-catalog/context'
import { catalogLocaleKey, createCatalogLocale } from './visual-catalog/locale'
const active = ref(true),
  scene = ref('prism'),
  detail = ref(false)
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
    <KeepAlive
      ><component :is="scene === 'prism' ? Prism : Orbit" v-if="active" :key="scene"
    /></KeepAlive>
    <PassageScene :detail="detail" :navigate="navigate" />
  </div>
</template>
