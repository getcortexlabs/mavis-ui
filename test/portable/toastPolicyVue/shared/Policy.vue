<script setup lang="ts">
import { useToastProbe } from './probe'
const store = useToastProbe()
</script>
<template>
  <MColumn gap="md"
    ><MText>{{ store.report.value }}</MText
    ><MButton text="Run toast checks" @click="store.run()"
  /></MColumn>
</template>
