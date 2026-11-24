<script setup lang="ts">
import { reactive } from 'vue'
import { mavis, midnight } from '@getcortexlabs/mavis-core'

const state = reactive({
  night: true as boolean,
})
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
      <MThemeProvider appearance="light">
        <MCard id="nested-card">
          <MBox :height="24" />
        </MCard>
      </MThemeProvider>
    </MThemeProvider>
    <MThemeProvider :appearance="state.night ? 'dark' : 'light'">
      <MCard id="switch-card">
        <MBox :height="24" />
      </MCard>
    </MThemeProvider>
    <MThemeProvider :theme="mavis" :darkTheme="midnight" appearance="dark">
      <MCard id="pair-card">
        <MBox :height="24" />
      </MCard>
    </MThemeProvider>
    <MButton
      :text="state.night ? 'Daylight' : 'Night'"
      @click="() => (state.night = !state.night)"
    />
    <MPlatform only="macos">
      <template #fallback>
        <MText>Elsewhere</MText>
      </template>
      <MText>On the Mac</MText>
    </MPlatform>
    <MPlatform :only="['web', 'native']">
      <MText>Web or touch</MText>
    </MPlatform>
  </MColumn>
</template>
