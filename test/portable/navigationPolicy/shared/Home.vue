<script setup lang="ts">
import * as mavisPageTransition from './shared/page-transition'
</script>

<template>
  <MScreen>
    <MColumn padding="lg" gap="md">
      <MText as="h1">Shared policy</MText>
      <MText>{{
        `${mavisPageTransition.pageTransition.name} ${mavisPageTransition.pageTransition.duration}`
      }}</MText>
      <MButton text="Open detail" href="/details/42" />
    </MColumn>
  </MScreen>
</template>
