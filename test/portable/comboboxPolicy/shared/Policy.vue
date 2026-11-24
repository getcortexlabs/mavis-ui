<script setup lang="ts">
import * as mavisProbe from './shared/probe'

const store = mavisProbe.useSearchProbe()
</script>

<template>
  <MColumn gap="md">
    <MText>{{ store.report.value }}</MText>
    <MButton text="Run search checks" @click="() => store.run()" />
  </MColumn>
</template>
