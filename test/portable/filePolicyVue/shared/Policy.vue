<script setup lang="ts">
import { MButton, MColumn, MText } from '#mavis'
import { useFileProbe } from './probe'
const store = useFileProbe()
</script>
<template>
  <MColumn gap="md"
    ><MText>{{ store.report.value }}</MText
    ><MButton text="Run file checks" @click="store.run()"
  /></MColumn>
</template>
