<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  value: 1234.5 as number,
  replay: 0 as number,
  text: 'Made to move' as string,
  animated: true as boolean,
})
</script>

<template>
  <MColumn gap="md">
    <MAnimatedText
      :text="state.text"
      :replayKey="state.replay"
      :animated="state.animated"
      by="word"
    />
    <MNumberFlow
      :value="state.value"
      locale="en-US"
      :format="{
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        currencyDisplay: undefined,
        useGrouping: undefined,
        minimumIntegerDigits: undefined,
      }"
      label="Revenue"
      :animated="state.animated"
    />
    <MNumberFlow
      :value="state.value"
      :formatValue="(value) => `${value.toFixed(1)} points`"
      :animated="state.animated"
      tone="primary"
    />
    <MButton
      text="Advance"
      @click="
        () => {
          state.value += 10
          state.replay += 1
          state.text = 'Sharing every platform'
        }
      "
    />
    <MButton
      :text="state.animated ? 'Disable motion' : 'Enable motion'"
      @click="() => (state.animated = !state.animated)"
    />
  </MColumn>
</template>
