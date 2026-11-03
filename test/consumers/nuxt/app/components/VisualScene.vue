<script setup lang="ts">
import { provide, ref } from 'vue'
import Lustre from './visual-catalog/pages/Lustre.vue'
import Current from './visual-catalog/pages/Current.vue'
import { catalogKey, createCatalog } from './visual-catalog/context'
import { catalogLocaleKey, createCatalogLocale } from './visual-catalog/locale'
const active = ref(true),
  current = ref(false)
provide(
  catalogKey,
  createCatalog({
    push: () => {},
    back: () => {
      active.value = false
    },
  }),
)
provide(catalogLocaleKey, createCatalogLocale('en'))
</script>
<template>
  <div>
    <button id="visual-active" @click="active = !active">
      {{ active ? 'Deactivate scene' : 'Activate scene' }}
    </button>
    <button id="visual-scene" @click="current = !current">Switch scene</button>
    <NuxtLink to="/">Leave visuals</NuxtLink>
    <KeepAlive>
      <component
        :is="current ? Current : Lustre"
        v-if="active"
        :key="current ? 'current' : 'lustre'"
      />
    </KeepAlive>
  </div>
</template>
