<script setup lang="ts">
import { ref } from 'vue'

const opened = ref('nowhere')
const clicks = ref(0)
const off = ref(false)

function go(href: string) {
  opened.value = href
}
</script>

<template>
  <MColumn id="page" gap="md">
    <MLink id="docs" href="https://mavis.example/docs" :navigate="go" @click="clicks = clicks + 1">
      Documentation
    </MLink>
    <MRow gap="xs">
      <MText id="lead" :grow="0">Read the</MText>
      <m-link id="guide" href="/guide" text="guide" inline :disabled="off" :navigate="go" />
    </MRow>
    <MText>Opened {{ opened }}, {{ clicks }} clicks</MText>
    <MButton variant="secondary" @click="off = !off">Turn off</MButton>
  </MColumn>
</template>
