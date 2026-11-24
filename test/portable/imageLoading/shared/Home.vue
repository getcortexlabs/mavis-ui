<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  eager: 0 as number,
  lazy: 0 as number,
  errors: 0 as number,
  source: '~/assets/gallery-blue.png' as string,
})
</script>

<template>
  <MScreen id="image-scroll" :scroll="true">
    <MColumn gap="sm" padding="md">
      <MButton
        text="Switch hidden"
        @click="
          () =>
            (state.source =
              state.source === '~/assets/gallery-blue.png'
                ? '~/assets/gallery-green.png'
                : '~/assets/gallery-blue.png')
        "
      />
      <MText>{{
        'Eager ' + state.eager + ' / Lazy ' + state.lazy + ' / Errors ' + state.errors
      }}</MText>
      <MColumn :height="8000" />
      <MImage
        src="~/assets/gallery-blue.png"
        alt="Eager"
        loading="eager"
        :width="180"
        :height="120"
        @load="() => (state.eager += 1)"
        @error="() => (state.errors += 1)"
      />
      <MImage
        :src="state.source"
        alt="Lazy"
        loading="lazy"
        :width="180"
        :height="120"
        @load="() => (state.lazy += 1)"
        @error="() => (state.errors += 1)"
      />
    </MColumn>
  </MScreen>
</template>
