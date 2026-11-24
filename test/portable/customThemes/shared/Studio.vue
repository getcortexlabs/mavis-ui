<script setup lang="ts">
import { reactive } from 'vue'
import LocalCount from './LocalCount.vue'
import {
  studioDark as mavisTheme_project_5924926a4049,
  studioLight as mavisTheme_project_cf1bd05232bc,
} from './shared/studio-theme'

const state = reactive({
  night: false as boolean,
  draft: 'Original' as string,
})
</script>

<template>
  <MThemeProvider
    :theme="mavisTheme_project_cf1bd05232bc"
    :darkTheme="mavisTheme_project_5924926a4049"
    :appearance="state.night ? 'dark' : 'light'"
  >
    <MColumn id="studio" gap="md">
      <MCard id="studio-card">
        <MBox :height="24" />
      </MCard>
      <MRow gap="xs">
        <MBox id="first-swatch" :width="20" :height="20" backgroundColor="#305090" />
        <MBox id="second-swatch" :width="20" :height="20" backgroundColor="#7090C0" />
      </MRow>
      <MText variant="body">Custom studio</MText>
      <MInput
        label="Theme draft"
        :modelValue="state.draft"
        @update:modelValue="(value) => (state.draft = value)"
      />
      <MText>{{ state.draft }}</MText>
      <LocalCount />
      <MThemeProvider appearance="light">
        <MCard id="nested-light">
          <MBox :height="24" />
        </MCard>
      </MThemeProvider>
      <MButton
        id="theme-toggle"
        :text="state.night ? 'Use daylight' : 'Use night'"
        @click="() => (state.night = !state.night)"
      />
      <MButton text="Set draft" @click="() => (state.draft = 'Retained')" />
    </MColumn>
  </MThemeProvider>
</template>
