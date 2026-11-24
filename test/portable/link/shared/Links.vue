<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  opened: 'nowhere' as string,
  clicks: 0 as number,
  off: false as boolean,
  go(href: string): void {
    state.opened = href
  },
})
</script>

<template>
  <MColumn id="page" gap="md">
    <MLink
      id="docs"
      href="https://mavis.example/docs"
      text="Documentation"
      :navigate="(href) => state.go(href)"
      @click="() => (state.clicks = state.clicks + 1)"
    />
    <MRow gap="xs">
      <MText id="lead" :grow="0">Read the</MText>
      <MLink
        id="guide"
        href="/guide"
        text="guide"
        :inline="true"
        :disabled="state.off"
        :navigate="(href) => state.go(href)"
      />
    </MRow>
    <MText>{{ `Opened ${state.opened}, ${state.clicks} clicks` }}</MText>
    <MButton text="Turn off" variant="secondary" @click="() => (state.off = !state.off)" />
  </MColumn>
</template>
