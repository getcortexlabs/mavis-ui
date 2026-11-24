<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  wide: false as boolean,
})
</script>

<template>
  <MScreen id="stack-screen">
    <MStack
      id="stack-window"
      padding="lg"
      gap="sm"
      :responsive="[
        { at: 400, gap: 'lg' },
        { at: 720, direction: 'row', justify: 'between' },
      ]"
    >
      <MCard id="window-one" padding="sm">
        <MText>One</MText>
      </MCard>
      <MCard id="window-two" padding="sm">
        <MText>Two</MText>
      </MCard>
      <MCard id="window-three" padding="sm">
        <MText>Three</MText>
      </MCard>
    </MStack>
    <MColumn paddingX="lg" gap="sm">
      <MButton :text="state.wide ? 'Narrow' : 'Widen'" @click="() => (state.wide = !state.wide)" />
      <MColumn id="stack-box" :width="state.wide ? 340 : 240">
        <MStack id="stack-inner" gap="sm" :responsive="[{ at: 300, direction: 'row', gap: 'md' }]">
          <MCard id="inner-one" padding="sm">
            <MText>Left</MText>
          </MCard>
          <MCard id="inner-two" padding="sm">
            <MText>Right</MText>
          </MCard>
        </MStack>
      </MColumn>
    </MColumn>
  </MScreen>
</template>
