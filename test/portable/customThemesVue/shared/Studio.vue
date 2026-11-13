<script setup lang="ts">
import { ref } from 'vue'
import { studioLight, studioDark } from './studio-theme'
import LocalCount from './LocalCount.vue'
const night = ref(false)
const draft = ref('Original')
</script>
<template>
  <MThemeProvider
    :theme="studioLight"
    :darkTheme="studioDark"
    :appearance="night ? 'dark' : 'light'"
  >
    <MColumn id="studio" gap="md">
      <MCard id="studio-card"><MBox :height="24" /></MCard>
      <MRow gap="xs"
        ><MBox id="first-swatch" :width="20" :height="20" backgroundColor="#305090" /><MBox
          id="second-swatch"
          :width="20"
          :height="20"
          backgroundColor="#7090C0"
      /></MRow>
      <MText variant="body">Custom studio</MText>
      <MInput label="Theme draft" v-model="draft" />
      <MText>{{ draft }}</MText>
      <LocalCount />
      <MThemeProvider appearance="light"
        ><MCard id="nested-light"><MBox :height="24" /></MCard
      ></MThemeProvider>
      <MButton
        id="theme-toggle"
        :text="night ? 'Use daylight' : 'Use night'"
        @click="night = !night"
      />
      <MButton text="Set draft" @click="draft = 'Retained'" />
    </MColumn>
  </MThemeProvider>
</template>
