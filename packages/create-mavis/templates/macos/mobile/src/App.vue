<script setup lang="ts">
import Root, { screen } from './generated/entry'
</script>
<template>
  <Frame>
    <!-- A screen with an MScreen of its own is the page; any other gets one around it. -->
    <Root v-if="screen" />
    <MScreen v-else scroll>
      <MColumn padding="lg">
        <Root />
      </MColumn>
    </MScreen>
  </Frame>
</template>
