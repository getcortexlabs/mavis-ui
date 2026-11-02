<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
import { formaImage } from '../assets/forma-image'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const broken = ref(false)
</script>
<template>
  <m-column gap="md">
    <m-image
      id="image-demo"
      :src="broken ? 'data:image/png;base64,broken' : formaImage"
      :alt="
        pt
          ? 'Gravura Forma com arcos azuis e círculos rosa'
          : 'Forma art print with blue arches and pink circles'
      "
      :aspectRatio="4 / 3"
      :loadingLabel="pt ? 'Carregando imagem' : 'Loading image'"
      :errorLabel="pt ? 'Imagem indisponível' : 'Image unavailable'"
    />
    <m-switch v-model="broken" :label="pt ? 'Simular erro' : 'Simulate error'" />
  </m-column>
</template>
