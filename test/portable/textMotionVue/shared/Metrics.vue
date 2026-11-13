<script setup lang="ts">
import { ref } from 'vue'
import { MAnimatedText, MNumberFlow, MColumn, MButton } from '#mavis'
const value = ref(1234.5)
const replay = ref(0)
const text = ref('Made to move')
const animated = ref(true)
</script>
<template>
  <MColumn gap="md">
    <MAnimatedText :text="text" :replayKey="replay" :animated="animated" by="word" />
    <MNumberFlow
      :value="value"
      locale="en-US"
      :format="{
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }"
      label="Revenue"
      :animated="animated"
    />
    <MNumberFlow
      :value="value"
      :formatValue="(value) => `${value.toFixed(1)} points`"
      :animated="animated"
      tone="primary"
    />
    <MButton
      text="Advance"
      @click="
        () => {
          value += 10
          replay += 1
          text = 'Sharing every platform'
        }
      "
    />
    <MButton :text="animated ? 'Disable motion' : 'Enable motion'" @click="animated = !animated" />
  </MColumn>
</template>
