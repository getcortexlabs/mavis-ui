<script setup lang="ts">
import { reactive } from 'vue'
import type { ImageCrop } from './types'

const state = reactive({
  crop: undefined as ImageCrop | undefined,
  loaded: 'nothing yet' as string,
  exported: 'nothing yet' as string,
})
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
        label="Cover"
        src="~/assets/cropper-scene.png"
        :modelValue="state.crop"
        @update:modelValue="(value) => (state.crop = value)"
        :animated="false"
        @load="(picture) => (state.loaded = `${picture.width} by ${picture.height}`)"
        @export="
          (picture) =>
            (state.exported = `${picture.width} by ${picture.height} ${picture.mimeType}`)
        "
      />
    </MBox>
    <MText>{{ `Loaded ${state.loaded}` }}</MText>
    <MText>{{ `Turned ${state.crop?.rotation ?? 0}` }}</MText>
    <MText>{{ `Exported ${state.exported}` }}</MText>
  </MColumn>
</template>
