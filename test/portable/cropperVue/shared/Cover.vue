<script setup lang="ts">
import { ref } from 'vue'
import type { ImageCrop } from '@getcortexlabs/mavis-core'
import { MBox, MColumn, MImageCropper, MRow, MText } from '#mavis'

const crop = ref<ImageCrop | null>(null)
const loaded = ref('nothing yet')
const exported = ref('nothing yet')
</script>

<template>
  <MColumn gap="md" :width="320">
    <MBox id="cover">
      <MColumn :paddingX="77">
        <MColumn :height="122" />
        <MRow justify="between">
          <MColumn id="near" :width="6" :height="6" />
          <MColumn id="mid" :width="6" :height="6" />
        </MRow>
        <MColumn :height="154" />
        <MRow justify="end">
          <MColumn id="far" :width="6" :height="6" />
        </MRow>
      </MColumn>
      <MImageCropper
        v-model="crop"
        label="Cover"
        src="~/assets/cropper-scene.png"
        :animated="false"
        @load="(picture) => (loaded = `${picture.width} by ${picture.height}`)"
        @export="
          (picture) => (exported = `${picture.width} by ${picture.height} ${picture.mimeType}`)
        "
      />
    </MBox>
    <MText>Loaded {{ loaded }}</MText>
    <MText>Turned {{ crop?.rotation ?? 0 }}</MText>
    <MText>Exported {{ exported }}</MText>
  </MColumn>
</template>
