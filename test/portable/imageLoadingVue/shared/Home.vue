<script setup lang="ts">
import { ref } from 'vue'
const eager = ref(0)
const lazy = ref(0)
const errors = ref(0)
const source = ref('~/assets/gallery-blue.png')
</script>
<template>
  <MScreen id="image-scroll" scroll
    ><MColumn gap="sm" padding="md">
      <MButton
        text="Switch hidden"
        @click="
          source =
            source === '~/assets/gallery-blue.png'
              ? '~/assets/gallery-green.png'
              : '~/assets/gallery-blue.png'
        "
      />
      <MText>{{ 'Eager ' + eager + ' / Lazy ' + lazy + ' / Errors ' + errors }}</MText>
      <MColumn :height="8000" />
      <MImage
        src="~/assets/gallery-blue.png"
        alt="Eager"
        loading="eager"
        :width="180"
        :height="120"
        @load="eager++"
        @error="errors++"
      />
      <MImage
        :src="source"
        alt="Lazy"
        loading="lazy"
        :width="180"
        :height="120"
        @load="lazy++"
        @error="errors++"
      /> </MColumn
  ></MScreen>
</template>
