<script setup lang="ts">
import { MColumn, MGradientBackground, MText } from '#mavis'
</script>

<template>
  <MColumn gap="md" :width="320">
    <MGradientBackground id="still" :colors="['#102030', '#102030']" :height="120" radius="none">
      <MColumn id="still-layer" padding="md" justify="end">
        <MText tone="onPrimary">Make room for something good.</MText>
      </MColumn>
    </MGradientBackground>
    <m-gradient-background
      id="moving"
      :colors="['#416F68', '#51847B', '#61998E']"
      :angle="90"
      active
      :duration="2000"
      :height="160"
    >
      <MColumn id="moving-layer" padding="md">
        <MText tone="onPrimary">Turning</MText>
      </MColumn>
    </m-gradient-background>
    <MGradientBackground id="plain" :animated="false" />
  </MColumn>
</template>
