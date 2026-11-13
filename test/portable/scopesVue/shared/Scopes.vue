<script setup lang="ts">
import { ref } from 'vue'
import { mavis, midnight } from '@getcortexlabs/mavis-core'

const night = ref(true)
</script>

<template>
  <MColumn id="scopes" gap="md">
    <MCard id="day-card">
      <MBox :height="24" />
    </MCard>
    <MThemeProvider :theme="midnight">
      <MCard id="night-card">
        <MBox :height="24" />
      </MCard>
      <MCard id="night-words">
        <MText>Under midnight</MText>
      </MCard>
      <m-theme-provider appearance="light">
        <MCard id="nested-card">
          <MBox :height="24" />
        </MCard>
      </m-theme-provider>
    </MThemeProvider>
    <m-theme-provider :appearance="night ? 'dark' : 'light'">
      <MCard id="switch-card">
        <MBox :height="24" />
      </MCard>
    </m-theme-provider>
    <MThemeProvider :theme="mavis" :dark-theme="midnight" appearance="dark">
      <MCard id="pair-card">
        <MBox :height="24" />
      </MCard>
    </MThemeProvider>
    <MButton :text="night ? 'Daylight' : 'Night'" @click="night = !night" />
    <MPlatform only="macos">
      <MText>On the Mac</MText>
      <template #fallback>
        <MText>Elsewhere</MText>
      </template>
    </MPlatform>
    <m-platform :only="['web', 'native']">
      <MText>Web or touch</MText>
      <template v-slot:fallback />
    </m-platform>
  </MColumn>
</template>
