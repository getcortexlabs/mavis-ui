<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { cropQuadrants } from '../assets/crop-quadrants'
import type { ImageCrop, CropExport } from '@getcortexlabs/mavis-core'
const crop = ref<ImageCrop | null>(null),
  image = ref<CropExport>()
onBeforeUnmount(() => {
  void image.value?.dispose()
})
</script>
<template>
  <MScreen scroll
    ><MColumn padding="md" gap="md"
      ><MImageCropper
        v-model="crop"
        :src="cropQuadrants"
        label="Quadrants"
        :animated="false"
        :output="{ mimeType: 'image/png', quality: 1, width: 40 }"
        @export="image = $event" /><MImage
        v-if="image"
        :src="image.uri"
        :height="100"
        alt="Pixel evidence" /></MColumn
  ></MScreen>
</template>
