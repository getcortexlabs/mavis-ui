<script setup lang="ts">
import { MScreen, MColumn, MText, MButton } from '#mavis'
import { useScrollProbe } from './probe'
const probe = useScrollProbe()
</script>
<template>
  <MScreen
    ><MColumn padding="lg" gap="md"
      ><MText>{{ probe.report.value }}</MText
      ><MButton text="Run navigation checks" @click="probe.run()" /></MColumn
  ></MScreen>
</template>
