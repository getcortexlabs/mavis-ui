<script setup lang="ts">
import * as mavisProbe from './shared/probe'

const store = mavisProbe.useToastProbe()
</script>

<template>
  <MColumn gap="md">
    <MText>{{ store.report.value }}</MText>
    <MButton text="Run toast checks" @click="() => store.run()" />
  </MColumn>
</template>
