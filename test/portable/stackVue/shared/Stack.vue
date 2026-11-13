<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MCard, MColumn, MScreen, MStack, MText } from '#mavis'

const wide = ref(false)
</script>

<template>
  <MScreen id="stack-screen">
    <m-stack
      id="stack-window"
      padding="lg"
      gap="sm"
      :responsive="[
        { at: 720, direction: 'row', justify: 'between' },
        { at: 400, gap: 'lg' },
      ]"
    >
      <MCard id="window-one" padding="sm"><MText>One</MText></MCard>
      <MCard id="window-two" padding="sm"><MText>Two</MText></MCard>
      <MCard id="window-three" padding="sm"><MText>Three</MText></MCard>
    </m-stack>
    <MColumn paddingX="lg" gap="sm">
      <MButton :text="wide ? 'Narrow' : 'Widen'" @click="wide = !wide" />
      <MColumn id="stack-box" :width="wide ? 340 : 240">
        <MStack id="stack-inner" gap="sm" :responsive="{ at: 300, direction: 'row', gap: 'md' }">
          <MCard id="inner-one" padding="sm"><MText>Left</MText></MCard>
          <MCard id="inner-two" padding="sm"><MText>Right</MText></MCard>
        </MStack>
      </MColumn>
    </MColumn>
  </MScreen>
</template>
