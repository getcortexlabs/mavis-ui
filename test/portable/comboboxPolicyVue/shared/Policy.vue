<script setup lang="ts">
import { MButton, MColumn, MText } from '#mavis'
import { useSearchProbe } from './probe'
const store = useSearchProbe()
</script>
<template>
  <MColumn gap="md"
    ><MText>{{ store.report.value }}</MText
    ><MButton text="Run search checks" @click="store.run()"
  /></MColumn>
</template>
