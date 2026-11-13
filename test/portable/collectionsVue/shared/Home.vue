<script setup lang="ts">
import { ref } from 'vue'
import { setSummary, mapSummary, keySummary } from './calculations'
const runs = ref(0)
</script>
<template>
  <MColumn gap="sm"
    ><MText>{{ setSummary() }}</MText
    ><MText>{{ mapSummary() }}</MText
    ><MText>{{ keySummary() }}</MText
    ><MText>{{ `Runs ${runs}` }}</MText
    ><MButton text="Calculate again" @click="runs += 1"
  /></MColumn>
</template>
